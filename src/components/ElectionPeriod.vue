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
    cell: Object,
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
      .draw();
  },
  computed: {
    classes() {
      const classes = { 'election-period': true };
      if (this.cell !== undefined) {
        classes[`row-${this.cell.row}`] = true;
        classes[`col-${this.cell.col}`] = true;
      }
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
  border-radius: $border-radius-strong;
  padding: $spacing;
  border: 1px solid white;
  box-shadow: $box-shadow-weak;
  transition: all 0.2s;
  text-align: center;

  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: center;

  &:hover {
    box-shadow: $box-shadow-strong;
    border-color: $primary;
  }
}

.caption {
  margin-top: 0.5 * $spacing;
  text-align: center;

  h3 span {
    font-weight: normal;
    white-space: nowrap;
  }

  p {
    font-size: 0.9rem;
  }
}
</style>
