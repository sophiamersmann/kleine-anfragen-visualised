import d3 from '@/assets/d3';

import { SORTED_PARTIES, COLOR, LIGHT_COLOR } from '@/core/CONSTANTS';
import { computeSeatPositions } from '@/core/utils';

export default class SeatChart {
  constructor(selector, innerRadius) {
    this.selector = selector;

    // data
    this.requestsPerHead = null;
    this.seatsPartition = null;
    this.nSeats = null;

    // options
    this.svg = null;
    this.width = null;
    this.height = null;
    this.config = {
      seatRadius: 5,
      spacing: 1,
      innerRadius,
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
      .createDefs()
      .setUpScales()
      .prepareData()
      .drawAxis()
      .drawData();
  }

  createDefs() {
    this.svg.append('defs')
      .selectAll('filter')
      .data(SORTED_PARTIES)
      .join('filter')
      .attr('id', (_, i) => `bg-filter-${i}`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 1)
      .attr('height', 1)
      .call((f) => f
        .append('feFlood')
        .attr('flood-color', (d) => LIGHT_COLOR.get(d))
        .attr('result', 'bg'))
      .call((f) => f
        .append('feMerge')
        .call((m) => m
          .append('feMergeNode')
          .attr('in', 'bg'))
        .call((m) => m
          .append('feMergeNode')
          .attr('in', 'SourceGraphic')));

    return this;
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
    const data = this.zones.map((d) => {
      const e = d;
      e.middleAngle = (e.startAngle + e.endAngle) / 2;
      e.point = d3.pointRadial(d.middleAngle + 0.5 * Math.PI, d.outerRadius + 10);
      return e;
    });

    this.svg.append('g')
      .attr('class', 'axis')
      .selectAll('.g-axis-small')
      .data(data)
      .join('g')
      .attr('class', 'g-axis-small')
      .call((g) => g
        .append('text')
        .attr('x', (d) => d.point[0])
        .attr('y', (d) => d.point[1])
        .attr('filter', (d) => {
          const idx = SORTED_PARTIES.findIndex((p) => p === d.party);
          return this.isOpposition.get(d.party) ? `url(#bg-filter-${idx})` : 'none';
        })
        .attr('font-size', '0.8em')
        .style('font-weight', (d) => (this.isOpposition.get(d.party) ? 'bold' : 'normal'))
        .attr('text-anchor', (d) => (d.middleAngle + 0.5 * Math.PI < 0 ? 'end' : 'start'))
        .attr('dominant-baseline', 'middle')
        .attr('fill', (d) => COLOR.get(d.party))
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

            e.name = counts[i].name;
            e.nRequests = counts[i].nRequests;
            e.nRequestsPerDay = counts[i].nRequestsPerDay;

            const n = counts[i].nRequestsPerDay;
            if (n >= 1) e.category = '>=1 per day';
            else if (n * 7 >= 1) e.category = '>=1 per week';
            else if (n * 30 >= 1) e.category = '>=1 per month';
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
        .attr('fill-opacity', 1)
        .on('mousemove', (event, d) => {
          if (d.category === '0') return;

          const category = {
            '>=1 per day': 'durchschnittlich <i>mehr als eine Anfrage am Tag</i>',
            '>=1 per week': 'durchschnittlich <i>mehr als eine Anfrage in der Woche</i>',
            '>=1 per month': 'durchschnittlich <i>mehr als eine Anfrage im Monat</i>',
            '>=1 per year': 'durchschnittlich <i>mehr als eine Anfrage im Jahr</i>',
            '<1 per year': 'durchschnittlich <i>weniger als eine Anfrage im Jahr</i>',
          }[d.category];

          const text = d.nRequests > 1
            ? `<p>hat insgesamt <b>${d.nRequests}</b> Anfragen eingereicht, das sind ${category}</p>`
            : `<p>hat eine Anfrage eingereicht, das ist ${category}</p>`;

          d3.select('.tooltip-seat')
            .style('left', `${event.pageX}px`)
            .style('top', `${event.pageY}px`)
            .style('opacity', 1)
            .style('border-color', COLOR.get(d.party))
            .html([
              `<div class="above-title">${d.party}</div>`,
              `<h4>${d.name}</h4>`,
              text,
            ].join(''));
        })
        .on('mouseleave', () => {
          d3.select('.tooltip-seat')
            .style('opacity', 0);
        }))
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
        .attr('fill', (d) => COLOR.get(d.party))
        .style('pointer-events', 'none'));

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

    this.svg.append('line')
      .attr('x1', -this.width / 2 + 20)
      .attr('y1', 0)
      .attr('x2', this.width / 2 - 20)
      .attr('y2', 0)
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.2);

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
