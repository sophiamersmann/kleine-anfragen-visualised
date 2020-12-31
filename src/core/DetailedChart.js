import d3 from '@/assets/d3';

import { PARTY_COLORS, IGNORE_PARTIES } from '@/core/CONSTANTS';

export default class DetailedChart {
  constructor(selector, requests) {
    this.selector = selector;
    this.requests = requests;

    this.svg = null;
    this.width = null;
    this.height = 500;
    this.margin = {
      top: 20,
      right: 0,
      bottom: 0,
      left: 0,
    };

    this.groups = null;

    this.config = {
      nRows: 6,
      squareSize: 8,
    };
  }

  draw(width) {
    return this
      .prepareData(width)
      .setUpSVG()
      .drawChart();
  }

  prepareData(width) {
    this.width = width;

    const { nRows, squareSize } = this.config;

    const parties = this.requests
      .flatMap((d) => d.parties)
      .filter((party) => !IGNORE_PARTIES.includes(party));

    const sortedParties = d3
      .rollups(parties, (v) => v.length, (d) => d)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => d3.descending(a.count, b.count))
      .map(({ party }) => party);

    const orderIndex = (d) => {
      if (d.parties.length === 1 && IGNORE_PARTIES.includes(d.parties[0])) {
        return 20 * sortedParties.length;
      }
      if (d.parties.length > 2) {
        return 10 * sortedParties.length;
      }
      return 10 * sortedParties.findIndex((p) => p === d.parties[0]) + d.parties.length - 1;
    };

    this.grouped = d3
      .groups(this.requests, (d) => d.ministries[0])
      .map(([ministry, values]) => ({
        ministry,
        values: values
          .sort((a, b) => d3.ascending(orderIndex(a), orderIndex(b)))
          .map((d, i) => {
            const e = d;
            e.x = Math.floor(i / nRows) * squareSize;
            e.y = (i % nRows) * squareSize;
            return e;
          }),
      }))
      .sort((a, b) => d3.descending(a.values.length, b.values.length));

    return this;
  }

  setUpSVG() {
    this.svg = d3.select(this.selector)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.svg.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'bisque');

    return this;
  }

  drawChart() {
    const { margin } = this;
    const { nRows, squareSize: size } = this.config;
    const offset = 3 * size;

    this.svg.selectAll('g')
      .data(this.grouped)
      .join('g')
      .attr('class', 'g-ministry-segment')
      .attr('transform', (_, i) => `translate(0, ${i * nRows * size + i * offset + margin.top})`)
      .call((g) => g
        .append('text')
        .attr('class', 'label label-ministry')
        .attr('dy', -3)
        .style('font-size', '0.9em')
        .text((d) => d.ministry))
      .call((g) => g
        .append('g')
        .attr('class', 'g-squares')
        .selectAll('rect')
        .data((d) => d.values)
        .join('rect')
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y)
        .attr('width', size)
        .attr('height', size)
        .attr('fill', (d) => (d.parties.length <= 2 ? PARTY_COLORS.get(d.parties[0]) : 'lightgray'))
        .attr('stroke-width', 0.5)
        .attr('stroke', 'white'))
      .call((g) => g
        .append('g')
        .attr('class', 'g-triangles')
        .selectAll('path')
        .data((d) => d.values.filter((e) => e.parties.length === 2))
        .join('path')
        .attr('d', (d) => [
          `M${d.x + size} ${d.y}`,
          `L ${d.x + size} ${d.y + size}`,
          `L ${d.x} ${d.y + size}`,
        ].join(' '))
        .attr('stroke-width', 0.5)
        .attr('stroke', 'white')
        .attr('fill', (d) => PARTY_COLORS.get(d.parties[1])));
  }
}
