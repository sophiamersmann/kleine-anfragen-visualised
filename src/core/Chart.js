import { select } from 'd3-selection';
import { rollups, descending, sum } from 'd3-array';

import drawHorizentalBar from '@/core/draw';

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
  constructor(selector, requests, votes) {
    this.selector = selector;
    this.requests = requests;
    this.votes = votes;
    this.svg = null;

    this.width = 100;
    this.height = 100;
    this.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    this.partyCount = null;
    this.sortedParties = null;

    this.barHeight = 5;
  }

  draw(width = 100) {
    this.width = width;

    return this
      .prepareData()
      .setUpSVG()
      .drawHorizentalBars();
  }

  prepareData() {
    this.partyCount = rollups(this.requests, (v) => v.length, (d) => d.party)
      .map(([party, count]) => ({ party, count }));

    this.sortedParties = this.partyCount
      .sort((a, b) => descending(a.count, b.count))
      .map((d) => d.party);

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

  drawHorizentalBars() {
    const rData = Object.fromEntries(
      this.partyCount
        .sort((a, b) => descending(a.count, b.count))
        .map(({ party, count }) => [party, count / this.requests.length]),
    );

    const proportionTotal = sum(this.votes.map((d) => d.vote));
    const vData = Object.fromEntries(
      this.votes.map(({ party, vote }) => [party, vote / proportionTotal]),
    );

    const { svg, width, margin } = this;
    const h = this.barHeight;
    const cfg = { width, margin };
    drawHorizentalBar(svg, vData, { ...cfg, ...{ y: 0, height: h } }, PARTY_COLORS);
    drawHorizentalBar(svg, rData, { ...cfg, ...{ y: 2 * h, height: 4 * h } }, PARTY_COLORS);

    return this;
  }
}
