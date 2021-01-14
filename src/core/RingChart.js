import d3 from '@/assets/d3';

import { COLOR, LIGHT_COLOR } from '@/core/CONSTANTS';
import forceClusterCollision from '@/core/forceClusterCollision';

export default class RingChart {
  constructor(selector, size, data) {
    this.selector = selector;

    // formats
    this.formats = {
      internalFormat: d3.timeFormat('%Y-%m'),
      shortFormat: d3.timeFormat('%b'),
      longFormat: d3.timeFormat('%b %Y'),
    };

    // data
    this.dates = data.dates;
    this.parties = data.parties;
    this.maxValue = data.maxValue;

    this.requests = null;
    this.bins = null;

    this.months = d3.timeMonths(this.dates.start, this.dates.end);
    this.monthKeys = this.months.map(this.formats.internalFormat);

    // options
    this.svg = null;
    this.width = size;
    this.height = size;
    this.margin = 20;
    this.config = {
      innerRadius: null,
      outerRadius: null,
      circleRadius: 10,
      questionsRadius: 6,
      questionSize: '0.9em',
      unit: 10,
    };

    this.config.outerRadius = this.width / 2 - 2 * this.margin;
    this.config.innerRadius = Math.max(
      this.config.outerRadius - 2 * this.config.circleRadius * this.parties.length,
      200,
    );

    const trunc = (x) => Math.trunc(x * 100) / 100;
    const cf = 2 * Math.PI * this.config.innerRadius;
    this.config.circleRadius = Math.min(
      trunc(cf / this.months.length / 2),
      trunc(this.config.outerRadius - this.config.innerRadius) / (2 * this.parties.length),
    );

    // scales
    this.scales = {
      x: null,
      y: null,
    };
  }

  drawSkeleton() {
    return this
      .setUpSVG()
      .setUpScales()
      .drawAxes()
      .drawInfo()
      .drawLegend()
      .setUpGrid();
  }

  drawLegend() {
    const offset = 30;
    const n = this.maxValue;
    const labels = [1, 0.2 * n, 0.4 * n, 0.6 * n, 0.8 * n, this.maxValue]
      .map((d, i) => ({
        value: d,
        dx: i * 1.25 * this.config.circleRadius,
        label: i === 0 ? `Wenige [${d}]` : `Viele Anfragen [${d}]`,
      }));

    const legend = this.svg.append('g')
      .attr('class', 'legend');

    legend.selectAll('.g-label')
      .data([labels[0], labels[labels.length - 1]])
      .join('g')
      .attr('class', 'g-label')
      .attr('transform', (d) => `translate(${d.dx}, 0)`)
      .call((g) => g
        .append('line')
        .attr('x1', -this.width / 2 + offset)
        .attr('y1', this.height / 2 - offset)
        .attr('x2', -this.width / 2 + offset)
        .attr('y2', this.height / 2 - offset - 25)
        .attr('stroke', 'black'))
      .call((g) => g
        .append('text')
        .attr('x', -this.width / 2 + offset + 2)
        .attr('y', this.height / 2 - offset - 25)
        .attr('dominant-baseline', 'hanging')
        .style('font-size', '0.7em')
        .text((d) => d.label));

    legend.selectAll('.g-marker')
      .data(labels)
      .join('g')
      .attr('class', 'g-marker')
      .attr('transform', (d) => `translate(${d.dx}, 0)`)
      .call((g) => g
        .append('circle')
        .attr('cx', -this.width / 2 + offset)
        .attr('cy', this.height / 2 - offset)
        .attr('r', this.config.circleRadius)
        .attr('fill', 'lightgray'))
      .call((g) => g
        .append('circle')
        .attr('cx', -this.width / 2 + offset)
        .attr('cy', this.height / 2 - offset)
        .attr('r', (d) => this.scales.c(d.value))
        .attr('fill', 'gray'));

    return this;
  }

  updateMinistry(requests) {
    this.requests = requests;

    this.resetInteractions();

    return this
      .prepareData()
      .drawData();
  }

  prepareData() {
    const { internalFormat } = this.formats;

    const outliers = this.requests
      .filter((d) => d.date < this.dates.start || d.date > this.dates.end);
    if (outliers.length) {
      console.warn('Requests outside of election period', `[${outliers.length}]`, outliers);
    }

    const groupedRequests = d3.group(this.requests, (d) => internalFormat(d.date));
    this.bins = new Map(this.monthKeys.map((month) => {
      if (!groupedRequests.has(month)) {
        return [month, this.parties.map((party) => ({ party, count: 0 }))];
      }

      const requests = groupedRequests.get(month);
      const parties = requests.flatMap((d) => d.parties);
      const count = d3.rollup(parties, (v) => v.length, (d) => d);
      const values = this.parties
        .map((party) => ({ party, count: count.has(party) ? count.get(party) : 0 }));

      return [month, values];
    }));

    return this;
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
      .on('click', () => this.resetInteractions())
      .on('mouseleave', () => this.resetInteractions());

    // this.svg.append('rect')
    //   .attr('x', -this.width / 2)
    //   .attr('y', -this.height / 2)
    //   .attr('width', this.width)
    //   .attr('height', this.height)
    //   .attr('fill', 'steelblue')
    //   .attr('fill-opacity', 0.1);

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

    this.scales.c = d3.scaleSqrt()
      .domain([1, this.maxValue])
      .range([1, this.config.circleRadius]);

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
        .attr('stroke', (party) => LIGHT_COLOR.get(party)));

