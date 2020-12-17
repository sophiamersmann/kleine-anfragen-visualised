<template>
  <div class="election-period-list" v-for="group in groups" :key="group.key">
    <election-period :body=group.body :term=group.term :data=group.values />
  </div>
</template>

<script>
import { csv } from 'd3-fetch';
import { groups } from 'd3-array';

import ElectionPeriod from './ElectionPeriod.vue';

export default {
  name: 'ElectionPeriodList',
  components: {
    ElectionPeriod,
  },
  props: {
    dataSrc: String,
  },
  data() {
    return {
      rawData: [],
      groups: [],
    };
  },
  async created() {
    await this.fetchData();

    this.groups = groups(this.rawData, (d) => `${d.body}/${d.term}`)
      .map(([key, values]) => ({
        key,
        body: values[0].body,
        term: values[0].term,
        values: values.map(({
          body, term, ...rest
        }) => rest),
      }));
  },
  methods: {
    async fetchData() {
      this.$data.rawData = await csv(this.dataSrc, (d) => ({
        term: d.legislative_term,
        title: d.title,
        type: d.interpellation_type,
        date: d.published_at,
        body: d.body,
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
