import d3 from '@/assets/d3';

export default class MinistryChart {
  constructor(selector, requests, maxRequests) {
    this.selector = selector;
    this.requests = requests;
    this.maxRequests = maxRequests;

    this.svg = null;
    this.width = 200;
    this.height = 100;

    this.nRequests = null;
    this.parties = null;
    this.partyCount = null;

    this.color = null;
  }

  draw() {
    return this
      .setUpSVG()
      .setUpScales()
      .prepareData()
      .drawData();
  }

  setUpSVG() {
    this.svg = d3.select(this.selector)
      .append('svg')
      .attr('viewBox', [0, 0, this.width, this.height]);
    return this;
  }

  setUpScales() {
    this.x = d3.scaleLinear()
      .domain([0, this.maxRequests])
      .range([0, this.width]);
    return this;
  }

  showColors() {
    this.svg.selectAll('.rect-party')
      .attr('fill', (d) => this.color(d.party));
    return this;
  }

  hideColors() {
    this.svg.selectAll('.rect-party')
      .attr('fill', 'lightsteelblue');
    return this;
  }

  prepareData() {
    this.nRequests = this.requests.length;
    this.parties = this.requests.flatMap((d) => d.parties);

    this.partyCount = d3
      .rollups(this.parties, (v) => v.length, (d) => d)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => d3.descending(a.count, b.count));
    const cumsum = d3.cumsum(this.partyCount, (d) => d.count);
    this.partyCount = this.partyCount
      .map(({ party, count }, i) => ({
        party,
        count,
        x: i === 0 ? 0 : cumsum[i - 1],
      }));

    this.color = d3.scaleOrdinal()
      .domain(this.partyCount.map((d) => d.party))
      .range(d3.schemePaired.filter((_, i) => i % 2 === 1));

    return this;
  }

  drawData() {
    this.svg.append('rect')
      .attr('y', this.height / 2)
      .attr('width', (this.nRequests / this.maxRequests) * this.width)
      .attr('height', this.height / 2)
      .attr('fill', 'steelblue');

    this.svg.selectAll('.rect-party')
      .data(this.partyCount)
      .join('rect')
      .attr('class', 'rect-party')
      .attr('x', (d) => this.x(d.x))
      .attr('y', this.height / 2)
      .attr('width', (d) => (d.count / this.maxRequests) * this.width)
      .attr('height', this.height / 2)
      .attr('fill', 'lightsteelblue');

    this.svg.append('text')
      .attr('y', this.height / 2 - 5)
      .attr('fill', 'lightsteelblue')
      .style('font-size', '3em')
      .text(this.nRequests);

    return this;
  }
}
