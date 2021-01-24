<template>
  <main :class=classes>
    <div class="top">
      <div class="introduction">
        <h1>
          <a class="kleine-anfragen" href="https://kleineanfragen.de/" target="_blank">
            kleineAnfragen
          </a>
          <span class="visualised"> visualisiert</span>
        </h1>
        <div class="text">
          <div>
            <div class="p">
              In ihrer parlamentarischen Arbeit können Abgeordnete durch kleine Anfragen
              der Regierung auf wenige Punkte begrenzte Fragen stellen, die dann von dieser
              zeitnah beantwortet und veröffentlicht werden müssen.
            </div>
            <div class="p">
              Über 5 Jahre hat <a href="https://kleineanfragen.de/" target="_blank">kleineAnfragen</a>,
              ein Projekt der <a href="https://okfn.de/" target="_blank">Open Knowledge Foundation Deutschland e.V.</a>,
              kleine und große Anfragen aus den Landesparlamenten und aus
              dem Bundestag zusammengetragen und maschinell ausgewertet, und diese damit
              leicht zugänglich, durchsuch- und verlinkbar gemacht. Leider wurde
              das Projekt zum 31.12.2020 <a href="https://kleineanfragen.de/info/stilllegung" target="_blank">eingestellt</a>.
              Was bleibt sind <b>mehr als 100.000 dokumentierte Anfragen</b>,
              die hier visuell aufbereitet sind.
            </div>
          </div>
          <div class="p">
            <div class="legend legend-seat-chart">
              Ein Abgeordneter einer <b>Oppositions-</b> oder Regierungspartei
              war beteiligt an
              <div
              class="legend-line"
              v-for="(line, i) in legend"
              :key=i
              >
                <div class="legend-line--chart" :id=line.chartId />
                <div class="legend-line--label">{{ line.label }}</div>
              </div>
            </div>
            <div class="p info-source">
              Daten von <a href="https://kleineanfragen.de/" target="_blank">kleineAnfragen.de</a> (Stand: 1.1.2021).
              Code verfügbar auf <a href="https://github.com/sophiamersmann/kleine-anfragen-visualised" target="_blank">GitHub</a>.
            </div>
          </div>
        </div>
      </div>

      <div class="tiles tiles-bundestag">
        <election-period
          v-for="period in tilesBundestag"
          :key=period.name
          :name=period.name
          :body=period.body
          :term=period.term
          :dates=period.dates
          :has-ended=period.hasEnded
          :period-num=period.periodNum
          :n-requests=period.nRequests
          :requestsPerHead=period.requestsPerHead
          :elections=period.elections
          @top="onTop" />
      </div>
    </div>

    <div class="grid-landtage">
      <div class="row-header">
        <div>AKTUELLE LEGISLATURPERIODE</div>
        <div>LETZTE LEGISLATURPERIODE</div>
        <div>VORLETZTE LEGISLATURPERIODE</div>
      </div>
      <div class="tiles tiles-landtage">
        <election-period
          v-for="period in tilesLandtage"
          :key=period.name
          :cell=period.cell
          :name=period.name
          :body=period.body
          :term=period.term
          :dates=period.dates
          :has-ended=period.hasEnded
          :period-num=period.periodNum
          :n-requests=period.nRequests
          :requestsPerHead=period.requestsPerHead
          :elections=period.elections
          @top="onTop" />
      </div>
    </div>
  </main>
  <transition name="scale">
    <popup
      v-if="popup"
      :name=popup.key
      :body=popup.body
      :term=popup.term
      :dates=popup.dates
      :has-ended=popup.hasEnded
      :srcRequests=popup.srcRequests
      :elections=popup.elections
      @close="onFlat" />
  </transition>
  <transition name="fade">
    <div
      v-if="popup"
      class="overlay"
      @click="onFlat" />
  </transition>
  <div class="tooltip tooltip-question" />
  <div class="tooltip tooltip-seat" />
</template>

<script>
import d3 from '@/assets/d3';

import { getTermId } from '@/core/utils';
import ParliamentLegend from '@/core/ParliamentLegend';

import ElectionPeriod from './ElectionPeriod.vue';
import Popup from './Popup.vue';

