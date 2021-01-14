<template>
  <div class="popup">
    <div class="sidebar">
      <h3>{{ body }}&nbsp; <span>({{ years }})</span></h3>
      <div class="text">
        Die Oppositionsparteien
          <div class="text-wrapper">
            <span
            class="party"
            v-for="(party, i) in oppositionParties"
            :key=i
            :style=party.style
            >
              {{ party.name }}
            </span>
          </div>
          und Regierungparteien
          <div class="text-wrapper">
            <span
            class="party"
            v-for="(party, i) in rulingParties"
            :key=i
            :style=party.style
            >
              {{ party.name }}
            </span>
          </div>
          haben insgesamt
          <div class="text-wrapper">
            <b class="number">{{ nRequests }}</b> Anfragen
          </div>
          an folgende Instutionen gestellt:
      </div>
      <div class="ministry-legend" />
      <ministry-button-group
        :ministries=ministries
        :sortedParties=parties
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
import { LIGHT_COLOR } from '@/core/CONSTANTS';

import RingChart from '@/core/RingChart';
import MinistryLegend from '@/core/MinistryLegend';

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
    const legendDiv = this.$el.querySelector('.ministry-legend');
    new MinistryLegend(legendDiv, legendDiv.clientWidth).draw();

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
    nRequests() {
      if (this.requests === null) return '';
      return this.requests.length;
    },
    oppositionParties() {
      return this.prepareParties(this.elections.filter((d) => d.isOpposition));
    },
    rulingParties() {
      return this.prepareParties(this.elections.filter((d) => !d.isOpposition));
    },
  },
  methods: {
    onSelected(ministry) {
      this.selectedMinistry = ministry;
      this.ringChart.updateMinistry(this.selectedRequests);
    },
    prepareParties(parties) {
      return parties
        .sort((a, b) => d3.ascending(
          this.parties.findIndex((p) => p === a.party),
          this.parties.findIndex((p) => p === b.party),
        ))
        .map((d) => ({
          name: d.party === 'Bündnis 90/Die Grünen' ? 'Die Grünen' : d.party,
          style: {
            backgroundColor: LIGHT_COLOR.get(d.party),
          },
        }));
    },
  },
};
</script>

<style scoped>
.popup {
  background-color: white;
  border-radius: 50px;

  position: fixed;
  z-index: 2000;
  top: calc(var(--popup-offset) / 2);
  left: calc(2 * var(--popup-offset));
  width: var(--popup-width);
  height: var(--popup-height);

  display: grid;
  grid-template-columns: 1fr var(--popup-height);
}

.sidebar {
  padding: var(--spacing);
  background-color: var(--primary-light);
  border-radius: 50px 0 0 50px;
}

.chart-ring {
  height: var(--popup-height);
  width: var(--popup-height);
}

h3 {
  text-align: center;
  margin-bottom: calc(0.5 * var(--spacing));
  border-bottom: 1px solid var(--black);
}

.text {
  border: 1px solid var(--primary-light);
  padding: calc(0.25 * var(--spacing));
  line-height: 1.25;
  margin: calc(0.5 * var(--spacing)) 0;
}

.number {
  font-size: 0.9em;
}

h3 span {
  font-weight: normal;
}

.text-wrapper {
  margin-left: calc(0.5 * var(--spacing));
  padding: 2px 0 calc(0.25 * var(--spacing)) 0
}

.party {
  display: inline-block;
  padding: 0 5px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: bold;
  white-space: nowrap;
}

.ministry-legend {
  width: 100%;
  height: 20px;
  margin-top: -20px;
}
</style>
