<template>
  <div class="legend">
    Ein:e Abgeordnete:r einer <b>Oppositions-</b> oder Regierungspartei war beteiligt an
    <div
      class="legend-line"
      v-for="(line, i) in legendLines"
      :key=i
    >
      <div class="legend-line--chart" :id=line.chartId />
      <div class="legend-line--label">{{ line.label }}</div>
    </div>
  </div>
</template>

<script>
import d3 from '@/assets/d3';

import ParliamentLegend from '@/core/ParliamentLegend';

export default {
  name: 'LegendText',
  data() {
    return {
      legendLines: [
        { chartId: 'legend-line--chart-1', category: '<1 per year', label: 'weniger als einer Anfrage im Jahr' },
        { chartId: 'legend-line--chart-2', category: '>=1 per year', label: 'mehr als einer Anfrage im Jahr' },
        { chartId: 'legend-line--chart-3', category: '>=1 per month', label: 'mehr als einer Anfrage im Monat' },
        { chartId: 'legend-line--chart-4', category: '>=1 per week', label: 'mehr als einer Anfrage in der Woche' },
        { chartId: 'legend-line--chart-5', category: '>=1 per day', label: 'mehr als einer Anfrage am Tag' },
      ],
    };
  },
  mounted() {
    const categories = this.legendLines.map((d) => d.category);
    categories.unshift('0');

    const scale = d3.scalePoint()
      .domain(categories)
      .range([0, 5]);

    this.legendLines.forEach((d) => {
      new ParliamentLegend(`#${d.chartId}`, d.category, scale).draw();
    });
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/style/global';

.legend {
  background-color: white;
  padding: $spacing / 4 $spacing / 2;
  border-radius: $border-radius-weak;
  margin: $spacing / 2 0;

  .legend-line {
    display: flex;
    align-items: baseline;
    margin-left: $spacing;
  }

  .legend-line--chart {
    margin-right: 10px;
  }

  .legend-line--label {
    line-height: 1.15;
  }
}
</style>
