import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyTarget } from '../src/particles/journeyTarget.js';
import { constellationView, projectSky } from '../src/particles/skyProjection.js';
import { journeyNodes } from '../src/data/portfolio.js';
import { journeyConstellations } from '../src/data/journeyConstellations.js';
import { STARS, CONS } from '../src/data/astronomyCatalog.js';

test('six verified milestones map to six real constellations in the requested order', () => {
  assert.deepEqual(journeyConstellations.map(m => m.con), ['Cru', 'Lib', 'Gem', 'Ori', 'Cyg', 'UMa']);
  for (const milestone of journeyConstellations) {
    assert.ok(journeyNodes.find(node => node.id === milestone.id)?.description);
    assert.ok(CONS[milestone.con].l.length);
  }
  assert.equal(STARS.length / 4, 5044);
  assert.equal(Object.keys(CONS).length, 88);
  assert.match(journeyNodes.find(n => n.id === 'volunteer').date, /undated/i);
  assert.match(journeyNodes.find(n => n.id === 'cyberforce-preparation').date, /2026.*in progress/i);
});

test('catalog projection has stable identities, finite hidden points and distinct camera destinations', () => {
  const first = createJourneyTarget(5600);
  assert.deepEqual(first.positions.slice(0, 900 * 3), createJourneyTarget(900).positions);
  for (const { con } of journeyConstellations) {
    const target = createJourneyTarget(5600, con);
    assert.ok(target.positions.every(v => Number.isFinite(v) && Math.abs(v) <= 4));
    assert.ok(target.style.every(v => v >= 0 && v <= 1));
    if (con !== 'Cru') assert.notDeepEqual(first.positions, target.positions);
  }
});

test('Crux retains a 206px north-south extent at the reference viewport', () => {
  const view = constellationView(CONS.Cru);
  const acrux = projectSky(186.65, -63.1, view);
  const gacrux = projectSky(187.79, -57.11, view);
  const height = (gacrux[1] - acrux[1]) * 1440 / 2.4;
  assert.ok(height > 200 && height < 215);
  assert.equal(projectSky(6.75, 60.19, view), null);
});
