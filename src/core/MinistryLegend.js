import d3 from '@/assets/d3';

import color from '@/assets/style/_global.scss';

export default class MinistryLegend {
  constructor(selector) {
    this.selector = selector;

    this.svg = null;
    this.width = 50;
    this.height = 20;
  }

  draw() {
    this.svg = d3.select(this.selector)
      .append('svg')
      .attr('viewBox', [
        0,
        0,
        this.width,
        this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('overflow', 'visible');

    const x = 0;
    const c = color.black;

    this.svg.append('line')
      .attr('x1', x)
      .attr('y1', 0.35 * this.height)
      .attr('x2', x)
      .attr('y2', this.height)
      .attr('stroke', c);

    this.svg.append('line')
      .attr('x1', x - 3)
      .attr('y1', this.height - 5)
      .attr('x2', x)
      .attr('y2', this.height)
      .attr('stroke', c);

    this.svg.append('line')
      .attr('x1', x + 3)
      .attr('y1', this.height - 5)
      .attr('x2', x)
      .attr('y2', this.height)
      .attr('stroke', c);

    this.svg.append('text')
      .attr('x', x)
      .attr('y', 0.3 * this.height - 2)
      .attr('fill', c)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7rem')
      .text('Anzahl der Anfragen');

    return this;
  }
}