export default {
  name: 'Root',
  components: {
    ElectionPeriod,
    Popup,
  },
  props: {
    srcRequests: String,
    srcElections: String,
    srcRequestsPerHead: String,
  },
  computed: {
    classes() {
      return {
        background: this.popup,
      };
    },
  },
  data() {
    return {
      requests: [],
      elections: [],
      tiles: [],
      tilesBundestag: [],
      tilesLandtage: [],
      tileMap: null,
      popup: null,
      legend: [
        { chartId: 'legend-line--chart-0', category: '0', label: 'keinen Anfragen.' },
        { chartId: 'legend-line--chart-1', category: '<1 per year', label: 'weniger als einer Anfrage im Jahr.' },
        { chartId: 'legend-line--chart-2', category: '>=1 per year', label: 'mehr als einer Anfrage im Jahr.' },
        { chartId: 'legend-line--chart-3', category: '>=1 per month', label: 'mehr als einer Anfrage im Monat.' },
        { chartId: 'legend-line--chart-4', category: '>=1 per week', label: 'mehr als einer Anfrage in der Woche.' },
        { chartId: 'legend-line--chart-5', category: '>=1 per day', label: 'mehr als einer Anfrage am Tag.' },
      ],
    };
  },
  async created() {
    await this.fetchElectionsData();
    await this.fetchRequestsPerHeadData();

    const keyFunc = (d) => getTermId(d.body, d.term);
    const electionsMap = d3.group(this.elections, keyFunc);
    const requestsPerHeadMap = d3.group(this.requestsPerHead, keyFunc);

    const groupedElections = Array.from(electionsMap)
      .map(([key, electionResults]) => {
        const {
          body, term, dates, hasEnded, periodNum, nRequests: total,
        } = electionResults[0];
        const id = getTermId(body, term);

        return {
          key,
          name: id,
          body,
          term,
          dates,
          hasEnded,
          periodNum,
          nRequests: total,
          elections: electionResults.map(({
            party, seats, isOpposition,
          }) => ({ party, seats, isOpposition })),
          requestsPerHead: requestsPerHeadMap.get(key).map(({
            name, party, isOpposition, nRequests, nRequestsPerDay,
            nRequestsPerMonth, topMinistry, topMinistryCount,
          }) => ({
            name,
            party,
            isOpposition,
            nRequests,
            nRequestsPerDay,
            nRequestsPerMonth,
            topMinistry,
            topMinistryCount,
          })),
          srcRequests: `${this.srcRequests}/requests-${id}.csv`,
        };
      });

    this.tiles = d3.groups(groupedElections, (d) => d.body)
      .map(([body, periods]) => ({
        body,
        periods: periods
          .sort((a, b) => d3.ascending(a.periodNum, b.periodNum)),
      }))
      .sort((a, b) => d3.ascending(a.body, b.body));
    this.tileMap = d3.rollup(groupedElections, (v) => v[0], (d) => d.name);

    this.tilesBundestag = this.tiles.filter((d) => d.body === 'Bundestag')[0].periods;
    this.tilesLandtage = this.tiles
      .filter((d) => d.body !== 'Bundestag')
      .map(({ periods }, row) => periods.map((d) => {
        const tile = d;
        tile.cell = { row: row + 1, col: tile.periodNum };
        return tile;
      })).flat();
  },
  mounted() {
    const scale = d3.scalePoint()
      .domain(this.legend.map((d) => d.category))
      .range([0, 5]);

    this.legend.forEach((d) => {
      new ParliamentLegend(`#${d.chartId}`, d.category, scale).draw();
    });
  },
  methods: {
    async fetchRequestsPerHeadData() {
      this.requestsPerHead = await d3.csv(this.srcRequestsPerHead, (d) => ({
        body: d.body,
        term: d.term,
        periodNum: +d.period_num,
        name: d.person,
        party: d.party,
        isOpposition: d.is_opposition.toLowerCase() === 'true',
        nRequests: +d.n_requests,
        nRequestsPerDay: +d.n_requests_per_day,
        nRequestsPerMonth: +d.n_requests_per_month,
        topMinistry: d.top_ministry,
        topMinistryCount: +d.top_ministry_count,
      }));
    },
    async fetchElectionsData() {
      const parseTime = d3.timeParse('%d/%m/%Y');
      this.elections = await d3.csv(this.srcElections, (d) => ({
        body: d.body,
        term: d.term,
        dates: {
          start: parseTime(d.start_date),
          end: d.end_date ? parseTime(d.end_date) : new Date(2020, 11, 31),
        },
        hasEnded: d.end_date !== '',
        periodNum: +d.period_num,
        party: d.party,
        seats: +d.seats,
        isOpposition: d.opposition.toLowerCase() === 'true',
        nRequests: +d.n_requests,
      }));
    },
    onTop(key) {
      this.popup = this.tileMap.get(key);
    },
    onFlat() {
      this.popup = null;
    },
  },
};
</script>

