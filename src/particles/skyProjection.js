// Stereographic projection in the same equatorial frame as the reference sky.
export const radians = Math.PI / 180;
export const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export function equatorial(ra, dec) {
  const c = Math.cos(dec * radians);
  return [c * Math.cos(ra * radians), c * Math.sin(ra * radians), Math.sin(dec * radians)];
}
export function constellationView(con) {
  const center = equatorial(...con.c);
  let extent = 0;
  for (const line of con.l) for (let i = 0; i < line.length; i += 2) {
    extent = Math.max(extent, Math.acos(Math.max(-1, Math.min(1, dot(center, equatorial(line[i], line[i + 1]))))) / radians);
  }
  return { center, fov: Math.max(26, Math.min(82, extent * 2 * 2.7)) };
}
export function projectSky(ra, dec, view, aspect = 1.6) {
  const v = equatorial(ra, dec), c = view.center;
  const d = dot(v, c);
  if (d < 0) return null;
  const length = Math.hypot(c[0], c[1]) || 1;
  const east = [-c[1] / length, c[0] / length, 0];
  const north = [-c[2] * east[1], c[2] * east[0], c[0] * east[1] - c[1] * east[0]];
  const scale = 1.2 / (aspect * 2 * Math.tan(view.fov * radians / 4));
  return [-.072 - 2 / (1 + d) * dot(v, east) * scale, 2 / (1 + d) * dot(v, north) * scale];
}
