<template>
  <div :class=classes @click.stop="onClick">
    <h2>{{ body }} ({{ years }})</h2>
    <div
      :id=summaryChartId
      class="chart chart-summary"
      v-show="!classes.popup" />
    <div
      :id=detailedChartId
      class="chart chart-detailed"
      v-show="classes.popup" />
  </div>
</template>

<script>
import SummaryChart from '@/core/SummaryChart';
import normalize from '@/core/utils';

import { timeFormat } from 'd3-time-format';

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
    keyOnTop: String,
  },
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
    classes() {
      return {
        'election-period': true,
        popup: this.keyOnTop === this.name,
        background: this.keyOnTop ? this.keyOnTop !== this.name : false,
      };
    },
    summaryChartId() {
      return `chart-summary-${normalize(this.body)}-${this.term}`;
    },
    detailedChartId() {
      return `chart-detailed-${normalize(this.body)}-${this.term}`;
    },
    years() {
      const formatTime = timeFormat('%Y');
      const years = Object.values(this.dates).map(formatTime);
      return this.hasEnded ? years.join('-') : `ab ${years[0]}`;
    },
  },
  methods: {
    getChartDiv() {
      return this.$el.querySelector('.chart');
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
.background {
  filter: blur(4px);
  pointer-events: none;
}
.popup {
  --offset: calc(var(--spacing) * 4);
  position: fixed;
  z-index: 1;
  left: var(--offset);
  top: var(--offset);
  width: calc(100% - 2 * var(--offset));
  height: calc(100% - 2 * var(--offset));
}
</style>