<style lang="scss">
@import '@/assets/style/global';

main {
  padding: 2 * $spacing;
  background-color: $primary-light;
  transition: filter 0.2s ease;
  max-width: $bp-2xl;
  margin: 0 auto;

  &.background {
    filter: blur(4px);
    transition: filter 0.2s ease;
    overflow: hidden;
  }

  @include max-width($bp-md) {
    padding: $spacing;
  }

  @include max-width($bp-2sm) {
    padding: 0.5 * $spacing;
  }

  // @include max-width($bp-2xl) {
  //   background-color: red;
  // }

  // @include max-width($bp-xl) {
  //   background-color: orangered;
  // }

  // @include max-width($bp-lg) {
  //   background-color: orange;
  // }

  // @include max-width($bp-md) {
  //   background-color: gold;
  // }

  // @include max-width($bp-sm) {
  //   background-color: khaki;
  // }

  // @include max-width($bp-2sm) {
  //   background-color: lightgreen;
  // }
}

.top {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: $spacing;

  @include max-width($bp-xl) {
    display: block;
  }
}

.introduction {
  line-height: 1.5;

  h1 {
    border-bottom: 1px solid $black;
    text-align: center;

      .kleine-anfragen {
      font-family: 'Raleway', sans-serif;
      text-decoration: none;
      color: inherit;
    }

    .visualised {
      font-family: 'Quicksand', sans-serif;
      font-weight: bold;
    }
  }

  .text {
    @include max-width($bp-xl) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: $spacing;
    }

    @include max-width($bp-lg) {
      display: block;
    }
  }

  .p {
    padding: 0.5 * $spacing 0;
    text-align: justify;

    &.info-source {
      padding: $spacing 0;
      font-size: 0.9rem;
    }
  }

  .legend {
    margin: 0.5 * $spacing 0;
    padding: 0.5 * $spacing $spacing;
    background-color: white;
    border-radius: $border-radius-weak;
    font-size: 0.9rem;
    line-height: 1.5;
    text-align: left;

    @include max-width($bp-xl) {
      margin: 0;
    }

    @include max-width($bp-sm) {
      padding: 0.5 * $spacing 0.5 * $spacing 0.5 * $spacing $spacing;
    }

    .legend-line {
      display: flex;
      align-items: baseline;
      padding-left: $spacing;

      &:first-of-type {
        margin-top: 0.25 * $spacing;
      }
    }

    .legend-line--chart {
      margin-right: 0.5 * $spacing;
    }
  }
}

.tiles-bundestag {
  .election-period {
    margin: $spacing;

    @include max-width($bp-xl) {
      margin: $spacing 0;
    }
  }
}

.grid-landtage {
  .row-header {
    position: sticky;
    top: 0;
    margin: $spacing 0;
    padding: $spacing 0;
    background-color: white;
    border-radius: $border-radius-weak;
    text-align: center;
    font-family: 'Quicksand', Helvetica, Arial, sans-serif;
    font-weight: bold;
    display: grid;
    grid-template-columns: repeat(3, 1fr);

    @include max-width($bp-xl) {
      display: none;
    }
  }

  .tiles-landtage {
    display: grid;
    grid-template-rows: repeat(15, 1fr);
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing;

    @include max-width($bp-xl) {
      grid-template-rows: auto;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    }

    @include max-width($bp-2sm) {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    @for $i from 1 through 3 {
      .col-#{$i} {
        grid-column: #{$i};

        @include max-width($bp-xl) {
          grid-column: auto;
        }
      }
    }

    @for $i from 1 through 15 {
      .row-#{$i} {
        grid-row: #{$i};

        @include max-width($bp-xl) {
          grid-row: auto;
        }
      }
    }
  }
}

.tooltip {
  position: absolute;
  width: 300px;
  background: white;
  z-index: 3000;
  pointer-events: none;
  opacity: 0;
  padding: 0.25 * $spacing 0.5 * $spacing;
  box-shadow: $box-shadow-weak;
  border-left: 5px solid $black;
  font-size: 0.9rem;
  border-radius: 0 $border-radius-weak $border-radius-weak 0;

  .above-title,
  .note {
    font-size: 0.7rem;
  }

  p {
    margin: 0.125 * $spacing 0;
  }
}

.overlay {
  background-color: $gray-500;
  opacity: 0.2;

  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.fade-enter-active,
.scale-enter-active  {
  transition: all 0.2s ease-in;
}

.fade-leave-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>
