import { stack } from 'd3-shape';
import { scaleLinear } from 'd3-scale';

export default function drawHorizentalBar(svg, data, cfg, colorMap) {
  const series = stack()
    .keys(Object.keys(data))([data])
    .map((d) => ({
      name: d.key,
      x0: d[0][0],
      x1: d[0][1],
    }));

  const x = scaleLinear()
    .range([cfg.margin.left, cfg.width - cfg.margin.right]);

  svg.append('g')
    .attr('class', 'bar-chart')
    .selectAll('rect')
    .data(series)
    .join('rect')
    .attr('x', (d) => x(d.x0))
    .attr('y', cfg.y)
    .attr('width', (d) => x(d.x1) - x(d.x0))
    .attr('height', cfg.height)
    .attr('fill', (d) => (colorMap.has(d.name) ? colorMap.get(d.name) : 'lightgray'));
}
