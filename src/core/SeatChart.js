import d3 from '@/assets/d3';

import { SORTED_PARTIES, COLOR, LIGHT_COLOR } from '@/core/CONSTANTS';
import { computeSeatPositions } from '@/core/utils';

export default class SeatChart {
  constructor(selector) {
    this.selector = selector;

    // data
    this.requestsPerHead = null;
    this.seatsPartition = null;
    this.nSeats = null;

    // options
    this.svg = null;
    this.width = null;
    this.height = null;
    // this.margin = 20;
    this.config = {
      innerRadius: 50,
      seatRadius: 6,
      spacing: 1,
      minOpacity: 0.3,
    };

    // scales
    this.scales = {
      r: null,
      o: null,
    };

    this.categories = [
      '>=1 per day',
      '>=1 per week',
      '>=1 per month',
      '>=1 per half year',
      '>=1 per year',
      '<1 per year',
      '0',
    ];
  }

  data(requestsPerHead) {
    this.requestsPerHead = requestsPerHead;
    this.requestsPerHeadMap = d3.group(this.requestsPerHead, (d) => d.party);
    return this;
  }

  draw(width) {
    this.width = width;
    this.height = width / 2;

    return this
      .setUpSVG()
      .setUpScales()
      .prepareData()
      .drawAxis()
      .drawData();
  }

  setUpScales() {
    const { seatRadius, minOpacity } = this.config;

    this.scales.r = d3.scalePoint()
      .domain(this.categories)
      .range([seatRadius, 0]);

    this.scales.o = d3.scalePoint()
      .domain(this.categories)
      .range([1, minOpacity]);

    return this;
  }

  prepareData() {
    this.seatsPartition = d3.rollups(this.requestsPerHead, (v) => v.length, (d) => d.party)
      .map(([party, seats]) => ({ id: party, seats }))
      .sort((a, b) => d3.ascending(
        SORTED_PARTIES.findIndex((p) => p === a.id),
        SORTED_PARTIES.findIndex((p) => p === b.id),
      ));
    this.nSeats = d3.sum(this.seatsPartition, (d) => d.seats);

    this.isOpposition = new Map(this.requestsPerHead.map((d) => [d.party, d.isOpposition]));

    const { seats: circles, zones } = computeSeatPositions(
      this.seatsPartition, this.nSeats, this.config,
    );

    this.circles = circles;
    this.zones = zones.filter((d) => d.party !== 'fraktionslos');

    return this;
  }

  drawAxis() {
    const smallZones = this.zones.filter((d) => (d.endAngle - d.startAngle <= 0.2)
      || (d.party.length > 3 && d.endAngle - d.startAngle <= 0.35));
    const smallParties = smallZones.map((d) => d.party);
    const largeZones = this.zones.filter((d) => !smallParties.includes(d.party));

    const axis = this.svg.append('g')
      .attr('class', 'axis');

    axis.selectAll('.g-axis-large')
      .data(largeZones)
      .join('g')
      .attr('class', 'g-axis-large')
      .call((g) => g
        .append('path')
        .attr('id', (_, i) => `${this.selector}--x-tick--text-path-${i}`)
        .attr('stroke', 'none')
        .attr('fill', 'none')
        .attr('transform', 'rotate(90)')
        .attr('d', (d) => {
          const r = d.outerRadius + 5;
          return [
            `M${d3.pointRadial(d.startAngle, r)}`,
            `A${r},${r} 0,0,1 ${d3.pointRadial(d.endAngle, r)}`,
          ].join(' ');
        }))
      .call((g) => g
        .append('text')
        .attr('font-size', '0.8em')
        .append('textPath')
        .attr('xlink:href', (_, i) => `#${this.selector}--x-tick--text-path-${i}`)
        .style('font-weight', (d) => (this.isOpposition.get(d.party) ? 'bold' : 'normal'))
        .text((d) => (d.party === 'Bündnis 90/Die Grünen' ? 'Die Grünen' : d.party)));

    axis.selectAll('.g-axis-small')
      .data(smallZones)
      .join('g')
      .attr('class', 'g-axis-small')
      .call((g) => g
        .append('line')
        .attr('x1', (d) => d3.pointRadial(d.startAngle, d.outerRadius + 2)[0])
        .attr('y1', (d) => d3.pointRadial(d.startAngle, d.outerRadius + 2)[1])
        .attr('x2', (d) => d3.pointRadial(d.startAngle, d.outerRadius + 10)[0])
        .attr('y2', (d) => d3.pointRadial(d.startAngle, d.outerRadius + 10)[1])
        .attr('transform', 'rotate(90)')
        .attr('stroke', '#000')
        .attr('stroke-opacity', 0.2))
      .call((g) => g
        .append('text')
        .attr('x', (d) => d3.pointRadial(d.startAngle + 0.5 * Math.PI, d.outerRadius + 12)[0])
        .attr('y', (d) => d3.pointRadial(d.startAngle + 0.5 * Math.PI, d.outerRadius + 12)[1])
        .attr('font-size', '0.8em')
        .style('font-weight', (d) => (this.isOpposition.get(d.party) ? 'bold' : 'normal'))
        .attr('text-anchor', (d) => (d.startAngle + 0.5 * Math.PI < 0 ? 'end' : 'start'))
        .attr('dominant-baseline', (d) => (Math.abs(d.startAngle + 0.5 * Math.PI) > 1 ? 'middle' : 'auto'))
        .text((d) => (d.party === 'Bündnis 90/Die Grünen' ? 'Die Grünen' : d.party)));

    return this;
  }

