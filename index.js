/** @typedef {{ x: number, y: number, arcDist: string }} SeatCoords */
/** @typedef {{ label: string; seats: SeatCoords[] }} GroupSeats */

/**
 * @param {number} scale
 * @param {{ label: string, numSeats: number }[]} groups
 * @returns {{ groups: GroupSeats[], radius: number }}
 */
export default function createChart(scale, groups) {
  const totalSeats = groups.reduce((sum, group) => sum + group.numSeats, 0);

  let circleRadius =
    scale / Math.sqrt(totalSeats, 2) - (scale * 1.25) / totalSeats + 1 / scale;

  let padding = circleRadius / 5;

  const seatCoords = createSeatCoords(totalSeats, circleRadius, padding);
  const orderedSeats = seatCoords.sort((a, b) => a.arcDist - b.arcDist);

  const groupSeats = [];
  let seatsCounted = 0;

  groups.forEach((group) => {
    groupSeats.push({
      label: group.label,
      seats: orderedSeats.slice(seatsCounted, seatsCounted + group.numSeats),
    });

    seatsCounted += group.numSeats;
  });

  return { groups: groupSeats, radius: circleRadius };
}

/**
 * @param {number} totalSeats
 * @param {number} circleRadius
 * @param {number} padding
 * @returns {number[]}
 */
function createSeatCoords(totalSeats, circleRadius, padding) {
  const radii = [];
  const seatsInRows = [];

  // TODO: surely this is deterministic?
  while (sumArray(seatsInRows) < totalSeats) {
    radii.push(
      circleRadius * 2 * (radii.length + 4) + padding * 2.5 * radii.length,
    );

    const rowNumSeats = Math.ceil(
      (Math.PI * radii[seatsInRows.length]) / (circleRadius * 2.5),
    );

    seatsInRows.push(rowNumSeats);
  }

  const negateArray = createNegateArray(seatsInRows, totalSeats);

  for (let i = 0; i < seatsInRows.length; i++) {
    seatsInRows[i] -= negateArray[i];
  }

  /** @type {SeatCoords[]} */
  const seatCoords = [];

  for (let i = 0; i < seatsInRows.length; i++) {
    for (let j = 0; j < seatsInRows[i]; j++) {
      const seatPosFraction = j / (seatsInRows[i] - 1);
      const hypot = Math.PI * seatPosFraction;

      const x = Math.cos(hypot) * radii[i];
      const y = -Math.sin(hypot) * radii[i];

      const twoPiRSquared = 2 * Math.PI * Math.pow(radii[i], 2);
      const arcDist = Math.acos(
        1 - (Math.pow(-radii[i] - x, 2) + Math.pow(-y, 2)) / twoPiRSquared,
      );

      seatCoords.push({ x, y, arcDist });
    }
  }

  return seatCoords;
}

function createNegateArray(seatsInRows, targetTotalSeats) {
  const ringUnitFractionArray = seatsInRows.map(
    (numSeats) => numSeats / seatsInRows[seatsInRows.length - 1],
  );

  const surplusDots = sumArray(seatsInRows) - targetTotalSeats;
  const surplusDotsFraction = surplusDots / sumArray(ringUnitFractionArray);

  const negateArray = ringUnitFractionArray.map((fraction) =>
    Math.floor(fraction * surplusDotsFraction),
  );

  const negateArraySum = sumArray(negateArray);

  if (negateArraySum < surplusDots) {
    for (let i = 0; i < surplusDots - negateArraySum; i++) {
      negateArray[i] += 1;
    }
  }

  return negateArray;
}

function sumArray(array) {
  return array.reduce((a, b) => a + b, 0);
}

