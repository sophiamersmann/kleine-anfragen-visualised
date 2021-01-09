import d3 from '@/assets/d3';

export default class MinistryChart {
  constructor(selector, requests, maxRequests) {
    this.selector = selector;
    this.requests = requests;
    this.maxRequests = maxRequests;

    // ! Only length of requests needed at the moment
    this.nRequests = this.requests.length;

    this.width = 200;
    this.height = 100;
  }

  draw() {
    const svg = d3.select(this.selector)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height]);

    svg.append('rect')
      .attr('y', this.height / 2)
      .attr('width', (this.nRequests / this.maxRequests) * this.width)
      .attr('height', this.height / 2)
      .attr('fill', 'lightsteelblue');

    svg.append('text')
      .attr('y', this.height / 2 - 5)
      .attr('fill', 'lightsteelblue')
      .style('font-size', '3em')
      .text(this.nRequests);
  }
}
