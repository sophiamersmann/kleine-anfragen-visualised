<template>
  <div class="election-period" @click="onClick">
    <h2>{{ body }} ({{ years }})</h2>
    <div
      :id=summaryChartId
      class="chart chart-summary" />
  </div>
</template>

<script>
import SummaryChart from '@/core/SummaryChart';
import { getTermId, displayTimeRange } from '@/core/utils';

export default {
  name: 'ElectionPeriod',
  props: {
    name: String,
    body: String,
    term: String,
    dates: Object,
    hasEnded: Boolean,
    requests: Object,
    elections: Object,
  },
  emits: ['top'],
  data() {
    return {
      summaryChart: null,
    };
  },
  created() {
    window.addEventListener('resize', this.onResize);
  },
  mounted() {
    const chartDiv = this.getChartDiv();
    this.summaryChart = new SummaryChart(
      `#${chartDiv.id}`,
      this.requests,
      this.elections,
      this.dates,
    ).draw(chartDiv.clientWidth);
  },
  computed: {
    summaryChartId() {
      return `chart-summary-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
    },
  },
  methods: {
    getChartDiv() {
      return this.$el.querySelector('.chart-summary');
    },
    onResize() {
      if (!this.summaryChart) return;
      const chartDiv = this.getChartDiv();
      this.summaryChart.draw(chartDiv.clientWidth);
    },
    onClick() {
      this.$emit('top', this.name);
    },
  },
};
</script>

<style scoped>
.election-period {
  background-color: aliceblue;
  padding: calc(var(--spacing) / 2);
}
</style>
