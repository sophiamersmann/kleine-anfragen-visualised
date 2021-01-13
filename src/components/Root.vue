<template>
  <main :class=classes>
    <div class="wrapper">
      <section class="main-text">
        <h1>Kleine Anfragen visualisiert</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
          nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </section>

      <section class="bundestag">
        <div
          v-for="row in tiles.filter((d) => d.body === 'Bundestag')"
          :key=row.body>
        <election-period
          v-for="period in row.periods"
          :key=period.name
          :name=period.name
          :body=period.body
          :term=period.term
          :dates=period.dates
          :has-ended=period.hasEnded
          :period-num=period.periodNum
          :requests=period.requests
          :requestsPerHead=period.requestsPerHead
          :elections=period.elections
          @top="onTop" />
        </div>
      </section>
    </div>

    <div class="tiles tiles-landtage">
      <div class="row">
      <div class="col-1">Aktuelle Legislaturperiode</div>
      <div class="col-2">Letzte Legislaturperiode</div>
      <div class="col-3">Vorletzte Legislaturperiode</div>
    </div>
    <div
      v-for="row in tiles.filter((d) => d.body !== 'Bundestag')"
      :key=row.body
      class="row">
      <election-period
        v-for="period in row.periods"
        :key=period.name
        :name=period.name
        :body=period.body
        :term=period.term
        :dates=period.dates
        :has-ended=period.hasEnded
        :period-num=period.periodNum
        :requests=period.requests
        :requestsPerHead=period.requestsPerHead
        :elections=period.elections
        @top="onTop" />
      </div>
    </div>
  </main>
  <transition name="scale">
    <popup
      v-if="popup"
      :name=popup.key
      :body=popup.body
      :term=popup.term
      :dates=popup.dates
      :has-ended=popup.hasEnded
      :requests=popup.requests
      :elections=popup.elections />
  </transition>
  <transition name="fade">
    <div
      v-if="popup"
      class="overlay"
      @click="onFlat" />
  </transition>
  <div class="tooltip tooltip-question" />
  <div class="tooltip tooltip-seat" />
</template>

<script>
import d3 from '@/assets/d3';

import { getTermId } from '@/core/utils';

import ElectionPeriod from './ElectionPeriod.vue';
import Popup from './Popup.vue';

