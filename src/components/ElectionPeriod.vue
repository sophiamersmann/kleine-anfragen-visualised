<template>
  <div :class=classes @click="onClick">
    <div
      :id=seatChartId
      class="chart chart-seat" />
    <div class="caption">
      <div class="heading">
        <b>{{ body }}</b>&nbsp;
        <span class="years">({{ years }})</span>
      </div>
      <p>
        Durchsuche <b>{{ nRequests }}</b> gesammelte Anfragen
      </p>
    </div>
  </div>
</template>

<script>
import SeatChart from '@/core/SeatChart';
import { getTermId, displayTimeRange } from '@/core/utils';
import { LABEL_POSITIONS } from '@/core/CONSTANTS';

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

    let labelPositions;
    if (LABEL_POSITIONS.has(this.name)) {
      labelPositions = LABEL_POSITIONS.get(this.name);
    }

    this.seatChart = new SeatChart(`#${chartDiv.id}`, innerRadius, labelPositions)
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
  justify-content: flex-end;
  align-items: center;

  @include max-width($bp-lg) {
    pointer-events: none;
  }

  &:hover {
    box-shadow: $box-shadow-strong;
    border-color: $primary;
    cursor: pointer;

    @include max-width($bp-lg) {
      cursor: auto;
    }
  }
}

.caption {
  margin-top: 0.5 * $spacing;
  text-align: center;

  .heading {
    font-family: 'Quicksand', Helvetica, Arial, sans-serif;
  }

  .years {
    white-space: nowrap;
  }

  p {
    font-size: 0.9rem;
  }
}
</style>
