import { stack } from 'd3-shape';
import { scaleLinear } from 'd3-scale';

export default function drawHorizentalBar(svg, data, cfg) {
  const series = stack()
    .keys(Object.keys(data))([data])
    .map((d) => ({
      name: d.key,
      x0: d[0][0],
      x1: d[0][1],
    }));

  const x = scaleLinear()
    .range([cfg.margin.left, cfg.width - cfg.margin.right]);

  // To do
  const color = scaleLinear()
    .domain([0, Object.keys(data).length - 1])
    .range(['darkblue', 'white']);

  svg.append('g')
    .attr('class', 'bar-chart')
    .selectAll('rect')
    .data(series)
    .join('rect')
    .attr('x', (d) => x(d.x0))
    .attr('y', cfg.y)
    .attr('width', (d) => x(d.x1) - x(d.x0))
    .attr('height', cfg.height)
    .attr('fill', (_, i) => color(i));

// this.svg.append('g')
//   .attr('class', 'chart-bar')
//   .selectAll('rect')
//   .data(this.data)
//   .join('rect')
//   .attr('x', (_, i) => i * this.bars.width)
//   .attr('width', this.bars.width)
//   .attr('height', this.bars.height)
//   .attr('fill', 'steelblue'); // (d) => this.partyColor(d.inquiringParty)
}
