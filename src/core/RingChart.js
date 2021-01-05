import d3 from '@/assets/d3';

export default class RingChart {
  constructor(selector) {
    this.selector = selector;

    // data
    this.requests = null;
    this.dates = null;
    this.months = null;
    this.parties = null;

    // options
    this.svg = null;
    this.width = 600; // TODO: fixed for now
    this.height = 600;
    this.margin = 40;
    this.config = {
      innerRadius: null,
      outerRadius: null,
      circleRadius: 12, // TODO: fixed for now
      unit: 10,
    };

    // scales
    this.scales = {
      x: null,
      y: null,
    };

    // formats
    this.formats = {
      internalFormat: d3.timeFormat('%Y-%m'),
      shortFormat: d3.timeFormat('%b'),
      longFormat: d3.timeFormat('%b %Y'),
    };
  }

  data(requests, dates) {
    this.requests = requests;

    this.dates = dates;
    this.months = d3.timeMonths(dates.start, dates.end);
    this.monthKeys = this.months.map(this.formats.internalFormat);

    this.parties = d3
      .rollups(this.requests.flatMap((d) => d.parties), (v) => v.length, (d) => d)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => d3.descending(a.count, b.count))
      .map(({ party }) => party);

    const outerRadius = this.width / 2 - this.margin;
    const innerRadius = outerRadius - 2 * this.config.circleRadius * this.parties.length;

    this.config.innerRadius = innerRadius;
    this.config.outerRadius = outerRadius;

    return this;
  }

  draw() {
    return this
      .setUpSVG()
      .setUpScales()
      .drawAxes();
  }

  setUpSVG() {
    this.svg = d3.select(this.selector)
      .append('svg')
      .attr('viewBox', [
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height])
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');

    this.svg.append('rect')
      .attr('x', -this.width / 2)
      .attr('y', -this.height / 2)
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'steelblue')
      .attr('fill-opacity', 0.1);

    return this;
  }

  setUpScales() {
    const { innerRadius, outerRadius } = this.config;

    const lastMonth = this.months[this.months - 1];
    const months = [...this.months, d3.timeMonth.offset(lastMonth, 1)];

    this.scales.x = d3.scalePoint()
      .domain(months.map(this.formats.internalFormat))
      .range([0, 2 * Math.PI]);

    this.scales.y = d3.scaleBand()
      .domain(this.parties)
      .range([innerRadius, outerRadius]);

    return this;
  }

  drawAxes() {
    const { x, y } = this.scales;
    const { innerRadius, outerRadius, unit } = this.config;
    const { internalFormat, shortFormat, longFormat } = this.formats;

    // const color = d3.scaleOrdinal()
    //   .domain(this.parties)
    //   .range(d3.schemePaired.filter((_, i) => i % 2 === 1));

    const lightColor = d3.scaleOrdinal()
      .domain(this.parties)
      .range(d3.schemePaired.filter((_, i) => i % 2 === 0));

    const xGrid = (grid) => grid
      .attr('fill', 'transparent')
      .call((g) => g.selectAll('circle')
        .data(this.parties)
        .join('circle')
        .attr('r', (party) => y(party))
        .attr('stroke', (party) => lightColor(party)));

    const xAxis = (grid) => grid
      .call((g) => g.selectAll('g')
        .data(this.months.slice(0, -1).map((date, i) => ({
          date,
          x: this.formats.internalFormat(date),
          isOrigin: i === 0,
          isVisible: i === 0 || date.getMonth() % 6 === 0,
          isMajor: date.getMonth() === 0,
          offset: date.getMonth() === 0 ? 2 * unit : unit,
        })))
        .join('g')
        .attr('font-size', 11)
        .call((tick) => tick
          .append('path')
          .attr('class', (d) => [
            'x-tick--line',
            `x-tick--line-${d.isMajor ? 'major' : 'minor'}`,
            `x-tick--line-${d.x}`,
          ].join(' '))
          .classed('x-tick--line-origin', (d) => d.isOrigin)
          .attr('stroke', '#000')
          .attr('stroke-opacity', 0.2)
          .attr('stroke-dasharray', '2 4')
          .attr('opacity', (d) => +d.isVisible)
          .attr('d', (d, i) => [
            `M${d3.pointRadial(x(d.x), outerRadius + d.offset + (i === 0 ? 2 * unit : 0))}`,
            `L${d3.pointRadial(x(d.x), innerRadius - 2 * unit)}`,
          ].join(' ')))
        .call((tick) => tick
          .append('path')
          .attr('id', (_, i) => `x-tick--text-path-${i}`)
          .attr('stroke', 'none')
          .attr('fill', 'none')
          .attr('d', (d) => {
            const r = outerRadius + d.offset - unit;
            const endDate = this.mapRadialDate(d3.timeMonth.offset(d.date, 2));
            return [
              `M${d3.pointRadial(x(d.x), r)}`,
              `A${r},${r} 0,0,1 ${d3.pointRadial(x(internalFormat(endDate)), r)}`,
            ].join(' ');
          }))
        .call((tick) => tick
          .append('text')
          .attr('class', (d) => [
            'x-tick--label',
            `x-tick--label-${d.isMajor ? 'major' : 'minor'}`,
            `x-tick--label-${d.x}`,
          ].join(' '))
          .attr('opacity', (d) => +(d.isVisible && !d.isOrigin))
          .append('textPath')
          .attr('startOffset', 5)
          .attr('xlink:href', (_, i) => `#x-tick--text-path-${i}`)
          .text((d) => (d.isMajor ? longFormat(d.date) : shortFormat(d.date))))
        .call((tick) => tick
          .append('path')
          .attr('class', (d) => [
            'x-tick--arc',
            `x-tick--arc-${d.x}`,
          ].join(' '))
          .attr('fill', 'transparent')
          .attr('stroke', '#000')
          .attr('stroke-opacity', 0.2)
          .attr('stroke-dasharray', '2 4')
          .attr('opacity', 0)
          .attr('d', (d) => {
            const startDate = this.mapRadialDate(d3.timeMonth.offset(d.date, -8));
            const endDate = this.mapRadialDate(d3.timeMonth.offset(d.date, 8), false);
            const r = innerRadius - 2 * unit;
            return [
              `M${d3.pointRadial(x(internalFormat(startDate)), r)}`,
              `A${r},${r} 0,0,1 ${d3.pointRadial(x(internalFormat(endDate)), r)}`,
            ].join(' ');
          })));

    this.svg.append('g')
      .attr('class', 'grid grid-x')
      .call(xGrid);

    this.svg.append('g')
      .attr('class', 'axis axis-x')
      .call(xAxis);

    return this;
  }

  mapRadialDate(date, forward = true) {
    if (this.monthKeys.includes(this.formats.internalFormat(date))) return date;

    if (forward) {
      const offset = d3.timeMonth.count(date, this.months[0]);
      return this.months[this.months.length - offset];
    }

    const offset = d3.timeMonth.count(this.months[this.months.length - 1], date);
    return this.months[offset - 1];
  }
}