    const xAxis = (grid) => grid
      .call((g) => g.selectAll('g')
        .data(this.months.map((date, i) => ({
          date,
          x: this.formats.internalFormat(date),
          isOrigin: i === 0,
          isVisible: i === 0 || date.getMonth() % 6 === 0,
          isMajor: i === 0 || date.getMonth() === 0,
          offset: date.getMonth() === 0 || i === 0 ? 3 * unit : unit,
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
          .attr('stroke-dasharray', (d) => (d.isOrigin ? 'none' : '2 4'))
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
          .classed('x-tick--label-visible', (d) => d.isVisible) // && !d.isOrigin
          .attr('opacity', (d) => d.isVisible) // +( && !d.isOrigin)
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
      .attr('class', 'axis axis-x')
      .call(xAxis);

    this.svg.append('g')
      .attr('class', 'grid grid-x')
      .call(xGrid);

    return this;
  }

  drawInfo() {
    this.svg.append('g')
      .attr('class', 'info')
      .append('text')
      .attr('class', 'text-info')
      .attr('x', this.width / 2 - 50)
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
    const { questionsRadius, questionSize } = this.config;
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
        d3.select('.tooltip-question')
          .style('left', `${event.pageX}px`)
          .style('top', `${event.pageY}px`)
          .style('opacity', 1)
          .html([
            '<b>', d.data.title, '</b>',
            '<p>', d.data.parties, '</p>',
          ].join(''));
      })
      .on('mouseleave', () => {
        d3.selectAll('.question-mark circle')
          .attr('opacity', 0);

        d3.select('.tooltip-question')
          .style('opacity', 0);
      })
      .on('click', (event) => {
        event.stopPropagation();
      });

    const text = g
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => (d.party === 'mixed' ? 'black' : COLOR.get(d.party)))
      .style('font-size', questionSize)
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

  setUpGrid() {
    this.svg.append('g')
      .attr('class', 'ring')
      .selectAll('g')
      .data(this.monthKeys)
      .join('g')
      .attr('class', (month) => `g-bin g-bin-${month}`);

    return this;
  }

  drawData() {
    const { x, y, c } = this.scales;
    const {
      circleRadius, innerRadius, outerRadius, unit,
    } = this.config;

    const onMouseOver = (_, d) => {
      this.resetInteractions();

      // disable interaction on circles of the same bin
      d3.selectAll(`.circle-outer-${d.month}`)
        .style('pointer-events', 'none');

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

    this.monthKeys.forEach((month) => {
      const bin = this.bins.get(month)
        .map(({ party, count }) => ({
          party,
          count,
          month,
          point: d3.pointRadial(x(month), y(party)),
        }));

      const outer = bin.map((d) => ({ ...d, ...{ isInner: false, r: circleRadius } }));
      const inner = bin.map((d) => ({ ...d, ...{ isInner: true, r: c(d.count) } }));

      this.svg
        .select(`.ring .g-bin-${month}`)
        .selectAll('circle')
        .data(outer.concat(inner), (d) => `${d.party}-${d.isInner}`)
        .join(
          (enter) => enter
            .append('circle')
            .attr('class', (d) => {
              const type = d.isInner ? 'inner' : 'outer';
              return `circle-${type} circle-${type}-${d.month}`;
            })
            .attr('cx', (d) => d.point[0])
            .attr('cy', (d) => d.point[1])
            .attr('r', (d) => (d.count > 0 ? d.r : 0))
            .attr('fill', (d) => (d.isInner ? COLOR : LIGHT_COLOR).get(d.party))
            .style('pointer-events', (d) => (d.isInner ? 'none' : 'unset'))
            .on('mouseover', onMouseOver),
          (update) => update
            .call((u) => u
              .transition()
              .duration(600)
              .attr('r', (d) => (d.count > 0 ? d.r : 0))),
        );
    });

    return this;
  }

  resetInteractions() {
    const { x } = this.scales;
    const { innerRadius, outerRadius, unit } = this.config;

    // enable interactions
    d3.selectAll('.circle-outer')
      .style('pointer-events', 'unset');

    // hide tooltip
    d3.select('.tooltip-question').style('opacity', 0);

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
