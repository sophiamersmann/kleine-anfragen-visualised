<template>
  <div class="popup">
    <h2>{{ body }} ({{ years }})</h2>
    <div
      :id=dotChartId
      class="chart chart-dot" />
    <div
      :id=detailedChartId
      class="chart chart-detailed" />
  </div>
</template>

<script>
import DotChart from '@/core/DotChart';
import DetailedChart from '@/core/DetailedChart';

import { getTermId, displayTimeRange } from '@/core/utils';

export default {
  name: 'Popup',
  props: {
    name: String,
    body: String,
    term: String,
    dates: Object,
    hasEnded: Boolean,
    requests: Object,
    elections: Object,
  },
  data() {
    return {
      dotChart: null,
      detailedChart: null,
    };
  },
  mounted() {
    const dotChartDiv = this.$el.querySelector('.chart-dot');
    this.dotChart = new DotChart(
      `#${dotChartDiv.id}`,
      this.requests,
      this.elections,
      this.dates,
    ).draw(dotChartDiv.clientWidth);

    const detailedChartDiv = this.$el.querySelector('.chart-detailed');
    this.detailedChart = new DetailedChart(
      `#${detailedChartDiv.id}`,
      this.requests,
    ).draw(detailedChartDiv.clientWidth);
  },
  computed: {
    dotChartId() {
      return `popup-chart-dot-${getTermId(this.body, this.term)}`;
    },
    detailedChartId() {
      return `popup-chart-detailed-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
    },
  },
};
</script>

<style scoped>
.popup {
  background-color: white;

  position: fixed;
  z-index: 2000;
  top: var(--popup-offset);
  left: var(--popup-offset);
  width: calc(100vw - 2 * var(--popup-offset));
  height: calc(100vh - 2 * var(--popup-offset));
}
</style>
