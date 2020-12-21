<template>
  <div :class=classes @click.stop="onClick">
    <h2>{{ body }} ({{ years }})</h2>
    <div
      :id=chartId
      class="chart" />
  </div>
</template>

<script>
import Chart from '@/core/Chart';
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
      chart: null,
    };
  },
  created() {
    window.addEventListener('resize', this.onResize);
  },
  mounted() {
    const chartDiv = this.getChartDiv();
    this.chart = new Chart(
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
    chartId() {
      return `chart-${normalize(this.body)}-${this.term}`;
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
      if (!this.chart) return;
      const chartDiv = this.getChartDiv();
      this.chart.draw(chartDiv.clientWidth);
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
  margin: var(--spacing) 0;
  padding: calc(var(--spacing) / 2);
}
.background {
  filter: blur(4px);
  pointer-events: none;
}
.popup {
  --offset: 100px;
  position: fixed;
  z-index: 1;
  left: var(--offset);
  top: var(--offset);
  width: calc(100% - 2 * var(--offset));
  height: calc(100% - 2 * var(--offset));
  transition: all 2s ease-in-out;
}
</style>
