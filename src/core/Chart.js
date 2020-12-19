import { select } from 'd3-selection';
import { rollups, descending } from 'd3-array';

import drawHorizentalBar from '@/core/draw';

export default class Chart {
  constructor(selector, data) {
    this.selector = selector;
    this.data = data;
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
  }

  draw(width = 100) {
    this.width = width;

    return this
      .prepareData()
      .setUpSVG()
      .drawHorizentalBars();
  }

  prepareData() {
    this.partyCount = rollups(this.data, (v) => v.length, (d) => d.inquiringParty)
      .map(([party, count]) => ({ party, count }));

    // const sortedParties = this.partyCount
    //   .sort((a, b) => descending(a.count, b.count))
    //   .map((d) => d.party);

    // this.data = this.data.map((d) => {
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
    const data = Object.fromEntries(
      this.partyCount
        .sort((a, b) => descending(a.count, b.count))
        .map(({ party, count }) => [party, count / this.data.length]),
    );

    const { svg, width, margin } = this;
    const height = 5;
    drawHorizentalBar(svg, data, {
      width, margin, y: 0, height,
    });
    drawHorizentalBar(svg, data, {
      width, margin, y: 2 * height, height: 4 * height,
    });

    return this;
  }
}
