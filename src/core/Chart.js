import { select } from 'd3-selection';
import { rollups, descending, sum } from 'd3-array';

import drawHorizentalBar from '@/core/draw';

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
    this.partyCount = rollups(this.requests, (v) => v.length, (d) => d.inquiringParty)
      .map(([party, count]) => ({ party, count }));

    // const sortedParties = this.partyCount
    //   .sort((a, b) => descending(a.count, b.count))
    //   .map((d) => d.party);

    // this.requests = this.requests.map((d) => {
    //   // eslint-disable-next-line no-param-reassign
    //   d.index = {
    //     inquiringParty: sortedParties.findIndex((e) => e === d.party),
    //   };
    //   return d;
    // });

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
    drawHorizentalBar(svg, vData, { ...cfg, ...{ y: 0, height: h } });
    drawHorizentalBar(svg, rData, { ...cfg, ...{ y: 2 * h, height: 4 * h } });

    return this;
  }
}
