import { select } from 'd3-selection';
import { timeDay } from 'd3-time';
import { rollups, ascending, range } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { pointRadial, arc } from 'd3-shape';

import { PARTY_COLORS, PARTY_NAMES, SORTED_PARTIES } from '@/core/CONSTANTS';

export default class ParliamentChart {
  constructor(selector, requests, elections, dates) {
    this.selector = selector;
    this.requests = requests;
    this.elections = elections;
    this.dates = dates;

    this.svg = null;
    this.width = null;
    this.height = null;
    this.margin = 20;

    this.nRequestsPerHead = null;

    this.config = {
      maxValue: 30,
      nBands: 12,
      innerRadius: 20,
      outerRadius: null,
    };
  }

  draw(width) {
    return this
      .reset()
      .prepareData(width)
      .setUpSVG()
      .drawChart();
  }

  reset() {
    if (this.svg) select(`${this.selector} svg`).remove();
    return this;
  }

  prepareData(width) {
    this.width = width;
    this.height = width / 2;
    this.config.outerRadius = width / 2 - this.margin;

    const nDays = timeDay.count(this.dates.start, this.dates.end);

    const seatsMap = new Map(this.elections
      .map(({ party, seats }) => [party, seats]));
    const oppositionMap = new Map(this.elections
      .map(({ party, isOpposition }) => [party, isOpposition]));

    const requests = this.requests.filter((d) => !['MISSING', 'FRAKTIONSLOS'].includes(d.party));
    this.nRequestsPerHead = rollups(requests, (v) => v.length, (d) => d.party)
      .map(([party, nRequests]) => {
        const value = ((nRequests / nDays) * 365) / seatsMap.get(party);
        let display = 0;
        if (value > 0) {
          display = value < 1 ? '<1' : Math.round(value);
        }

        return {
          party,
          value: Math.round(value),
          display,
          isOpposition: oppositionMap.get(party),
        };
      })
      .sort((a, b) => ascending(
        SORTED_PARTIES.findIndex((d) => d === a.party),
        SORTED_PARTIES.findIndex((d) => d === b.party),
      ));

    return this;
  }

  setUpSVG() {
    this.svg = select(this.selector)
      .append('svg')
      .attr('viewBox', [
        -this.width / 2,
        -this.height,
        this.width,
        this.height])
      // .attr('overflow', 'visible')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');

    // this.svg.append('rect')
    //   .attr('x', -this.width / 2)
    //   .attr('y', -this.height)
    //   .attr('width', this.width)
    //   .attr('height', this.height)
    //   .attr('fill', 'steelblue')
    //   .attr('fill-opacity', 0.1);

    return this;
  }

  drawChart() {
    const {
      maxValue, nBands, innerRadius, outerRadius,
    } = this.config;

    const x = scaleLinear()
      .domain([0, this.nRequestsPerHead.length])
      .range([-0.5 * Math.PI, 0.5 * Math.PI]);

    const y = scaleLinear()
      .domain([0, maxValue])
      .range([innerRadius, outerRadius]);

    const yTicks = y.ticks(nBands);
    const yTickSpacing = yTicks[1] - yTicks[0];

    const xAxis = (g) => g
      .selectAll('g')
      .data(range(this.nRequestsPerHead.length + 1))
      .join('g')
      .append('path')
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 0.5)
      .attr('d', (d) => `
        M${pointRadial(x(d), innerRadius)}
        L${pointRadial(x(d), outerRadius + this.margin)}
      `);

    const yAxis = (g) => g.selectAll('g')
      .data([0, maxValue])
      .join('g')
      .attr('fill', 'none')
      .append('path')
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 0.5)
      .attr('d', (d) => arc()
        .outerRadius(y(d))
        .startAngle(x(0))
        .endAngle(x(this.nRequestsPerHead.length))(d));

    this.svg.selectAll('g')
      .data(this.nRequestsPerHead)
      .join('g')
      .attr('class', 'g-party-slice')
      .attr('fill', (d) => PARTY_COLORS.get(d.party))
      .selectAll('path')
      .data((d, i) => range(yTickSpacing, d.value + 1, yTickSpacing)
        .map((step) => ({ step, party: d.party, angle: i })))
      .join('path')
      .attr('fill-opacity', (d, i) => (d.step > maxValue ? 0.1 : (i + 1) / nBands))
      .attr('d', (d) => arc()
        .innerRadius(y(d.step - yTickSpacing))
        .outerRadius(y(d.step))
        .startAngle(x(d.angle))
        .endAngle(x(d.angle + 1))(d));

    const gLabels = this.svg
      .append('g')
      .attr('class', 'labels');

    gLabels
      .append('g')
      .attr('class', 'g-label-paths')
      .selectAll('.label-path')
      .data(range(this.nRequestsPerHead.length))
      .join('path')
      .attr('id', (i) => `${this.selector}-label-path-${i}`)
      .attr('class', 'label-path')
      .attr('fill', 'none')
      .attr('d', (i) => `
        M${pointRadial(x(i), outerRadius + 5)}
        A${outerRadius + 5},${outerRadius + 5} 0,0,1 ${pointRadial(x(i + 1), outerRadius + 5)}
      `);

    gLabels
      .append('g')
      .attr('class', 'g-label-texts')
      .selectAll('.label')
      .data(this.nRequestsPerHead)
      .join('text')
      .attr('class', 'label')
      .append('textPath')
      .attr('xlink:href', (_, i) => `#${this.selector}-label-path-${i}`)
      .attr('startOffset', 5)
      .style('font-size', '0.7em')
      .style('font-weight', (d) => (d.isOpposition ? 'bold' : 'normal'))
      .text((d) => `${PARTY_NAMES.get(d.party)} \u00A0 ${d.display}`);

    this.svg.append('g')
      .attr('class', 'axis axis-x')
      .call(xAxis);

    this.svg.append('g')
      .attr('class', 'axis axis-y')
      .call(yAxis);

    return this;
  }
}
