<template>
  <div class="election-period">
    <h2>{{ body }} ({{ term }})</h2>
    <div :id=chartId class="chart"></div>
  </div>
</template>

<script>
import Chart from '@/core/Chart';
import normalize from '@/core/utils';

export default {
  name: 'ElectionPeriod',
  props: {
    body: String,
    term: String,
    dates: Object,
    requests: Object,
    elections: Object,
  },
  mounted() {
    const chartDiv = this.$el.querySelector('.chart');
    new Chart(`#${chartDiv.id}`, this.requests, this.elections, this.dates)
      .draw(chartDiv.clientWidth);
  },
  computed: {
    chartId() {
      return `chart-${normalize(this.body)}-${this.term}`;
    },
  },
};
</script>

<style scoped>
.election-period {
  background-color: aliceblue;
  margin: var(--spacing) 0;
  padding: calc(var(--spacing) / 2);
}
</style>
