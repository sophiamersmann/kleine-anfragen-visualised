<template>
  <main :class=mainClasses>
    <div class="election-period-list">
      <election-period
        v-for="group in merged"
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
  <popup
    v-if="popup"
    :name=popup.key
    :body=popup.body
    :term=popup.term
    :dates=popup.dates
    :has-ended=popup.hasEnded
    :requests=popup.requests
    @flat="onFlat" />
</template>

<script>
import { csv } from 'd3-fetch';
import { timeParse } from 'd3-time-format';
import { group, groups, rollup } from 'd3-array';

import normalize from '@/core/utils';

import ElectionPeriod from './ElectionPeriod.vue';
import Popup from './Popup.vue';

export default {
  name: 'Top',
  components: {
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
  },
  data() {
    return {
      requests: [],
      elections: [],
      merged: [],
      mergedMap: null,
      popup: null,
    };
  },
  async created() {
    await this.fetchData();

    const keyFunc = (d) => `${normalize(d.body)}/${d.term}`;
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
  },
};
</script>

<style scoped>
main {
  padding: var(--spacing);
  transition: filter 0.1s;
}

.background {
  filter: blur(4px);
  transition: filter 0.3s;
}

.election-period-list {
  background-color: khaki;
  display: grid;
  grid-gap: calc(var(--spacing) / 2);
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}
</style>
