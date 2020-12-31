<template>
  <main :class=classes>
    <div class="row">
      <div class="col-1">Aktuelle Legislaturperiode</div>
      <div class="col-2">Letzte Legislaturperiode</div>
      <div class="col-3">Vorletzte Legislaturperiode</div>
    </div>
    <div
      v-for="row in tiles"
      :key=row.body
      class="row">
      <div class="col-0">
        <div class="inner rotate">{{ row.body }}</div>
      </div>
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
        :elections=period.elections
        @top="onTop" />
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
    await this.fetchData();

    const keyFunc = (d) => getTermId(d.body, d.term);
    const groupedRequests = d3.groups(this.requests, keyFunc);
    const groupedElections = d3.group(this.elections, keyFunc);

    const merged = groupedRequests
      .map(([key, requests]) => ({
        key,
        name: getTermId(requests[0].body, requests[0].term),
        body: requests[0].body,
        term: requests[0].term,
        dates: groupedElections.get(key)[0].dates,
        hasEnded: groupedElections.get(key)[0].hasEnded,
        periodNum: groupedElections.get(key)[0].periodNum,
        requests: requests.map(({ body, term, ...rest }) => rest),
        elections: groupedElections.get(key).map(({
          body, term, dates, hasEnded, periodNum, ...rest
        }) => rest),
      }))
      .sort((a, b) => d3.descending(a.dates.start, b.dates.start));

    this.tiles = d3.groups(merged, (d) => d.body)
      .map(([body, periods]) => ({ body, periods }))
      .sort((a, b) => d3.ascending(a.body, b.body));
    this.tileMap = d3.rollup(merged, (v) => v[0], (d) => d.name);
  },
  methods: {
    async fetchData() {
      this.requests = await d3.csv(this.srcRequests, (d) => ({
        body: d.body,
        term: d.legislative_term,
        title: d.title,
        type: d.interpellation_type,
        date: d.published_at,
        parties: d.parties.split(';').map((s) => s.trim()),
        ministries: d.ministries.split(';').map((s) => s.trim()),
      }));

      const parseTime = d3.timeParse('%d/%m/%Y');
      this.elections = await d3.csv(this.srcElections, (d) => ({
        body: d.body,
        term: d.term,
        dates: {
          start: parseTime(d.start_date),
          end: d.end_date ? parseTime(d.end_date) : new Date(2020, 12, 31),
        },
        hasEnded: d.end_date !== '',
        periodNum: +d.period_num,
        party: d.party,
        seats: +d.seats,
        isOpposition: d.opposition === 'TRUE',
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

<style scoped>
main {
  padding: var(--spacing);
  transition: filter 0.2s ease;
}

.background {
  filter: blur(4px);
  transition: filter 0.2s ease-in;
}

.row {
  background-color: khaki;
  margin: var(--spacing) 0;
  display: grid;
  grid-gap: calc(var(--spacing) / 2);
  grid-template-columns: 100px repeat(3, 300px);
}

.col-1 {
  grid-column: 2 / 3;
}

.col-2 {
  grid-column: 3 / 4;
}

.col-3 {
  grid-column: 4 / 5;
}

.col-0 {
  background-color: cornsilk;
  position: relative;
  display: inline-block;
  text-align: center;
}

.inner {
  position: absolute;
  top: 50%;
  left: 50%;
  background: white;
}

.rotate {
  -moz-transform: translateX(-50%) translateY(-50%) rotate(-90deg);
  -webkit-transform: translateX(-50%) translateY(-50%) rotate(-90deg);
  transform:  translateX(-50%) translateY(-50%) rotate(-90deg);
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
</style>
