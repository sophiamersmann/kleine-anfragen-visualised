<template>
  <button
    :class=classes
    @click="onClick"
    @mouseenter="chart.showColors"
    @mouseleave="chart.hideColors" >
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
  },
  methods: {
    onClick() {
      this.$emit('clicked', this.value);
    },
  },
};
</script>

<style scoped>
button {
  width: 100%;
  margin: calc(var(--spacing) / 4) 0;
  border: 0;

  display: grid;
  grid-template-columns: 1fr 50px;
  align-items: center;
}

.active {
  background-color: cornflowerblue;
}

.label {
  justify-self: start;
  text-align: left;
}

.chart {
  justify-self: end;
}
</style>
