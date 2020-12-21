<template>
  <div class="election-period-list">
    <election-period
      v-for="group in merged"
      :key=group.key
      :body=group.body
      :term=group.term
      :dates=group.dates
      :has-ended=group.hasEnded
      :requests=group.requests
      :elections=group.elections />
  </div>
</template>

<script>
import { csv } from 'd3-fetch';
import { timeParse } from 'd3-time-format';
import { group, groups } from 'd3-array';

import normalize from '@/core/utils';

import ElectionPeriod from './ElectionPeriod.vue';

export default {
  name: 'ElectionPeriodList',
  components: {
    ElectionPeriod,
  },
  props: {
    srcRequests: String,
    srcElections: String,
  },
  data() {
    return {
      requests: [],
      elections: [],
      merged: [],
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
  },
};
</script>

<style scoped>
.election-period-list {
  background-color: khaki;
  display: grid;
  grid-gap: calc(var(--spacing) / 2);
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}
</style>