export default {
  name: 'Root',
  components: {
    ElectionPeriod,
    Popup,
  },
  props: {
    srcRequests: String,
    srcElections: String,
    srcRequestsPerHead: String,
  },
  computed: {
    classes() {
      return {
        background: this.popup,
      };
    },
  },
  data() {
    return {
      requests: [],
      elections: [],
      tiles: [],
      tileMap: null,
      popup: null,
    };
  },
  async created() {
    await this.fetchElectionsData();
    await this.fetchRequestsPerHeadData();

    const keyFunc = (d) => getTermId(d.body, d.term);
    const electionsMap = d3.group(this.elections, keyFunc);
    const requestsPerHeadMap = d3.group(this.requestsPerHead, keyFunc);

    const groupedElections = Array.from(electionsMap)
      .map(([key, electionResults]) => {
        const {
          body, term, dates, hasEnded, periodNum,
        } = electionResults[0];

        return {
          key,
          name: getTermId(body, term),
          body,
          term,
          dates,
          hasEnded,
          periodNum,
          elections: electionResults.map(({
            party, seats, isOpposition,
          }) => ({ party, seats, isOpposition })),
          requestsPerHead: requestsPerHeadMap.get(key).map(({
            name, party, isOpposition, nRequests, nRequestsPerDay,
          }) => ({
            name, party, isOpposition, nRequests, nRequestsPerDay,
          })),
          requests: null,
        };
      });

    this.computeTiles(groupedElections);
    this.tileMap = d3.rollup(groupedElections, (v) => v[0], (d) => d.name);

    // this.fetchRequestsData().then((fetchedRequests) => {
    //   this.requests = fetchedRequests;

    //   // To do: This takes too long
    //   const merged = d3.groups(this.requests, keyFunc)
    //     .map(([key, requests]) => ({
    //       key,
    //       name: getTermId(requests[0].body, requests[0].term),
    //       body: requests[0].body,
    //       term: requests[0].term,
    //       dates: electionsMap.get(key)[0].dates,
    //       hasEnded: electionsMap.get(key)[0].hasEnded,
    //       periodNum: electionsMap.get(key)[0].periodNum,
    //       requests: requests.map(({ body, term, ...rest }) => rest),
    //       elections: electionsMap.get(key).map(({
    //         body, term, dates, hasEnded, periodNum, ...rest
    //       }) => rest),
    //     }));

    //   this.computeTiles(merged);
    //   this.tileMap = d3.rollup(merged, (v) => v[0], (d) => d.name);
    // });
  },
  methods: {
    async fetchRequestsPerHeadData() {
      this.requestsPerHead = await d3.csv(this.srcRequestsPerHead, (d) => ({
        body: d.body,
        term: d.term,
        periodNum: +d.period_num,
        name: d.person,
        party: d.party,
        isOpposition: d.is_opposition.toLowerCase() === 'true',
        nRequests: +d.n_requests,
        nRequestsPerDay: +d.n_requests_per_day,
      }));
    },
    async fetchElectionsData() {
      const parseTime = d3.timeParse('%d/%m/%Y');
      this.elections = await d3.csv(this.srcElections, (d) => ({
        body: d.body,
        term: d.term,
        dates: {
          start: parseTime(d.start_date),
          end: d.end_date ? parseTime(d.end_date) : new Date(2020, 11, 31),
        },
        hasEnded: d.end_date !== '',
        periodNum: +d.period_num,
        party: d.party,
        seats: +d.seats,
        isOpposition: d.opposition.toLowerCase() === 'true',
      }));
    },
    fetchRequestsData() {
      const parseTime = d3.timeParse('%Y-%m-%d');
      const asArray = (str) => str.split(';').map((s) => s.trim());
      return d3.csv(this.srcRequests, (d) => ({
        body: d.body,
        term: d.legislative_term,

        reference: d.reference,
        rawDate: d.published_at,
        date: parseTime(d.published_at.split('T')[0]),
        title: d.title,
        type: d.interpellation_type,
        url: d.html_url,
        source: d.source_url,

        parties: asArray(d.inquiring_parties),
        inquiringPeople: asArray(d.inquiring_people_corr),

        ministries: asArray(d.answering_ministries_corr),
        ministriesUrl: asArray(d.answering_ministries_url),

        pageCount: d.page_count,
        containsClassifiedInformation: d.contains_classified_information === 'True',
      }));
    },
    computeTiles(grouped) {
      this.tiles = d3.groups(grouped, (d) => d.body)
        .map(([body, periods]) => ({
          body,
          periods: periods
            .sort((a, b) => d3.ascending(a.periodNum, b.periodNum)),
        }))
        .sort((a, b) => d3.ascending(a.body, b.body));
    },
    onTop(key) {
      this.popup = this.tileMap.get(key);
    },
    onFlat() {
      this.popup = null;
    },
  },
};
</script>

<style>
main {
  padding: calc(2 * var(--spacing));
  transition: filter 0.2s ease;
}

.background {
  filter: blur(4px);
  transition: filter 0.2s ease-in;
  height: 100vh;
  overflow: hidden;
}

.wrapper {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: var(--spacing);
}

h1 {
  text-align: center;
}

.bundestag .election-period {
  margin: var(--spacing);
}

.tiles .row {
  margin: var(--spacing) 0;
  display: grid;
  grid-gap: calc(var(--spacing) / 2);
}

.tiles-landtage .row {
  grid-template-columns: repeat(3, 1fr);
}

.tiles-landtage .col-1 {
  grid-column: 1 / 2;
}

.tiles-landtage .col-2 {
  grid-column: 2 / 3;
}

.tiles-landtage .col-3 {
  grid-column: 3 / 4;
}

.overlay {
  background-color: rgba(0, 0, 0, 0.2);

  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.fade-enter-active,
.scale-enter-active  {
  transition: all 0.2s ease-in;
}

.fade-leave-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

.tooltip {
  position: absolute;
  width: 250px;
  background: lightsteelblue;
  left: 10px;
  top: 10px;
  z-index: 3000;
  pointer-events: none;
  opacity: 0;
}
</style>
