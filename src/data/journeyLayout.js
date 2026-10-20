export const journeyStarPositions = {
  'lima-education': { x: 29, y: 48, labelSide: 'right' },
  'net-axes': { x: 42, y: 31, labelSide: 'left' },
  'ensign-education': { x: 54, y: 49, labelSide: 'right' },
  'ensign-work': { x: 66, y: 32, labelSide: 'left' },
  volunteer: { x: 80, y: 45, labelSide: 'left' },
  'cyberforce-preparation': { x: 72, y: 60, labelSide: 'right' },
};

export const mobileJourneyStarPositions = {
  'lima-education': { x: 20, y: 24, labelSide: 'right' },
  'net-axes': { x: 49, y: 41, labelSide: 'left' },
  'ensign-education': { x: 27, y: 56, labelSide: 'right' },
  'ensign-work': { x: 69, y: 25, labelSide: 'left' },
  volunteer: { x: 80, y: 62, labelSide: 'left' },
  'cyberforce-preparation': { x: 58, y: 79, labelSide: 'right' },
};

export const journeyConnections = [
  ['lima-education', 'net-axes'],
  ['net-axes', 'ensign-education'],
  ['ensign-education', 'ensign-work'],
  ['ensign-work', 'volunteer'],
  ['ensign-work', 'cyberforce-preparation'],
];
