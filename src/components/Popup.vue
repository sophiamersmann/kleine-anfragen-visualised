<template>
  <div class="popup">
    <h2>{{ body }} ({{ years }})</h2>
    <div
      :id=parliamentChartId
      class="chart chart-parliament" />
    <div
      :id=ringChartId
      class="chart chart-ring" />
  </div>
</template>

<script>
import ParliamentChart from '@/core/ParliamentChart';
import RingChart from '@/core/DetailedChart';

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
      parliamentChart: null,
      ringChart: null,
    };
  },
  mounted() {
    const parliamentChartDiv = this.$el.querySelector('.chart-parliament');
    this.parliamentChart = new ParliamentChart(`#${parliamentChartDiv.id}`)
      .data(this.requests, this.elections, this.dates)
      .draw(200);

    const ringChartDiv = this.$el.querySelector('.chart-ring');
    this.ringChart = new RingChart(
      `#${ringChartDiv.id}`,
      this.requests,
    ).draw(ringChartDiv.clientWidth);
  },
  updated() {
    if (this.requests) {
      this.parliamentChart
        .requestsData(this.requests)
        .drawData();
    }
  },
  computed: {
    parliamentChartId() {
      return `popup-chart-parliament-${getTermId(this.body, this.term)}`;
    },
    ringChartId() {
      return `popup-chart-ring-${getTermId(this.body, this.term)}`;
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

.chart-ring {
  padding: var(--spacing);
  height: 60vh; /* todo: magic value */
  overflow-y: auto;
}
</style>
