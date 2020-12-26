<template>
  <div :class=classes @click="onClick">
    {{ body }} ({{ years }})
    <div
      :id=dotChartId
      class="chart chart-dot" />
  </div>
</template>

<script>
import DotChart from '@/core/DotChart';
import { getTermId, displayTimeRange } from '@/core/utils';

export default {
  name: 'ElectionPeriod',
  props: {
    name: String,
    body: String,
    term: String,
    dates: Object,
    hasEnded: Boolean,
    periodNum: Number,
    requests: Object,
    elections: Object,
  },
  emits: ['top'],
  data() {
    return {
      dotChart: null,
    };
  },
  created() {
    window.addEventListener('resize', this.onResize);
  },
  mounted() {
    const chartDiv = this.getChartDiv();
    this.dotChart = new DotChart(
      `#${chartDiv.id}`,
      this.requests,
      this.elections,
      this.dates,
    ).draw(chartDiv.clientWidth);
  },
  computed: {
    classes() {
      const classes = { 'election-period': true };
      classes[`col-${this.periodNum}`] = true;
      return classes;
    },
    dotChartId() {
      return `chart-dot-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
    },
  },
  methods: {
    getChartDiv() {
      return this.$el.querySelector('.chart-dot');
    },
    onResize() {
      if (!this.dotChart) return;
      const chartDiv = this.getChartDiv();
      this.dotChart.draw(chartDiv.clientWidth);
    },
    onClick() {
      this.$emit('top', this.name);
    },
  },
};
</script>

<style scoped>
.election-period {
  background-color: white;
}
</style>
