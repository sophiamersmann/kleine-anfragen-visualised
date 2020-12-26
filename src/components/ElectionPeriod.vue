<template>
  <div :class=classes @click="onClick">
    {{ body }} ({{ years }})
    <div
      :id=parliamentChartId
      class="chart chart-parliament" />
  </div>
</template>

<script>
import ParliamentChart from '@/core/ParliamentChart';
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
      parliamentChart: null,
    };
  },
  created() {
    window.addEventListener('resize', this.onResize);
  },
  mounted() {
    console.log(this.body, this.term);
    const chartDiv = this.getChartDiv();
    this.parliamentChart = new ParliamentChart(
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
    parliamentChartId() {
      return `chart-parliament-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
    },
  },
  methods: {
    getChartDiv() {
      return this.$el.querySelector('.chart-parliament');
    },
    onResize() {
      if (!this.parliamentChart) return;
      const chartDiv = this.getChartDiv();
      this.parliamentChart.draw(chartDiv.clientWidth);
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
