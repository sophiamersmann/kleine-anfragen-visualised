<template>
  <div :class=classes @click="onClick">
    <div
      :id=seatChartId
      class="chart chart-seat" />
    <div class="caption">
      <h3>{{ body }}&nbsp; <span>({{ years }})</span></h3>
      <p>
        Durchsuche <b>{{ nRequests }}</b> gesammelte Anfragen
      </p>
    </div>
  </div>
</template>

<script>
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
    nRequests: Number,
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
    const innerRadius = this.body === 'Bundestag' ? 50 : 30;
    this.seatChart = new SeatChart(`#${chartDiv.id}`, innerRadius)
      .data(this.requestsPerHead)
      .draw(chartDiv.clientWidth);
  },
  computed: {
    classes() {
      const classes = { 'election-period': true };
      classes[`col-${this.periodNum}`] = this.body !== 'Bundestag';
      return classes;
    },
    seatChartId() {
      return `chart-seat-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
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

<style lang="scss" scoped>
@import '@/assets/style/global';

.election-period {
  background-color: white;
  border-radius: 50px;
  padding: $spacing;
  border: 1px solid white;
  transition: all .2s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.election-period:hover {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
  border-color: $primary;
}

.caption {
  text-align: center;
  margin-top: 0.5 * $spacing;
}

.caption h3 span {
  font-weight: normal;
}

.caption p {
  font-size: 0.9rem;
}
</style>
