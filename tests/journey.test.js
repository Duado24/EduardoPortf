import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyNodes } from '../src/data/portfolio.js';
import { journeyConnections, journeyStarPositions, mobileJourneyStarPositions } from '../src/data/journeyLayout.js';

test('every Journey milestone has distinct content and a visible constellation anchor', () => {
  const ids = journeyNodes.map(({ id }) => id);

  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(Object.keys(journeyStarPositions).sort(), [...ids].sort());
  assert.deepEqual(Object.keys(mobileJourneyStarPositions).sort(), [...ids].sort());
  for (const milestone of journeyNodes) {
    assert.ok(milestone.title);
    assert.ok(milestone.organization);
    assert.ok(milestone.description);
    assert.ok(milestone.label);
  }
});

test('constellation connections refer to real milestones and remain inside the scene', () => {
  const ids = new Set(journeyNodes.map(({ id }) => id));

  for (const [from, to] of journeyConnections) {
    assert.ok(ids.has(from));
    assert.ok(ids.has(to));
    assert.notEqual(from, to);
  }
  for (const positions of [journeyStarPositions, mobileJourneyStarPositions]) {
    for (const { x, y } of Object.values(positions)) {
      assert.ok(x > 0 && x < 100);
      assert.ok(y > 0 && y < 100);
    }
  }
});

test('unknown volunteer dates and in-progress work are represented accurately', () => {
  const volunteer = journeyNodes.find(({ id }) => id === 'volunteer');
  const cyberforce = journeyNodes.find(({ id }) => id === 'cyberforce-preparation');

  assert.match(volunteer.date, /undated/i);
  assert.match(cyberforce.date, /2026.*in progress/i);
});
