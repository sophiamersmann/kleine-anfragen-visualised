<template>
  <button
    :class=classes
    @click="onClick"
    @mouseenter="chart.showColors"
    @mouseleave="updateChartColor" >
    <div class="label">
      {{ value ? value : '(Nicht bekannt)' }}
    </div>
    <div
      :id=chartId
      class="chart chart-ministry" />
  </button>
</template>

<script>
import MinistryChart from '@/core/MinistryChart';

export default {
  name: 'MinistryButton',
  props: {
    id: Number,
    value: String,
    active: Boolean,
    requests: Array,
    maxValue: Number,
    sortedParties: Array,
  },
  emits: ['clicked'],
  data() {
    return {
      chart: null,
    };
  },
  computed: {
    classes() {
      return {
        'ministry-button': true,
        active: this.active,
      };
    },
    chartId() {
      return `chart-ministry-${this.id}`;
    },
  },
  mounted() {
    const chartDiv = this.$el.querySelector('.chart-ministry');
    this.chart = new MinistryChart(
      `#${chartDiv.id}`,
      this.requests,
      this.maxValue,
      this.sortedParties,
    ).draw();

    this.updateChartColor();
  },
  updated() {
    this.updateChartColor();
  },
  methods: {
    onClick() {
      this.$emit('clicked', this.value);
    },
    updateChartColor() {
      if (this.active) {
        this.chart.showColors();
      } else {
        this.chart.hideColors();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/style/global';

.ministry-button {
  width: 100%;
  margin: $spacing / 4 0;
  padding: 0.25 * $spacing;

  border: 1px solid white;
  border-radius: $border-radius-weak;

  display: grid;
  grid-template-columns: 1fr 50px;
  gap: 0.5 * $spacing;
  align-items: center;

  background-color: white;
  transition: all .2s;

  font-size: 0.9rem;

  &:first-of-type {
    margin-top: 0;
  }

  &:hover {
    border-color: $primary;
  }

  &.active {
    border-color: $primary;
    font-weight: bold;
  }

  .label {
    justify-self: start;
    text-align: left;
  }

  .chart {
    justify-self: end;
  }
}
</style>
