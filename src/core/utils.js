/* eslint-disable no-shadow */
/* eslint-disable no-nested-ternary */
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

export function computeSeatPositions(seatsPartition, nSeats, config) {
  // Code from https://observablehq.com/@yu-emilie/european-parliament-elections-of-2014/2
  const seats = [];

  // 1 Compute seats positions
  // 1.1 Compute position and size of the rows
  const rows = [];
  const n = nSeats;
  let toBePlaced = n;
  let rowR = config.innerRadius;
  while (toBePlaced > 0) {
    // Compute nb of seats on one row
    const nbR = Math.floor((rowR * Math.PI) / (2 * config.seatRadius + config.spacing));
    const row = {
      radius: rowR,
      nb: nbR,
    };
    rows.push(row);
    toBePlaced -= nbR;
    rowR += (config.seatRadius + config.spacing) * 2;
  }

  // 1.2 Place all seats on the rows
  let seatsPlaced = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];

    let j = 0;
    let seatsPlacedOnRow = 0;
    const dtheta = Math.PI / Math.min(row.nb, n - seatsPlaced);
    while (seatsPlacedOnRow < Math.min(row.nb, n - seatsPlaced)) {
      const theta = -Math.PI + dtheta * (j + 0.5);
      const seat = {
        row: i,
        x: Math.cos(theta) * row.radius,
        y: Math.sin(theta) * row.radius,
        r: config.seatRadius,
        theta,
      };
      seats.push(seat);
      j += 1;
      seatsPlacedOnRow += 1;
    }
    seatsPlaced += seatsPlacedOnRow;
  }

  // 2. Assign the right color to each seat and determine "party zones" (for hover function)
  const zones = [];
  const outerRadius = rows[rows.length - 1].radius + config.seatRadius + config.spacing;
  // 2.1 Sort the list of seats by angle theta
  // eslint-disable-next-line no-confusing-arrow
  seats.sort((a, b) => (a.theta > b.theta) ? 1 : ((b.theta > a.theta) ? -1 : 0));

  // 2.2 Assign party id
  let seatsColored = 0;
  seatsPartition.forEach((party) => {
    if (party.id === 'turnout') return;
    const startAngle = seats[seatsColored].theta;
    const nbSeats = +party.seats;
    const partyName = party.id;
    for (let i = seatsColored; i < Math.min(n, seatsColored + nbSeats); i += 1) {
      seats[i].party = partyName;
    }
    const endAngle = seats[Math.min(n, seatsColored + nbSeats) - 1].theta;
    zones.push({
      party: partyName,
      nbSeats,
      startAngle,
      endAngle,
      outerRadius,
      innerRadius: config.innerRadius,
      selected: false,
    });
    seatsColored += nbSeats;
  });

  return { seats, zones };
}
