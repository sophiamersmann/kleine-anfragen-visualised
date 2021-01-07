import d3 from '@/assets/d3';

import forceClusterCollision from '@/core/forceClusterCollision';

export default class RingChart {
  constructor(selector, size) {
    this.selector = selector;

    // data
    this.requests = null;
    this.dates = null;
    this.months = null;
    this.parties = null;
    this.bins = null;

    // options
    this.svg = null;
    this.width = size;
    this.height = size;
    this.margin = 40;
    this.config = {
      innerRadius: null,
      outerRadius: null,
      circleRadius: 12, // TODO: fixed for now
      questionsRadius: 14,
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

    const outerRadius = this.width / 2 - this.margin + 12; // * Magic value
    const innerRadius = outerRadius - 2 * this.config.circleRadius * this.parties.length;

    this.config.innerRadius = innerRadius;
    this.config.outerRadius = outerRadius;

    // TODO: For now, random colors
    this.color = d3.scaleOrdinal()
      .domain(this.parties)
      .range(d3.schemePaired.filter((_, i) => i % 2 === 1));

    this.lightColor = d3.scaleOrdinal()
      .domain(this.parties)
      .range(d3.schemePaired.filter((_, i) => i % 2 === 0));

    return this;
  }

  prepareData() {
    const { internalFormat } = this.formats;

    const outliers = this.requests
      .filter((d) => d.date < this.dates.start || d.date > this.dates.end);
    if (outliers.length) {
      console.warn('Requests outside of election period', `[${outliers.length}]`, outliers);
    }

    this.bins = d3
      .groups(this.requests, (d) => internalFormat(d.date))
      .map(([month, requests]) => {
        // ! This means some requests will be shown twice
        // ? Connect question marks with a line ?
        const parties = requests.flatMap((d) => d.parties);
        const count = d3.rollup(parties, (v) => v.length, (d) => d);
        const values = [...new Set(parties)]
          .map((party) => ({ party, count: count.has(party) ? count.get(party) : 0 }))
          .sort((a, b) => d3.descending(a.count, b.count) || d3.ascending(
            this.parties.findIndex((p) => p === a.party),
            this.parties.findIndex((p) => p === b.party),
          ));

        return { month, values };
      });

    const max = d3.max(this.bins, (d) => d3.max(d.values, (e) => e.count));
    this.scales.c = d3.scaleSqrt()
      .domain([1, max])
      .range([1, this.config.circleRadius]);

    return this;
  }

  draw() {
    return this
      .setUpSVG()
      .setUpScales()
      .drawAxes()
      .drawInfo()
      .prepareData()
      .drawData();
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
      .attr('stroke-linecap', 'round')
      .on('click', () => this.resetInteractions());

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

    const xGrid = (grid) => grid
      .attr('fill', 'transparent')
      .call((g) => g.selectAll('circle')
        .data(this.parties)
        .join('circle')
        .attr('r', (party) => y(party))
        .attr('stroke', (party) => this.lightColor(party)));

    const xAxis = (grid) => grid
      .call((g) => g.selectAll('g')
        .data(this.months.slice(0, -1).map((date, i) => ({
          date,
          x: this.formats.internalFormat(date),
          isOrigin: i === 0,
          isVisible: i === 0 || date.getMonth() % 6 === 0,
          isMajor: date.getMonth() === 0,
          offset: date.getMonth() === 0 ? 3 * unit : unit,
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
          .classed('x-tick--line-visible', (d) => d.isVisible)
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
          .classed('x-tick--label-visible', (d) => d.isVisible && !d.isOrigin)
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
            const r = innerRadius - 3 * unit;
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

  drawInfo() {
    this.svg.append('g')
      .attr('class', 'info')
      .append('text')
      .attr('class', 'text-info')
      .attr('x', this.width / 2 - 10)
      .attr('y', -this.height / 2 + 10)
      .attr('dominant-baseline', 'hanging')
      .attr('text-anchor', 'end')
      .attr('fill', '#000')
      .style('font-size', '0.8em')
      .style('font-style', 'italic')
      .text('Click anywhere to reset');
    return this;
  }

  drawQuestions(month) {
    const { questionsRadius } = this.config;
    const { internalFormat } = this.formats;
    const n = this.parties.length;

    const requests = [];
    this.requests
      .filter((d) => internalFormat(d.date) === month)
      .forEach((d, i) => d.parties.forEach((party) => {
        const cluster = this.parties.includes(party)
          ? this.parties.findIndex((p) => p === party) : n;
        const focusX = 110 * Math.cos((cluster / n) * Math.PI * 2) + Math.random() * 5;
        const focusY = 110 * Math.sin((cluster / n) * Math.PI * 2) + Math.random() * 5;
        requests.push({
          requestId: i,
          data: d,
          party,
          cluster,
          focusX,
          focusY,
          x: focusX,
          y: focusY,
        });
      }));

    const g = this.svg.append('g')
      .attr('class', 'center center-requests')
      .selectAll('g')
      .data(requests)
      .join('g')
      .attr('class', (d) => `question-mark question-mark--${d.requestId}`);

    const circle = g
      .append('circle')
      .attr('r', questionsRadius)
      .attr('fill', 'lightsteelblue')
      .attr('opacity', 0)
      .on('mousemove', (event, d) => {
        // highlight identical requests
        d3.selectAll(`.question-mark--${d.requestId} circle`)
          .attr('opacity', 1);

        // show tooltip
        d3.select('.tooltip')
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY}px`)
          .style('opacity', 1)
          .html([
            '<b>', d.data.title, '</b>',
          ].join(''));
      })
      .on('mouseleave', () => {
        d3.selectAll('.question-mark circle')
          .attr('opacity', 0);

        d3.select('.tooltip')
          .style('opacity', 0);
      })
      .on('click', (event) => {
        event.stopPropagation();
      });

    const text = g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => (d.party === 'mixed' ? 'black' : this.color(d.party)))
      .style('font-size', '1.9em')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text('?');

    const simulation = d3.forceSimulation()
      .force('collide', forceClusterCollision()
        .radius(questionsRadius + 1)
        .strength(0.8)
        .clusterPadding(10))
      .force('x', d3.forceX().x((d) => d.focusX).strength(0.2))
      .force('y', d3.forceY().y((d) => d.focusY).strength(0.2));

    function ticked() {
      circle
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
      text
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y);
    }

    simulation.nodes(requests).on('tick', ticked);

    return this;
  }

  drawData() {
    const { x, y, c } = this.scales;
    const {
      circleRadius, innerRadius, outerRadius, unit,
    } = this.config;

    const onMouseOver = (_, d) => {
      this.resetInteractions();

      // show info text
      d3.select('.text-info').attr('opacity', 1);

      // make rest of the chart opacque
      d3.selectAll('.grid-x circle').attr('opacity', 0.4);
      d3.selectAll(`.g-bin:not(.g-bin-${d.month}) circle`).attr('fill-opacity', 0.4);

      // show x label and lines
      d3.select(`.x-tick--label-${d.month}`)
        .attr('opacity', 1)
        .style('font-weight', 'bold');
      d3.select(`.x-tick--line-${d.month}`)
        .attr('opacity', 1)
        .attr('d', (e, i) => [
          `M${d3.pointRadial(x(e.x), outerRadius + e.offset + (i.isOrigin ? 2 * unit : 0))}`,
          `L${d3.pointRadial(x(e.x), innerRadius - 3 * unit)}`,
        ].join(' '));
      d3.select(`.x-tick--arc-${d.month}`).attr('opacity', 1);

      this.drawQuestions(d.month);
    };

    const ring = (r) => r
      .call((g) => g
        .selectAll('g')
        .data(this.bins)
        .join('g')
        .attr('class', (d) => `g-bin g-bin-${d.month}`)
        .selectAll('g')
        .data(({ month, values }) => values
          .map(({ party, count }) => ({
            party,
            count,
            month,
            point: d3.pointRadial(x(month), y(party)),
          })))
        .join('g')
        .call((overlayedCircles) => overlayedCircles
          .append('circle')
          .attr('class', 'circle-outer')
          .attr('cx', (d) => d.point[0])
          .attr('cy', (d) => d.point[1])
          .attr('r', (d) => (d.count === 0 ? 0 : circleRadius))
          .attr('fill', (d) => this.lightColor(d.party))
          .on('mouseover', onMouseOver))
        .call((overlayedCircles) => overlayedCircles
          .append('circle')
          .attr('class', 'circle-inner')
          .attr('cx', (d) => d.point[0])
          .attr('cy', (d) => d.point[1])
          .attr('r', (d) => (d.count === 0 ? 0 : c(d.count)))
          .attr('fill', (d) => this.color(d.party))
          .style('pointer-events', 'none')));

    this.svg.append('g')
      .attr('class', 'ring')
      .call(ring);

    return this;
  }

  resetInteractions() {
    const { x } = this.scales;
    const { innerRadius, outerRadius, unit } = this.config;

    // hide tooltip
    d3.select('.tooltip').style('opacity', 0);

    // hide info text
    d3.select('.text-info').attr('opacity', 0);

    // reset the grid and ring
    d3.selectAll('.grid-x circle').attr('opacity', 1);
    d3.selectAll('.g-bin circle').attr('fill-opacity', 1);

    // reset tick labels
    d3.selectAll('.x-tick--label').style('font-weight', 'normal');
    d3.selectAll('.x-tick--label-minor').attr('opacity', 0);
    d3.selectAll('.x-tick--label-visible').attr('opacity', 1);

    // reset tick lines
    d3.selectAll('.x-tick--line')
      .attr('d', (e, i) => [
        `M${d3.pointRadial(x(e.x), outerRadius + e.offset + (i.isOrigin ? 2 * unit : 0))}`,
        `L${d3.pointRadial(x(e.x), innerRadius - 2 * unit)}`,
      ].join(' '));
    d3.selectAll('.x-tick--line-minor').attr('opacity', 0);
    d3.selectAll('.x-tick--line-visible').attr('opacity', 1);

    // hide arcs
    d3.selectAll('.x-tick--arc').attr('opacity', 0);

    // hide requests
    d3.select('.center-requests').remove();
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
