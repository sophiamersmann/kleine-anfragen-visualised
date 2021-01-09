import d3 from '@/assets/d3';

export default class MinistryChart {
  constructor(selector, requests) {
    this.selector = selector;
    this.requests = requests;

    this.svg = null;
    this.width = 200;
    this.height = 50;
    this.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  draw() {
    return this.setUpSVG();
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
      .attr('fill', 'red');

    return this;
  }
}
