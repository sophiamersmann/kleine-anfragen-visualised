import { select } from 'd3-selection';

// eslint-disable-next-line no-unused-vars
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
  constructor(selector, requests, elections) {
    this.selector = selector;
    this.requests = requests;
    this.elections = elections;
    this.svg = null;

    this.width = null;
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

  draw(width) {
    this.width = width;

    return this
      .prepareData()
      .setUpSVG()
      .drawRect();
  }

  prepareData() {
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
}
