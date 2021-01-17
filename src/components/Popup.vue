<template>
  <div :class=classes>
    <div class="sidebar">
      <h3>{{ body }}&nbsp; <span>({{ years }})</span></h3>
      <div class="text">
        Die Oppositionsparteien
          <div class="tag-group">
            <span
              class="tag"
              v-for="(party, i) in oppositionParties"
              :key=i
              :style=party.style
            >
              {{ party.name }}
            </span>
          </div>
          und Regierungparteien
          <div class="tag-group">
            <span
              class="tag"
              v-for="(party, i) in rulingParties"
              :key=i
              :style=party.style
            >
              {{ party.name }}
            </span>
          </div>
          haben insgesamt
          <div class="tag-group">
            <span class="highlight">{{ nRequests }}</span> Anfragen
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
import { COLOR, LIGHT_COLOR, PARTY_GROUPS } from '@/core/CONSTANTS';

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
    window.addEventListener('resize', this.onResize);
    await this.fetchRequestsData();
  },
  mounted() {
    const legendDiv = this.$el.querySelector('.ministry-legend');
    new MinistryLegend(legendDiv).draw();

    if (this.requests !== null) {
      const ringChartDiv = this.$el.querySelector('.chart-ring');
      const { dates, parties, maxValue } = this;
      this.ringChart = new RingChart(
        `#${ringChartDiv.id}`,
        { dates, parties, maxValue },
      )
        .drawSkeleton(ringChartDiv.clientHeight)
        .updateMinistry(this.selectedRequests);
    }
  },
  updated() {
    const ringChartDiv = this.$el.querySelector('.chart-ring');
    const {
      dates, parties, maxValue, selectedRequests,
    } = this;

    this.ringChart = new RingChart(
      `#${ringChartDiv.id}`,
      { dates, parties, maxValue },
    )
      .drawSkeleton(ringChartDiv.clientHeight)
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
    onResize() {
      const ringChartDiv = this.$el.querySelector('.chart-ring');
      this.ringChart
        .drawSkeleton(ringChartDiv.clientHeight)
        .updateMinistry(this.selectedRequests);
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
            backgroundColor: LIGHT_COLOR.get(party.split(';')[0]),
            color: COLOR.get(party.split(';')[0]),
          },
        }));
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/style/global';

$line-height: 18px;

.popup {
  position: fixed;
  z-index: 2000;
  top: $popup-offset / 2;
  left: 2 * $popup-offset;
  width: $popup-width;
  height: $popup-height;
  background-color: white;
  border-radius: $border-radius-strong;

  display: grid;
  grid-template-columns: 1fr $popup-height;

  @include max-width($bp-xl) {
    width: calc(100vw - #{$popup-offset});
    left: $popup-offset / 2;
  }

  &.loading {
    .tag {
      width: 80px;
      height: $line-height;
      background-color: $gray-300;
      vertical-align: bottom;
    }

    .highlight {
      display: inline-block;
      width: 40px;
      height: $line-height;
      background-color: $gray-300;
      vertical-align: bottom;
      border-radius: $border-radius-tag;
    }

    .ministry-legend {
      visibility: hidden;
    }
  }
}

.chart-ring {
  height: $popup-height;
  width: $popup-height;
}

.sidebar {
  height: $popup-height;
  padding: $spacing;
  background-color: $primary-light;
  border-radius: $border-radius-strong 0 0 $border-radius-strong;
  display: flex;
  flex-direction: column;

  h3 {
    text-align: center;
    border-bottom: 1px solid $black;
    padding-bottom: 0.5 * $spacing;

    span {
      font-weight: normal;
    }
  }

  .text {
    border: 1px solid $primary-light;
    line-height: 1.25;
    margin: $spacing 0;
  }
}

.tag-group {
  margin-left: 0.5 * $spacing;
  padding: 2px 0 0.25 * $spacing 0;

  .tag {
    display: inline-block;
    padding: 0 5px;
    border-radius: 2 * $border-radius-tag;
    font-size: 0.9rem;
    font-weight: bold;
    white-space: nowrap;
    line-height: $line-height;
  }

  .highlight {
    font-size: 0.9rem;
    font-weight: bold;
    line-height: $line-height;
  }
}

.ministry-legend {
  width: 50px;
  height: 20px;
  margin-top: -20px;
  align-self: flex-end;
}
</style>
