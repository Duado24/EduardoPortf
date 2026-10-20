import { SKY_STARS as STARS, CONS } from '../data/astronomyCatalog.js';
import { constellationView, projectSky } from './skyProjection.js';

// Stable catalog identities; offscreen points stay finite for morph snapshots.
export function createJourneyTarget(count, code = 'Cru') {
  const positions = new Float32Array(count * 3);
  const style = new Float32Array(count * 2);
  const view = constellationView(CONS[code]);
  for (let i = 0; i < count; i++) {
    const j = i % (STARS.length / 4);
    const point = projectSky(STARS[j * 4], STARS[j * 4 + 1], view);
    positions.set(point ? [Math.max(-4, Math.min(4, point[0])), Math.max(-4, Math.min(4, point[1])), 0] : [4, 4, 0], i * 3);
    style[i * 2] = point && i < STARS.length / 4 ? Math.max(.35, Math.min(1, 1.22 - STARS[j * 4 + 2] * .15)) : 0;
  }
  return { positions, style };
}
