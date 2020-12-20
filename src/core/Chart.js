import { select } from 'd3-selection';
import { timeDay } from 'd3-time';
import { rollups, range, descending } from 'd3-array';

const PARTY_COLORS = new Map([
  ['CDU', 'black'],
  ['CDU/CSU', 'black'],
  ['CSU', 'black'],
  ['SPD', 'red'],
  ['BUNDNIS90/DIEGRUNEN', 'green'],
  ['DIELINKE', 'purple'],
  ['FDP', 'yellow'],
  ['FDP/DVP', 'yellow'],
  ['AFD', 'blue'],
  ['PIRATEN', 'orange'],
  ['NPD', 'brown'],
  ['FW', 'gray'],
  ['ABW', 'gray'],
  ['BVB/FW', 'gray'],
  ['BIW', 'gray'],
  ['SSW', 'gray'],
]);

export default class Chart {
  constructor(selector, requests, elections, dates) {
    this.selector = selector;
    this.requests = requests;
    this.elections = elections;
    this.dates = dates;

    this.svg = null;
    this.width = null;
    this.height = 150;
    this.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    this.nRequestsPerHead = null;
  }

  draw(width) {
    this.width = width;

    return this
      .prepareData()
      .setUpSVG()
      .drawRequestsPerHead();
  }

  prepareData() {
    const nDays = timeDay.count(this.dates.start, this.dates.end);

    const seatsMap = new Map(this.elections
      .map(({ party, seats }) => [party, seats]));
    const oppositionMap = new Map(this.elections
      .map(({ party, isOpposition }) => [party, isOpposition]));

    this.nRequestsPerHead = rollups(this.requests, (v) => v.length, (d) => d.party)
      .map(([party, nRequests]) => {
        const value = ((nRequests / nDays) * 365) / seatsMap.get(party);
        let display = 0;
        if (value) display = Math.round(value) >= 1 ? Math.round(value) : '<1';

        return {
          party,
          value,
          display,
          isOpposition: oppositionMap.get(party),
        };
      }).filter(({ party }) => !['MISSING', 'FRAKTIONSLOS'].includes(party));

    return this;
  }

  setUpSVG() {
    this.svg = select(this.selector)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height])
      // .style('width', this.width + this.margin.left + this.margin.right)
      // .style('height', this.height + this.margin.top + this.margin.botom)
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
    return this;
  }

  drawRequestsPerHead() {
    const LINE_HEIGHT = 20;
    const OFFSET = 200;
    const RADIUS = 5;

    const g = this.svg.append('g')
      .attr('class', 'g-requests-per-head');

    const line = g.selectAll('g')
      .data(this.nRequestsPerHead.sort((a, b) => descending(a.value, b.value)))
      .join('g')
      .attr('class', 'g-requests-per-head')
      .attr('transform', (_, i) => `translate(0, ${(i + 1) * LINE_HEIGHT})`)
      .attr('fill', (d) => PARTY_COLORS.get(d.party))
      .attr('fill-opacity', (d) => (d.isOpposition ? 1 : 0.4));

    line.append('text')
      .attr('class', 'label label-party')
      .attr('fill', 'black')
      .attr('dominant-baseline', 'central')
      .text((d) => d.party);

    line.selectAll('circle')
      .data((d) => range(Math.round(d.value)))
      .join('circle')
      .attr('cx', (d) => OFFSET + d * 2 * RADIUS)
      .attr('r', RADIUS);

    line.append('text')
      .attr('x', (d) => (Math.round(d.value) >= 1 ? OFFSET + Math.round(d.value) * 2 * RADIUS : OFFSET - RADIUS))
      .attr('dominant-baseline', 'central')
      .attr('font-size', '0.9em')
      .attr('fill-opacity', (d) => (d.isOpposition ? 1 : 0.3))
      .style('font-weight', 'bold')
      .text((d) => d.display);

    return this;
  }
}
