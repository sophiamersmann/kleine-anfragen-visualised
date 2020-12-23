<template>
  <div class="popup">
    <h2>{{ body }} ({{ years }})</h2>
    <div
      :id=summaryChartId
      class="chart chart-summary" />
    <div
      :id=detailedChartId
      class="chart chart-detailed" />
  </div>
</template>

<script>
import SummaryChart from '@/core/SummaryChart';
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
      summaryChart: null,
      detailedChart: null,
    };
  },
  mounted() {
    const summaryChartDiv = this.$el.querySelector('.chart-summary');
    this.summaryChart = new SummaryChart(
      `#${summaryChartDiv.id}`,
      this.requests,
      this.elections,
      this.dates,
    ).draw(summaryChartDiv.clientWidth);

    const detailedChartDiv = this.$el.querySelector('.chart-detailed');
    this.detailedChart = new DetailedChart(
      `#${detailedChartDiv.id}`,
      this.requests,
    ).draw(detailedChartDiv.clientWidth);
  },
  computed: {
    summaryChartId() {
      return `popup-chart-summary-${getTermId(this.body, this.term)}`;
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
