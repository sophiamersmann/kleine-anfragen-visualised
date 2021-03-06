import d3 from '@/assets/d3';

import { SORTED_PARTIES, COLOR, LIGHT_COLOR } from '@/core/CONSTANTS';
import { computeSeatPositions } from '@/core/utils';

import color from '@/assets/style/_global.scss';

export default class SeatChart {
  constructor(selector, labelPositions) {
    this.selector = selector;

    // data
    this.requestsPerHead = null;
    this.seatsPartition = null;
    this.nSeats = null;

    // options
    this.svg = null;
    this.width = null;
    this.height = null;
    this.marginTop = 20;
    this.config = {
      spacing: 1,
      seatRadius: null,
      innerRadius: null,
      fontSize: null,
    };
    this.labelPositions = labelPositions;

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

    if (this.labelPositions === undefined) {
      this.labelPositions = Array.from(this.requestsPerHeadMap.keys())
        .map((party) => ({ party, row: 0 }));
    }

    return this;
  }

  draw(config) {
    this.config.innerRadius = config.innerRadius;
    this.config.seatRadius = config.seatRadius;
    this.config.fontSize = config.fontSize;

    return this
      .reset()
      .setUpScales()
      .prepareData()
      .setUpSVG()
      .drawAxis()
      .drawData();
  }

  reset() {
    if (this.svg) d3.select(`${this.selector} svg`).remove();
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

    const nRows = d3.max(this.circles, (d) => d.row);
    this.height = this.config.innerRadius + this.marginTop
      + nRows * (2 * this.config.seatRadius + 2 * this.config.spacing);
    this.width = this.height * 2;

    return this;
  }

  drawAxis() {
    const parties = this.labelPositions.map((d) => d.party);
    const row = new Map(this.labelPositions.map((d) => [d.party, d.row]));
    const data = this.zones
      .filter((d) => parties.includes(d.party))
      .map((d, i) => {
        const e = d;
        e.labelStartAngle = i === 0 ? -Math.PI + 0.01 : d.startAngle;
        e.labelRadius = d.outerRadius + 5 + row.get(d.party) * 12;
        return e;
      });

    this.svg.append('g')
      .attr('class', 'axis')
      .selectAll('g')
      .data(data)
      .join('g')
      .call((g) => g
        .append('line')
        .attr('transform', 'rotate(90)')
        .attr('x1', (d) => d3.pointRadial(d.labelStartAngle - 0.01, d.outerRadius)[0])
        .attr('y1', (d) => d3.pointRadial(d.labelStartAngle - 0.01, d.outerRadius)[1])
        .attr('x2', (d) => d3.pointRadial(d.labelStartAngle - 0.01, d.labelRadius + 8)[0])
        .attr('y2', (d) => d3.pointRadial(d.labelStartAngle - 0.01, d.labelRadius + 8)[1])
        .attr('stroke', color.gray300))
      .call((g) => g
        .append('path')
        .attr('id', (_, i) => `${this.selector}--x-tick--text-path-${i}`)
        .attr('stroke', 'none')
        .attr('fill', 'none')
        .attr('transform', 'rotate(90)')
        .attr('d', (d) => {
          const r = d.labelRadius;
          return [
            `M${d3.pointRadial(d.labelStartAngle, r)}`,
            `A${r},${r} 0,0,1 ${d3.pointRadial(0, r)}`,
          ].join(' ');
        }))
      .call((g) => g
        .append('text')
        .attr('font-size', this.config.fontSize)
        .append('textPath')
        .attr('xlink:href', (_, i) => `#${this.selector}--x-tick--text-path-${i}`)
        .style('font-weight', (d) => (this.isOpposition.get(d.party) ? 'bold' : 'normal'))
        .text((d) => d.party));

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
            e.data = counts[i];

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
            ? color.gray100 : LIGHT_COLOR.get(d.party)))
        .attr('fill-opacity', 1)
        .on('mousemove', (event, d) => {
          if (d.category === '0') return;

          const nRequestsPerMonth = Math.round(d.data.nRequestsPerMonth);
          let line1 = d.data.nRequests > 1
            ? `<p>war insgesamt an <b>${d.data.nRequests}</b> Anfragen beteiligt`
            : '<p>war an einer Anfrage beteiligt';
          if (nRequestsPerMonth > 1) {
            line1 += `, das sind ungefähr ${nRequestsPerMonth} im Monat`;
          } else if (nRequestsPerMonth === 1) {
            line1 += ', das ist ungefähr eine im Monat';
          }
          line1 += '</p>';

          let line2 = '';
          if (d.data.topMinistry) {
            if (d.data.nRequests > 10) {
              const f = d3.format('.0%');
              const topMinistryPercentage = d.data.topMinistryCount / d.data.nRequests;
              line2 = `<p><i>Am häufigsten angefragt:</i> ${d.data.topMinistry} (${f(topMinistryPercentage)} aller Anfragen)</p>`;
            } else if (d.data.nRequests > 1) {
              line2 = `<p><i>Am häufigsten angefragt:</i> ${d.data.topMinistry} (${d.data.topMinistryCount} von ${d.data.nRequests} Anfragen)</p>`;
            } else if (d.data.nRequests === 1) {
              line2 = `<p><i>Angefragt:</i> ${d.data.topMinistry}</p>`;
            }
          }

          const left = Math.min(window.innerWidth - 300, event.pageX);
          d3.select('.tooltip-seat')
            .style('left', `${left}px`)
            .style('top', `${event.pageY}px`)
            .style('opacity', 1)
            .style('border-color', COLOR.get(d.party))
            .html([
              `<div class="above-title">${d.party}</div>`,
              `<h4>${d.data.name}</h4>`,
              line1,
              line2,
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
      .attr('stroke', color.gray300);

    return this;
  }
}
