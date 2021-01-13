<template>
  <button
    :class=classes
    @click="onClick"
    @mouseenter="chart.showColors"
    @mouseleave="updateChartColor" >
    <div class="label">
      {{ value }}
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

<style scoped>
button {
  width: 100%;
  margin: calc(var(--spacing) / 4) 0;
  padding: calc(0.25 * var(--spacing));

  border: 1px solid white;
  border-radius: 10px;

  display: grid;
  grid-template-columns: 1fr 50px;
  grid-gap: calc(0.5 * var(--spacing));
  align-items: center;

  background-color: white;
  transition: all .2s;

  font-size: 0.8rem;
}

button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #cebdff;
}

button.active {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #cebdff;
  font-weight: bold;
}

.label {
  justify-self: start;
  text-align: left;
}

.chart {
  justify-self: end;
}
</style>
