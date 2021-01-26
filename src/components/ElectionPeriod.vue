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
  created() {
    window.addEventListener('resize', this.onResize);
  },
  mounted() {
    const chartDiv = this.getChartDiv();

    let labelPositions;
    if (LABEL_POSITIONS.has(this.name)) {
      labelPositions = LABEL_POSITIONS.get(this.name);
    }

    const cfg = this.getChartConfig();
    this.seatChart = new SeatChart(`#${chartDiv.id}`, labelPositions)
      .data(this.requestsPerHead)
      .draw(cfg);
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
    getChartConfig() {
      let seatRadius = 5;
      let innerRadius = 50;
      let fontSize = '0.7rem';

      if (window.innerWidth < 440) {
        seatRadius = 2;
        innerRadius = 30;
        fontSize = '0.5rem';
      } else if (window.innerWidth < 540) {
        seatRadius = 3;
        innerRadius = 40;
        fontSize = '0.6rem';
      } else if (window.innerWidth < 640) {
        seatRadius = 4;
      }

      if (this.body !== 'Bundestag') {
        innerRadius -= 20;
      }

      return { seatRadius, innerRadius, fontSize };
    },
    onClick() {
      this.$emit('top', this.name);
    },
    onResize() {
      const cfg = this.getChartConfig();
      this.seatChart.draw(cfg);
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

  &:hover {
    box-shadow: $box-shadow-strong;
    border-color: $primary;
    cursor: pointer;

    @include max-width($bp-lg) {
      box-shadow: $box-shadow-weak;
      border-color: white;
      cursor: auto;
    }
  }

  &:active {
    @include max-width($bp-lg) {
      pointer-events: none;
    }
  }
}

.caption {
  margin-top: 0.5 * $spacing;
  text-align: center;

  .years {
    white-space: nowrap;
  }

  p {
    font-size: 0.9rem;
  }
}
</style>
