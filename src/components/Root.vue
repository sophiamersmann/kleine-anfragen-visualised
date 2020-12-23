<template>
  <main :class=mainClasses>
    <data-button-group
      :options=sortOptions
      @clicked="setSortBy" />
    <div class="election-period-list">
      <election-period
        v-for="group in sortedData"
        :key=group.key
        :name=group.key
        :body=group.body
        :term=group.term
        :dates=group.dates
        :has-ended=group.hasEnded
        :requests=group.requests
        :elections=group.elections
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
import { csv } from 'd3-fetch';
import { timeParse } from 'd3-time-format';
import {
  group, groups, rollup, ascending, descending, sum,
} from 'd3-array';

import { getTermId } from '@/core/utils';

import DataButtonGroup from './DataButtonGroup.vue';
import ElectionPeriod from './ElectionPeriod.vue';
import Popup from './Popup.vue';

export default {
  name: 'Root',
  components: {
    DataButtonGroup,
    ElectionPeriod,
    Popup,
  },
  props: {
    srcRequests: String,
    srcElections: String,
  },
  computed: {
    mainClasses() {
      return {
        background: this.popup,
      };
    },
    sortedData() {
      const data = this.merged;

      let sortFunc;
      switch (this.sortBy) {
        case 'alphabetically':
          sortFunc = (a, b) => ascending(a.body, b.body)
            || ascending(a.dates.start, b.dates.start);
          break;
        case 'requestCount':
          sortFunc = (a, b) => descending(
            a.requests.length / sum(a.elections, (d) => d.seats),
            b.requests.length / sum(b.elections, (d) => d.seats),
          );
          break;
        default:
          sortFunc = (a, b) => ascending(a.body, b.body)
            || ascending(a.dates.start, b.dates.start);
      }

      return data.sort(sortFunc);
    },
  },
  data() {
    return {
      requests: [],
      elections: [],
      merged: [],
      mergedMap: null,
      popup: null,
      sortOptions: [
        { label: 'Sort alphabetically', value: 'alphabetically', active: false },
        { label: 'Sort by the number of requests', value: 'requestCount', active: false },
      ],
      sortBy: 'alphabetically',
    };
  },
  async created() {
    await this.fetchData();

    const keyFunc = (d) => getTermId(d.body, d.term);
    const groupedRequests = groups(this.requests, keyFunc);
    const groupedElections = group(this.elections, keyFunc);

    this.merged = groupedRequests.map(([key, requests]) => ({
      key,
      body: requests[0].body,
      term: requests[0].term,
      dates: groupedElections.get(key)[0].dates,
      hasEnded: groupedElections.get(key)[0].hasEnded,
      requests: requests.map(({ body, term, ...rest }) => rest),
      elections: groupedElections.get(key).map(({
        body, term, dates, hasEnded, ...rest
      }) => rest),
    }));

    this.mergedMap = rollup(this.merged, (v) => v[0], (d) => d.key);
  },
  methods: {
    async fetchData() {
      this.requests = await csv(this.srcRequests, (d) => ({
        body: d.body,
        term: d.legislative_term,
        title: d.title,
        type: d.interpellation_type,
        date: d.published_at,
        party: d.inquiringPartyNormalised,
        ministry: d.answerers,
      }));

      const parseTime = timeParse('%d/%m/%Y');
      this.elections = await csv(this.srcElections, (d) => ({
        body: d.body,
        term: d.term,
        dates: {
          start: parseTime(d.start_date),
          end: d.end_date ? parseTime(d.end_date) : new Date(2020, 12, 31),
        },
        hasEnded: d.end_date !== '',
        party: d.party,
        seats: +d.seats,
        isOpposition: d.opposition === 'TRUE',
      }));
    },
    onTop(key) {
      this.popup = this.mergedMap.get(key);
    },
    onFlat() {
      this.popup = null;
    },
    setSortBy(value) {
      this.sortBy = value;
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

.election-period-list {
  background-color: khaki;
  display: grid;
  grid-gap: calc(var(--spacing) / 2);
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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
