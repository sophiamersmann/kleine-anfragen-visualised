<template>
  <div :class=classes @click="onClick">
    <div
      :id=seatChartId
      class="chart chart-seat" />
    <div>
      {{ body }} ({{ years }})
      <p style="font-size: 0.8em">
        {{ nRequests }} requests in total<br>
        average {{ nRequestsPerHead }} requests per head (in a year)<br>
        average {{ nRequestsPerOppositionHead }} requests per opposition head (in a year)<br>
        top themen: todo
      </p>
    </div>
  </div>
</template>

<script>
import d3 from '@/assets/d3';

import SeatChart from '@/core/SeatChart';
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
    requests: Array,
    requestsPerHead: Array,
    elections: Array,
  },
  emits: ['top'],
  data() {
    return {
      seatChart: null,
    };
  },
  mounted() {
    const chartDiv = this.getChartDiv();
    this.seatChart = new SeatChart(`#${chartDiv.id}`)
      .data(this.requestsPerHead)
      .draw(chartDiv.clientWidth);
  },
  computed: {
    classes() {
      const classes = {
        'election-period': true,
        disabled: this.requests === null,
      };
      classes[`col-${this.periodNum}`] = true;
      return classes;
    },
    seatChartId() {
      return `chart-seat-${getTermId(this.body, this.term)}`;
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
      return this.$el.querySelector('.chart-seat');
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

.election-period.disabled {
  pointer-events: none;
}
</style>
