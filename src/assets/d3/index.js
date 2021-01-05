import { csv } from 'd3-fetch';

import { select } from 'd3-selection';

import {
  group,
  groups,
  rollup,
  rollups,
  range,
  sum,
  descending,
  ascending,
  difference,
} from 'd3-array';

import {
  scaleLinear,
  scaleBand,
  scaleOrdinal,
  scalePoint,
} from 'd3-scale';

import { schemePaired } from 'd3-scale-chromatic';

import { pointRadial, arc } from 'd3-shape';

import { timeDay, timeMonth, timeMonths } from 'd3-time';

import { timeParse, timeFormat } from 'd3-time-format';

import { format } from 'd3-format';

export default {
  csv,

  select,

  group,
  groups,
  rollup,
  rollups,
  range,
  sum,
  descending,
  ascending,
  difference,

  scaleLinear,
  scaleBand,
  scaleOrdinal,
  scalePoint,

  schemePaired,

  pointRadial,
  arc,

  timeDay,
  timeMonth,
  timeMonths,

  timeParse,
  timeFormat,

  format,
};
