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
  ['FDP', 'gold'],
  ['FDP/DVP', 'gold'],
  ['AFD', 'blue'],
  ['PIRATEN', 'orange'],
  ['NPD', 'brown'],
  ['FW', 'gray'],
  ['BVB/FW', 'gray'],
  ['SSW', 'gray'],
]);

const PARTY_NAMES = new Map([
  ['CDU', 'CDU'],
  ['CDU/CSU', 'CDU/CSU'],
  ['CSU', 'CSU'],
  ['SPD', 'SPD'],
  ['BUNDNIS90/DIEGRUNEN', 'Grüne'],
  ['DIELINKE', 'Linke'],
  ['FDP', 'FDP'],
  ['FDP/DVP', 'FDP/DVP'],
  ['AFD', 'AfD'],
  ['PIRATEN', 'Piraten'],
  ['NPD', 'NPD'],
  ['FW', 'FW'],
  ['BVB/FW', 'BVB/FW'],
  ['SSW', 'SSW'],
]);

export default class Chart {
  constructor(selector, requests, elections, dates) {
    this.selector = selector;
    this.requests = requests;
    this.elections = elections;
    this.dates = dates;

    this.svg = null;
    this.width = null;
    this.height = null;
    this.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    this.nRequestsPerHead = null;

    this.config = {
      offset: {
        left: 80,
        top: 5,
      },
      radius: 6,
      maxCirclesPerLine: null,
    };
    this.config.diameter = this.config.radius * 2;
  }

  draw(width) {
    return this
      .reset()
      .prepareData(width)
      .setUpSVG()
      .drawRequestsPerHead();
  }

  reset() {
    if (this.svg) select(`${this.selector} svg`).remove();
    return this;
  }

  prepareData(width) {
    const { offset, diameter: dm } = this.config;

    this.width = width;
    this.config.maxCirclesPerLine = Math.floor((this.width - offset.left) / dm) - 2;

    const nDays = timeDay.count(this.dates.start, this.dates.end);

    const seatsMap = new Map(this.elections
      .map(({ party, seats }) => [party, seats]));
    const oppositionMap = new Map(this.elections
      .map(({ party, isOpposition }) => [party, isOpposition]));

    let running = 0;
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
      })
      .filter(({ party }) => !['MISSING', 'FRAKTIONSLOS'].includes(party))
      .sort((a, b) => descending(a.value, b.value))
      .map((d) => {
        let nLines = Math.ceil(Math.round(d.value) / this.config.maxCirclesPerLine);
        nLines = nLines || 1;
        const prevLines = running;
        running += nLines;
        return { ...d, ...{ nLines, prevLines } };
      });

    this.height = running * dm + (this.nRequestsPerHead.length + 1) * offset.top;

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

    this.svg.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'steelblue')
      .attr('fill-opacity', 0.1);

    return this;
  }

  drawRequestsPerHead() {
    const {
      offset, radius: r, diameter: dm, maxCirclesPerLine: m,
    } = this.config;

    const g = this.svg.append('g')
      .attr('class', 'g-requests-per-head');

    const line = g.selectAll('g')
      .data(this.nRequestsPerHead)
      .join('g')
      .attr('class', 'g-requests-per-head')
      .attr('transform', (d, i) => `translate(0, ${(d.prevLines + 1) * dm + i * offset.top})`)
      .attr('fill', (d) => PARTY_COLORS.get(d.party))
      .attr('fill-opacity', (d) => (d.isOpposition ? 1 : 0.4));

    line.append('text')
      .attr('class', 'label label-party')
      .attr('fill', 'black')
      .style('dominant-baseline', 'central')
      .style('font-size', '0.9em')
      .text((d) => PARTY_NAMES.get(d.party));

    line.selectAll('circle')
      .data((d) => range(Math.round(d.value)))
      .join('circle')
      .attr('cx', (d) => offset.left + (d % m) * dm)
      .attr('cy', (d) => Math.floor(d / m) * dm)
      .attr('r', r);

    line.append('text')
      .attr('x', (d) => (Math.round(d.value) >= 1
        ? offset.left + ((Math.round(d.value) - 1) % m) * dm + dm
        : offset.left - r))
      .attr('y', (d) => (Math.round(d.value) >= 1
        ? Math.floor((Math.round(d.value) - 1) / m) * dm
        : 0))
      .style('dominant-baseline', 'central')
      .style('font-size', '0.8em')
      .style('font-weight', 'bold')
      .text((d) => d.display);

    return this;
  }
}
