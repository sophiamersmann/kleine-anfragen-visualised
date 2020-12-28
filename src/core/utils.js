import d3 from '@/assets/d3';

export function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function displayTimeRange(dates, hasEnded) {
  const formatTime = d3.timeFormat('%Y');
  const years = Object.values(dates).map(formatTime);
  return hasEnded ? years.join('-') : `ab ${years[0]}`;
}

export function getTermId(body, term) {
  return `${normalize(body)}-${term}`;
}
