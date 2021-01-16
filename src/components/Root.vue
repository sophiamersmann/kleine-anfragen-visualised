<template>
  <main :class=classes>
    <div class="top">
      <div class="introduction">
        <h1><a href="https://kleineanfragen.de/" target="blank">kleineAnfragen.de</a> visualisiert</h1>
        <div class="p">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
          nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </div>
        <div class="p">
          Kategorien:
          <div class="legend legend-seat-chart">
            <div
            class="legend-line"
            v-for="(line, i) in legend"
            :key=i
            >
            <div class="legend-line--chart" :id=line.chartId></div>
              {{ line.label }}
            </div>
          </div>
        </div>
      </div>

      <div class="tiles tiles-bundestag">
        <election-period
          v-for="period in tilesBundestag.periods"
          :key=period.name
          :name=period.name
          :body=period.body
          :term=period.term
          :dates=period.dates
          :has-ended=period.hasEnded
          :period-num=period.periodNum
          :n-requests=period.nRequests
          :requestsPerHead=period.requestsPerHead
          :elections=period.elections
          @top="onTop" />
      </div>
    </div>

    <div class="tiles tiles-landtage">
      <div class="row row-header">
      <div class="col-1">AKTUELLE LEGISLATURPERIODE</div>
      <div class="col-2">LETZTE LEGISLATURPERIODE</div>
      <div class="col-3">VORLETZTE LEGISLATURPERIODE</div>
    </div>
    <div
      v-for="row in tilesLandtage"
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
        :n-requests=period.nRequests
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
      :srcRequests=popup.srcRequests
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
import ParliamentLegend from '@/core/ParliamentLegend';

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
      tilesBundestag: [],
      tilesLandtage: [],
      tileMap: null,
      popup: null,
      legend: [
        { chartId: 'legend-line--chart-0', category: '0', label: 'keine Anfragen' },
        { chartId: 'legend-line--chart-1', category: '<1 per year', label: 'weniger als eine Anfrage im Jahr' },
        { chartId: 'legend-line--chart-2', category: '>=1 per year', label: 'mehr als eine Anfrage im Jahr' },
        { chartId: 'legend-line--chart-3', category: '>=1 per month', label: 'mehr als eine Anfrage im Monat' },
        { chartId: 'legend-line--chart-4', category: '>=1 per week', label: 'mehr als eine Anfrage in der Woche' },
        { chartId: 'legend-line--chart-5', category: '>=1 per day', label: 'mehr als eine Anfrage am Tag' },
      ],
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
          body, term, dates, hasEnded, periodNum, nRequests: total,
        } = electionResults[0];
        const id = getTermId(body, term);

        return {
          key,
          name: id,
          body,
          term,
          dates,
          hasEnded,
          periodNum,
          nRequests: total,
          elections: electionResults.map(({
            party, seats, isOpposition,
          }) => ({ party, seats, isOpposition })),
          requestsPerHead: requestsPerHeadMap.get(key).map(({
            name, party, isOpposition, nRequests, nRequestsPerDay,
            nRequestsPerMonth, topMinistry, topMinistryCount,
          }) => ({
            name,
            party,
            isOpposition,
            nRequests,
            nRequestsPerDay,
            nRequestsPerMonth,
            topMinistry,
            topMinistryCount,
          })),
          srcRequests: `${this.srcRequests}/requests-${id}.csv`,
        };
      });

    this.tiles = d3.groups(groupedElections, (d) => d.body)
      .map(([body, periods]) => ({
        body,
        periods: periods
          .sort((a, b) => d3.ascending(a.periodNum, b.periodNum)),
      }))
      .sort((a, b) => d3.ascending(a.body, b.body));
    this.tileMap = d3.rollup(groupedElections, (v) => v[0], (d) => d.name);

    [this.tilesBundestag] = this.tiles.filter((d) => d.body === 'Bundestag');
    this.tilesLandtage = this.tiles.filter((d) => d.body !== 'Bundestag');
  },
  mounted() {
    const scale = d3.scalePoint()
      .domain(this.legend.map((d) => d.category))
      .range([0, 5]);

    this.legend.forEach((d) => {
      new ParliamentLegend(`#${d.chartId}`, d.category, scale).draw();
    });
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
        nRequestsPerMonth: +d.n_requests_per_month,
        topMinistry: d.top_ministry,
        topMinistryCount: +d.top_ministry_count,
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
        nRequests: +d.n_requests,
      }));
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

<style lang="scss">
@import '@/assets/style/global';

main {
  padding: 2 * $spacing;
  transition: filter 0.2s ease;
  background-color: $primary-light;
}

.background {
  filter: blur(4px);
  transition: filter 0.2s ease-in;
  overflow: hidden;
}

.top {
  display: grid;
  grid-template-columns: 40% 60%;
  grid-gap: $spacing;
}

h1 {
  text-align: center;
  border-bottom: 1px solid $black;
}

.introduction {
  line-height: 1.5;
}

.introduction .p {
  padding: 0.25 * $spacing;
  border-radius: 10px;
  text-align: justify;
}

.legend-line--chart {
  display: inline-block;
  margin-right: 0.5 * $spacing;
}

.introduction .legend {
  background-color: white;
  margin: 0.5 * $spacing 0;
  padding: 0.25 * $spacing $spacing * 2;
  border-radius: 10px;
}

.tiles-bundestag .election-period {
  margin: $spacing;
}

.tiles .row {
  margin: $spacing 0;
  display: grid;
  grid-gap: $spacing / 2;
}

.tiles-landtage .row-header {
  text-align: center;
  position: sticky;
  background-color: white;
  padding: $spacing 0;
  border-radius: 10px;
  top: 0;
  font-weight: bold;
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
  width: 300px;
  background: white;
  left: 10px;
  top: 10px;
  z-index: 3000;
  pointer-events: none;
  opacity: 0;

  font-size: 0.9em;

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 0.25 * $spacing 0.5 * $spacing;

  border-left: 5px solid $black;
}

.tooltip .above-title {
  font-size: 0.8rem;
}

.tooltip .note {
  font-size: 0.7rem;
}

.tooltip p {
  margin: 0.125 * $spacing 0;
}
</style>
