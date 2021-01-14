import d3 from '@/assets/d3';

export default class MinistryLegend {
  constructor(selector, width) {
    this.selector = selector;

    this.svg = null;
    this.width = width;
    this.height = 30;
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

    const x = 0.86 * this.width;

    this.svg.append('line')
      .attr('x1', x)
      .attr('y1', 0.35 * this.height)
      .attr('x2', x)
      .attr('y2', this.height)
      .attr('stroke', 'gray');

    this.svg.append('line')
      .attr('x1', x - 3)
      .attr('y1', this.height - 5)
      .attr('x2', x)
      .attr('y2', this.height)
      .attr('stroke', 'gray');

    this.svg.append('line')
      .attr('x1', x + 3)
      .attr('y1', this.height - 5)
      .attr('x2', x)
      .attr('y2', this.height)
      .attr('stroke', 'gray');

    this.svg.append('text')
      .attr('x', x)
      .attr('y', 0.3 * this.height - 2)
      .attr('fill', 'gray')
      .attr('text-anchor', 'middle')
      .style('font-size', '0.7em')
      .text('Anzahl der Anfragen');

    return this;
  }
}
