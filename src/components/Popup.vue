<template>
  <div class="popup">
    <div class="sidebar">
      <h2>{{ body }} ({{ years }})</h2>
      <div
        :id=parliamentChartId
        class="chart chart-parliament" />
    </div>
    <div
      :id=ringChartId
      class="chart chart-ring" />
  </div>
</template>

<script>
import ParliamentChart from '@/core/ParliamentChart';
import RingChart from '@/core/RingChart';

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
    // TODO: Hard-coded for development
    const requests = this.requests.filter((d) => d.ministries[0] === 'Ministerium für Verkehr und Infrastruktur');
    this.ringChart = new RingChart(`#${ringChartDiv.id}`, ringChartDiv.clientHeight)
      .data(requests, this.dates)
      .draw();
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
  --height: calc(100vh - 2 * var(--popup-offset));

  background-color: white;

  position: fixed;
  z-index: 2000;
  top: var(--popup-offset);
  left: calc(3 * var(--popup-offset));
  width: calc(100vw - 6 * var(--popup-offset));
  height: var(--height);

  display: grid;
  grid-template-columns: 1fr var(--height);
}

.sidebar {
  padding: var(--spacing);
}

.chart-ring {
  height: var(--height);
  width: var(--height);
}
</style>
