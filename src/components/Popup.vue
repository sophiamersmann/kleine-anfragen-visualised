<template>
  <div :class=classes>
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
            <span class="number">{{ nRequests }}</span> Anfragen
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
import { LIGHT_COLOR, PARTY_GROUPS } from '@/core/CONSTANTS';

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
    srcRequests: String,
    elections: Object,
  },
  data() {
    return {
      ringChart: null,
      selectedMinistry: null,
      requests: null,
    };
  },
  async created() {
    await this.fetchRequestsData();
  },
  mounted() {
    const legendDiv = this.$el.querySelector('.ministry-legend');
    new MinistryLegend(legendDiv, legendDiv.clientWidth).draw();

    if (this.requests !== null) {
      const ringChartDiv = this.$el.querySelector('.chart-ring');
      const { dates, parties, maxValue } = this;
      this.ringChart = new RingChart(
        `#${ringChartDiv.id}`, ringChartDiv.clientHeight,
        { dates, parties, maxValue },
      )
        .drawSkeleton()
        .updateMinistry(this.selectedRequests);
    }
  },
  updated() {
    const ringChartDiv = this.$el.querySelector('.chart-ring');
    const {
      dates, parties, maxValue, selectedRequests,
    } = this;

    this.ringChart = new RingChart(
      `#${ringChartDiv.id}`, ringChartDiv.clientHeight,
      { dates, parties, maxValue },
    )
      .drawSkeleton()
      .updateMinistry(selectedRequests);
  },
  computed: {
    classes() {
      return {
        popup: true,
        loading: this.requests === null,
      };
    },
    ringChartId() {
      return `popup-chart-ring-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
    },
    selectedRequests() {
      if (this.requests === null || this.ministries === null) return '';
      const selectedMinistry = this.selectedMinistry !== null
        ? this.selectedMinistry : this.ministries[0].name;
      console.log('sel', selectedMinistry);
      return this.requests.filter((d) => d.ministries[0] === selectedMinistry);
    },
    nRequests() {
      if (this.requests === null) return '';
      return this.requests.length;
    },
    oppositionParties() {
      if (this.parties === null || this.isOpposition === null) {
        return Array(3).fill({ name: '', style: {} });
      }
      return this.prepareParties(this.parties.filter((party) => (this.isOpposition.has(party)
        ? this.isOpposition.get(party) : true)));
    },
    rulingParties() {
      if (this.parties === null || this.isOpposition === null) {
        return Array(2).fill({ name: '', style: {} });
      }
      return this.prepareParties(this.parties.filter((party) => (this.isOpposition.has(party)
        ? !this.isOpposition.get(party) : false)));
    },
    ministries() {
      if (this.requests === null) return null;
      return d3
        .groups(this.requests, (d) => d.ministries[0])
        .map(([ministry, requests]) => ({ name: ministry, requests }))
        .sort((a, b) => d3.descending(a.requests.length, b.requests.length));
    },
    parties() {
      if (this.requests === null) return null;
      return this.getPartyCounts(this.requests)
        .sort((a, b) => d3.descending(a.count, b.count))
        .map(({ party }) => party);
    },
    isOpposition() {
      return new Map(this.elections.map((d) => [d.party, d.isOpposition]));
    },
    maxValue() {
      if (this.requests === null) return null;
      const dateId = d3.timeFormat('%Y-%m');
      return d3.max(d3
        .groups(this.requests, (d) => `${d.ministries[0]}-${dateId(d.date)}`)
        .map(([, requests]) => d3.max(this.getPartyCounts(requests), (d) => d.count)));
    },
  },
  methods: {
    async fetchRequestsData() {
      const parseTime = d3.timeParse('%Y-%m-%d');
      const asArray = (str) => str.split(';').map((s) => s.trim());
      this.requests = await d3.csv(this.srcRequests, (d) => ({
        date: parseTime(d.published_at.split('T')[0]),
        title: d.title,
        type: d.interpellation_type,
        url: d.html_url,
        parties: asArray(d.inquiring_parties),
        inquiringPeople: asArray(d.inquiring_people_corr),
        ministries: asArray(d.answering_ministries_corr),
      }));
    },
    onSelected(ministry) {
      this.selectedMinistry = ministry;
      this.ringChart.updateMinistry(this.selectedRequests);
    },
    getPartyCounts(requests) {
      let partyCounts = d3
        .rollups(requests.flatMap((d) => d.parties), (v) => v.length, (d) => d)
        .map(([party, count]) => ({ party, count }));

      PARTY_GROUPS.forEach((group) => {
        const toGroup = partyCounts.filter(({ party }) => group.includes(party));
        const partiesToGroup = toGroup.map(({ party }) => party);
        if (toGroup.length > 1) {
          partyCounts.push({
            party: partiesToGroup.join(';'),
            count: d3.sum(toGroup, (d) => d.count),
          });
          partyCounts = partyCounts.filter(({ party }) => !partiesToGroup.includes(party));
        }
      });

      return partyCounts;
    },
    prepareParties(parties) {
      return parties
        .filter((party) => party !== 'fraktionslos')
        .sort((a, b) => d3.ascending(
          this.parties.findIndex((p) => p === a),
          this.parties.findIndex((p) => p === b),
        ))
        .map((party) => ({
          name: party === 'Bündnis 90/Die Grünen' ? 'Die Grünen' : party.split(';').join('/'),
          style: {
            backgroundColor: party.includes(';')
              ? LIGHT_COLOR.get(party.split(';')[0])
              : LIGHT_COLOR.get(party),
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
  font-weight: bold;
  line-height: 18px;
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
  line-height: 18px;
}

.popup.loading .party {
  width: 80px;
  height: 18px;
  background-color: gray;
  vertical-align: bottom;
}

.popup.loading .number {
  display: inline-block;
  width: 40px;
  height: 18px;
  background-color: gray;
  vertical-align: bottom;
  border-radius: 20px;
}

.popup.loading .ministry-legend {
  visibility: hidden;
}

.ministry-legend {
  width: 100%;
  height: 20px;
  margin-top: -20px;
}
</style>
