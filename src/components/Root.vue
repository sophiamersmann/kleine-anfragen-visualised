<template>
  <main :class=classes>
    <heading />
    <meta-info />

    <div class="warning">
      Diese Visualiserung wurde nicht für Geräte mit kleinen Bildschirmen entwickelt.
      Wenn du mit den Grafiken interagieren möchtest, öffne diese Webseite an einem Desktop.
    </div>

    <div class="top">
      <div class="top--text">
        <div class="p">
          Kleine Anfragen sind ein Instrument der <b>parlamentarischen Kontrolle</b>.
          Sie erlauben
          Abgeordneten eines Parlamentes der Regierung Fragen zu stellen, die dann zeitnah
          von dieser beantwortet werden müssen. Die Antworten werden auf den 16+1
          Parlamentsdokumentationssystemen der Landesparlamente und des Bundestages
          veröffentlicht.
          Die Plattform <a href="https://kleineanfragen.de/" target="_blank">kleineAnfragen</a>
          der <a href="https://okfn.de/" target="_blank">Open Knowledge Foundation</a>
          sammelt Anfragen und Antworten aus allen Landesparlamenten. Eine maschinelle
          Auswertung macht dabei die Anfragen leicht
          zugänglich und ermöglicht das Durchsuchen und Verlinken. Leider wurde das Projekt zum
          31.12.2020 <a href="https://kleineanfragen.de/info/stilllegung" target="_blank">eingestellt</a>.
          Was bleibt sind <b>mehr als 100.000 dokumentierte Anfragen</b>,
          die hier visuell aufbereitet sind.
        </div>
        <div class="p">
          Die von <a href="https://kleineanfragen.de/" target="_blank">kleineAnfragen</a>
          gesammelten Daten wurden immer wieder genutzt,
          um Interessantes aufzuzeigen. Zum Beispiel konnte <a href="https://www.zeit.de/index" target="_blank">
          ZEIT ONLINE</a> mit Hilfe
          einer Reihe von Anfragen an die Bundesregierung eine
          <a href="https://www.zeit.de/mobilitaet/2014-09/deutsche-bahn-bruecken-zustand" target="_blank">
          interaktive Karte über den Zustand von Bahnbrücken in Deutschland</a> erstellen.
          Auch das <a href="https://lab.technologiestiftung-berlin.de" target="_blank">
          Ideation & Prototyping Lab</a> der
          <a href="https://www.technologiestiftung-berlin.de/de/startseite/" target="_blank">
          Technologiestiftung Berlin</a> haben
          schriftliche Anfragen aus dem Berliner Abgeordnetenhaus genutzt, um zu untersuchen,
          <a href="https://lab.technologiestiftung-berlin.de/projects/kleine-anfragen/de/" target="_blank">
          welches Potenzial für Open Data in den Anfragen steckt</a>.
        </div>
        <div class="p">
          Auf dieser Webseite, die ebenfalls auf den Daten von
          <a href="https://kleineanfragen.de/" target="_blank">kleineAnfragen</a> basiert,
          steht nicht der Erkenntnisgewinn im Bezug auf spezifische Sachverhalte im Vordergrund.
          Vielmehr ermöglicht die <b>visuelle Aufbereitung</b> einen spielerischer
          Zugang zu den Daten,
          der das Entdecken und Durchsuchen von Anfragen "fun" machen soll.
          Eine Parlamentsgrafik zeigt wie häufig einzelne Abgeordnete in einer
          Legislaturperiode kleine Anfragen gestellt haben. Dabei ist auffällig,
          dass Anfragen vor allem ein Instrument der <b>Opposition</b> sind, obwohl in
          einigen Bundesländern nicht wenige Anfragen auch von Abgeordneten der
          Regierungsparteien gestellt wurden (z.B. in Berlin). Die Aktivität eines einzelnen
          Abgeordneten ist wie folgt kategorisiert:
          <LegendText />
          Ein Klick auf die Parlamentsgrafik ermöglicht dann eine tiefere Auseinandersetzung
          mit allen Anfragen, die während dieser Legislaturperiode gestellt wurden.
        </div>
      </div>

      <div
        class="top--chart election-period-wrapper"
        v-for="(period, i) in tilesBundestag"
        :key=i
      >
        <election-period
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
    <Popup
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

import ElectionPeriod from './ElectionPeriod.vue';
import Popup from './Popup.vue';

import Heading from './Heading.vue';
import MetaInfo from './MetaInfo.vue';
import LegendText from './LegendText.vue';

export default {
  name: 'Root',
  components: {
    Heading,
    MetaInfo,
    LegendText,
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
  max-width: $bp-2xl;
  margin: 0 auto;
  transition: filter 0.2s ease;

  &.background {
    filter: blur(4px);
    transition: filter 0.2s ease;
    overflow: hidden;
  }

  @include max-width($bp-md) {
    padding: $spacing;
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

.warning {
  border-radius: $border-radius-weak;
  border: 5px solid $primary;
  background-color: $primary-dark;
  color: white;
  padding: $spacing / 2;
  margin: $spacing auto;
  display: none;
  max-width: $text-max-width;
  line-height: 1.5;

  @include max-width($bp-lg) {
    display: block;
  }
}

.top {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-auto-flow: dense;
  gap: 2 * $spacing;
  padding: 2 * $spacing 0;

  @include max-width($bp-xl) {
    display: block;
    padding-bottom: 0;
  }

  @include max-width($bp-lg) {
    padding-top: $spacing;
  }

  .top--chart {
    grid-column: 1;

    &:nth-of-type(1) {
      grid-row: 1;
    }

    &:nth-of-type(2) {
      grid-row: 2;
    }

    @include max-width($bp-xl) {
      margin: $spacing 0;
    }
  }

  .top--text {
    grid-column: 2;
    grid-row: 1 / 3;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: $spacing;

    line-height: 1.5;

    @include max-width($bp-xl) {
      max-width: $text-max-width;
      margin: 0 auto 2 * $spacing;
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
