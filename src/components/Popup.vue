<template>
  <div class="popup">
    <div class="sidebar">
      <h2>{{ body }} ({{ years }})</h2>
      <ministry-button-group
        :ministries=ministries
        @selected=onSelected />
    </div>
    <div
      :id=ringChartId
      class="chart chart-ring" />
  </div>
</template>

<script>
import d3 from '@/assets/d3';

import { getTermId, displayTimeRange } from '@/core/utils';

import RingChart from '@/core/RingChart';

import MinistryButtonGroup from './MinistryButtonGroup.vue';

export default {
  name: 'Popup',
  components: {
    MinistryButtonGroup,
  },
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
      ringChart: null,
      ministries: null,
      parties: null,
      maxValue: null,
      selectedMinistry: null,
    };
  },
  created() {
    this.ministries = d3
      .groups(this.requests, (d) => d.ministries[0])
      .map(([ministry, requests]) => ({ name: ministry, requests }))
      .sort((a, b) => d3.descending(a.requests.length, b.requests.length));
    this.selectedMinistry = this.ministries[0].name;

    this.parties = d3
      .rollups(this.requests.flatMap((d) => d.parties), (v) => v.length, (d) => d)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => d3.descending(a.count, b.count))
      .map(({ party }) => party);

    const dateId = d3.timeFormat('%Y-%m');
    this.maxValue = d3.max(d3
      .groups(this.requests, (d) => `${d.ministries[0]}-${dateId(d.date)}`)
      .map(([, requests]) => {
        const parties = requests.flatMap((d) => d.parties);
        const counts = d3.rollups(parties, (v) => v.length, (d) => d).map((d) => d[1]);
        return d3.max(counts);
      }));
  },
  mounted() {
    const ringChartDiv = this.$el.querySelector('.chart-ring');
    const { dates, parties, maxValue } = this;
    this.ringChart = new RingChart(
      `#${ringChartDiv.id}`, ringChartDiv.clientHeight,
      { dates, parties, maxValue },
    )
      .drawSkeleton()
      .updateMinistry(this.selectedRequests);
  },
  computed: {
    ringChartId() {
      return `popup-chart-ring-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
    },
    selectedRequests() {
      return this.requests.filter((d) => d.ministries[0] === this.selectedMinistry);
    },
  },
  methods: {
    onSelected(ministry) {
      this.selectedMinistry = ministry;
      this.ringChart.updateMinistry(this.selectedRequests);
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
  left: calc(3 * var(--popup-offset));
  width: var(--popup-width);
  height: var(--popup-height);

  display: grid;
  grid-template-columns: 1fr var(--popup-height);
}

.sidebar {
  padding: var(--spacing);
}

.chart-ring {
  height: var(--popup-height);
  width: var(--popup-height);
}
</style>
