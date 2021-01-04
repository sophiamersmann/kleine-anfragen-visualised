<template>
  <div :class=classes @click="onClick">
    <div>
      {{ body }} ({{ years }})
      <p style="font-size: 0.8em">
        {{ nRequests }} requests in total<br>
        average {{ nRequestsPerHead }} requests per head (in a year)<br>
        average {{ nRequestsPerOppositionHead }} requests per opposition head (in a year)<br>
        top themen: todo
      </p>
    </div>
    <div
      :id=parliamentChartId
      class="chart chart-parliament" />
  </div>
</template>

<script>
import d3 from '@/assets/d3';

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
    const chartDiv = this.getChartDiv();
    this.parliamentChart = new ParliamentChart(`#${chartDiv.id}`)
      .data(this.requests, this.elections, this.dates)
      .draw(chartDiv.clientWidth);
  },
  updated() {
    if (this.requests) {
      this.parliamentChart
        .requestsData(this.requests)
        .drawData();
    }
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
    nRequests() {
      if (this.requests === null) return '';
      return this.requests.length;
    },
    nRequestsPerHead() {
      if (this.requests === null) return '';

      const nDays = d3.timeDay.count(this.dates.start, this.dates.end);
      const nSeats = d3.sum(this.elections, (d) => d.seats);
      return Math.round(((this.requests.length / nDays) * 365) / nSeats);
    },
    nRequestsPerOppositionHead() {
      if (this.requests === null) return '';

      const nDays = d3.timeDay.count(this.dates.start, this.dates.end);
      const oppositionMap = new Map(this.elections
        .map(({ party, isOpposition }) => [party, isOpposition]));
      const nSeats = d3.sum(this.elections.filter((d) => d.isOpposition), (d) => d.seats);
      const nRequests = this.requests.filter((d) => oppositionMap.get(d.party)).length;
      return Math.round(((nRequests / nDays) * 365) / nSeats);
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
