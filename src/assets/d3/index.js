import { csv } from 'd3-fetch';

import { select, selectAll } from 'd3-selection';

import {
  group,
  groups,
  rollup,
  rollups,
  range,
  sum,
  max,
  descending,
  ascending,
  difference,
} from 'd3-array';

import {
  scaleLinear,
  scaleBand,
  scaleOrdinal,
  scalePoint,
  scaleSqrt,
} from 'd3-scale';

import { schemePaired } from 'd3-scale-chromatic';

import { pointRadial, arc } from 'd3-shape';

import { timeDay, timeMonth, timeMonths } from 'd3-time';

import { timeParse, timeFormat } from 'd3-time-format';

import { format } from 'd3-format';

import { forceSimulation, forceX, forceY } from 'd3-force';

import { quadtree } from 'd3-quadtree';

import { transition } from 'd3-transition';

export default {
  csv,

  select,
  selectAll,

  group,
  groups,
  rollup,
  rollups,
  range,
  sum,
  max,
  descending,
  ascending,
  difference,

  scaleLinear,
  scaleBand,
  scaleOrdinal,
  scalePoint,
  scaleSqrt,

  schemePaired,

  pointRadial,
  arc,

  timeDay,
  timeMonth,
  timeMonths,

  timeParse,
  timeFormat,

  format,

  forceSimulation,
  forceX,
  forceY,

  quadtree,

  transition,
};
