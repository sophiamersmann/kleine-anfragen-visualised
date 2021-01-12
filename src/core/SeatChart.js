import d3 from '@/assets/d3';

import { SORTED_PARTIES } from '@/core/CONSTANTS';
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
      seatRadius: 5,
      spacing: 2,
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

    this.color = d3.scaleOrdinal()
      .domain(this.seatsPartition.map((d) => d.id))
      .range(d3.schemePaired.filter((_, i) => i % 2 === 1));

    this.lightColor = d3.scaleOrdinal()
      .domain(this.seatsPartition.map((d) => d.id))
      .range(d3.schemePaired.filter((_, i) => i % 2 === 0));

    return this;
  }

  drawData() {
    const circles = computeSeatPositions(
      this.seatsPartition,
      this.nSeats,
      this.config,
    );

    const groupedCircles = d3.groups(circles, (d) => d.party)
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

    const { r } = this.scales;
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
        .attr('fill', (d) => this.lightColor(d.party))
        .attr('fill-opacity', 1))
      .call((g) => g
        .selectAll('.circle-inner')
        .data((d) => d.circles)
        .join('circle')
        .attr('class', 'circle-inner')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('r', (d) => r(d.category))
        .attr('fill-opacity', 1)
        .attr('fill', (d) => this.color(d.party)));

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
    //   .attr('fill', 'steelblue')
    //   .attr('fill-opacity', 0.1);

    return this;
  }
}
