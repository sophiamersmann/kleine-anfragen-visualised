<template>
  <div :class=classes @click="onClick">
    <div
      :id=seatChartId
      class="chart chart-seat" />
    <div class="body">
      <h3>{{ body }} <span>({{ years }})</span></h3>
      <p>
        {{ nRequests }} Anfragen eingegangen (Anfragen pro Jahr und/oder Kopf)
      </p>
      <!-- <p>
        Opposition:
        <span
          class="party"
          v-for="(party, i) in oppositionParties"
          :key=i
          :style=party.style
        >
          {{ party.name }}
        </span>
      </p> -->
      <!-- <p>
        Ruling parties:
        <span
          class="party"
          v-for="(party, i) in rulingParties"
          :key=i
          :style=party.style
        >
          {{ party.name }}
        </span>
      </p> -->
    </div>
  </div>
</template>

<script>
import d3 from '@/assets/d3';

import SeatChart from '@/core/SeatChart';
import { getTermId, displayTimeRange } from '@/core/utils';
import { SORTED_PARTIES, COLOR, LIGHT_COLOR } from '@/core/CONSTANTS';

export default {
  name: 'ElectionPeriod',
  props: {
    name: String,
    body: String,
    term: String,
    dates: Object,
    hasEnded: Boolean,
    periodNum: Number,
    requests: Array,
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

    const config = {
      innerRadius: 30,
      seatRadius: 5,
      spacing: 1,
    };

    if (this.body === 'Bundestag') {
      config.innerRadius = 50;
      config.seatRadius = 4;
    }

    this.seatChart = new SeatChart(`#${chartDiv.id}`, config)
      .data(this.requestsPerHead)
      .draw(chartDiv.clientWidth);
  },
  computed: {
    classes() {
      const classes = {
        'election-period': true,
        disabled: this.requests === null,
      };
      classes[`col-${this.periodNum}`] = true;
      return classes;
    },
    seatChartId() {
      return `chart-seat-${getTermId(this.body, this.term)}`;
    },
    years() {
      return displayTimeRange(this.dates, this.hasEnded);
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
    getChartDiv() {
      return this.$el.querySelector('.chart-seat');
    },
    onClick() {
      this.$emit('top', this.name);
    },
    prepareParties(parties) {
      return parties
        .sort((a, b) => d3.ascending(
          SORTED_PARTIES.findIndex((p) => p === a.party),
          SORTED_PARTIES.findIndex((p) => p === b.party),
        ))
        .map((d) => ({
          name: d.party,
          style: {
            color: COLOR.get(d.party),
            backgroundColor: LIGHT_COLOR.get(d.party),
          },
        }));
    },
  },
};
</script>

<style scoped>
.election-period {
  background-color: white;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: var(--spacing);
}

.election-period.disabled {
  pointer-events: none;
}

.body {
  text-align: center;
}

.body h3 span {
  font-weight: normal;
}
</style>