  drawData() {
    const groupedCircles = d3.groups(this.circles, (d) => d.party)
      .map(([party, data]) => {
        const counts = this.requestsPerHeadMap.get(party)
          .sort((a, b) => d3.descending(a.nRequests, b.nRequests));

        const partyCircles = data
          .sort((a, b) => d3.ascending(a.row, b.row) || d3.ascending(a.theta, b.theta))
          .map((d, i) => {
            const e = d;
            e.person = counts[i].person;
            const n = counts[i].nRequestsPerDay;

            if (n >= 1) e.category = '>=1 per day';
            else if (n * 7 >= 1) e.category = '>=1 per week';
            else if (n * 30 >= 1) e.category = '>=1 per month';
            else if (n * (365 / 2) >= 1) e.category = '>=1 per half year';
            else if (n * 365 >= 1) e.category = '>=1 per year';
            else if (n !== 0) e.category = '<1 per year';
            else e.category = '0';

            return e;
          });

        return { party, circles: partyCircles };
      });

    const { r, o } = this.scales;
    const { seatRadius } = this.config;

    this.svg.append('g')
      .selectAll('g')
      .data(groupedCircles)
      .join('g')
      .call((g) => g
        .selectAll('.circle-outer')
        .data((d) => d.circles)
        .join('circle')
        .attr('class', 'circle-outer')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('r', seatRadius)
        .attr('fill', (d) => (
          d.category === '0' || d.category === '<1 per year'
            ? 'whitesmoke' : LIGHT_COLOR.get(d.party)))
        .attr('fill-opacity', 1))
      .call((g) => g
        .selectAll('.circle-inner')
        .data((d) => d.circles)
        .join('circle')
        .attr('class', 'circle-inner')
        .attr('tmp', (d) => d.party)
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('r', (d) => r(d.category))
        .attr('fill-opacity', (d) => o(d.category))
        .attr('fill', (d) => COLOR.get(d.party)));

    return this;
  }

  setUpSVG() {
    this.svg = d3.select(this.selector)
      .append('svg')
      .attr('viewBox', [
        -this.width / 2,
        -this.height,
        this.width,
        this.height])
      .attr('overflow', 'visible')
      .attr('width', this.width)
      .attr('height', this.height);

    // this.svg.append('rect')
    //   .attr('x', -this.width / 2)
    //   .attr('y', -this.height)
    //   .attr('width', this.width)
    //   .attr('height', this.height)
    //   .attr('fill', 'hsl(0, 0%, 46%)')
    //   .attr('fill-opacity', 0.1);

    return this;
  }
}
