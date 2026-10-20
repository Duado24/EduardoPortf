// Crux coordinates from the supplied prototype, Hipparcos via d3-celestial.
// Relative gnomonic projection only; the whole scene is an artistic composition.
export const crux = {"n": "Crux", "es": "Cruz del Sur", "c": [186.75, -60.19], "l": [[191.93, -59.69, 183.79, -58.75], [186.65, -63.1, 187.79, -57.11]]};

export function projectEquatorial(ra, dec, centerRa = 186, centerDec = -60) {
  const rad = Math.PI / 180;
  const longitude = (ra - centerRa) * rad;
  const latitude = dec * rad;
  const center = centerDec * rad;
  const depth = Math.sin(center) * Math.sin(latitude) + Math.cos(center) * Math.cos(latitude) * Math.cos(longitude);
  if (depth <= 0) return null;
  return [Math.cos(latitude) * Math.sin(longitude) / depth,
    (Math.cos(center) * Math.sin(latitude) - Math.sin(center) * Math.cos(latitude) * Math.cos(longitude)) / depth];
}

// A sparse dust silhouette, inspired by documented Andean dark constellations.
// This is original artistic geometry, not a historical boundary reconstruction.
export const darkLlama = 'M572 273 585 262 614 266 628 252 635 217 638 204 644 216 651 207 655 222 666 228 659 235 648 232 644 268 641 299 635 300 633 280 625 280 623 303 617 303 616 281 593 279 590 302 584 302 584 278 575 279Z';
