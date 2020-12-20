<template>
  <div class="election-period-list">
    <election-period
      v-for="group in merged"
      :key=group.key
      :body=group.body
      :term=group.term
      :requests=group.requests
      :votes=group.votes />
  </div>
</template>

<script>
import { csv } from 'd3-fetch';
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
    srcVotes: String,
  },
  data() {
    return {
      requests: [],
      votes: [],
      merged: [],
    };
  },
  async created() {
    await this.fetchData();

    const keyFunc = (d) => `${normalize(d.body)}/${d.term}`;
    const groupedRequests = groups(this.requests, keyFunc);
    const groupedVotes = group(this.votes, keyFunc);

    this.merged = groupedRequests.map(([key, requests]) => ({
      key,
      body: requests[0].body,
      term: requests[0].term,
      years: groupedVotes.get(key)[0].years,
      requests: requests.map(({ body, term, ...rest }) => rest),
      votes: groupedVotes.get(key).map(({
        body, term, years, ...rest
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

      this.votes = await csv(this.srcVotes, (d) => ({
        body: d.body,
        term: d.term,
        years: {
          start: +d.start_year,
          end: +d.end_year,
        },
        party: d.party,
        vote: +d.vote,
      }));
    },
  },
};
</script>

<style scoped>
.election-period-list {
  background-color: khaki;
}
</style>
