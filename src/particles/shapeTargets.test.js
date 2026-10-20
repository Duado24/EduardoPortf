import test from 'node:test'
import assert from 'node:assert/strict'
import balloonSamples from './balloon-samples.json' with { type: 'json' }
import {
  createShapeTargets,
  geographicPosition,
  insideAboutShape,
  smoothProgress,
  snapshotMorph,
  snapshotStyle,
  VISUAL_STATES,
  visualState,
} from './shapeTargets.js'

test('deterministic targets keep every globe point on the sphere and every profile point in its silhouette', () => {
  const first = createShapeTargets(5600)
  const second = createShapeTargets(1800)
  assert.deepEqual(first.home.positions.slice(0, 1800 * 3), second.home.positions)
  assert.deepEqual(first.about.positions.slice(0, 1800 * 3), second.about.positions)
  let peruCount = 0
  for (let i = 0; i < first.home.positions.length; i += 3) {
    assert.ok(Math.abs(Math.hypot(...first.home.positions.subarray(i, i + 3)) - 1) < 0.000001)
    assert.ok(insideAboutShape(first.about.positions[i], first.about.positions[i + 1]))
    if (first.home.style[i / 3 * 2 + 1] === 1) peruCount++
  }
  assert.equal(peruCount, 44)
  const lima = geographicPosition(-77.0428, -12.0464)
  assert.ok(lima[2] > 0.9, 'The initial globe view faces Peru.')
})

test('the profile keeps facial negative space and fills an extent comparable to the globe', () => {
  assert.ok(insideAboutShape(0.8, 0.22), 'The nose tip is present.')
  assert.ok(!insideAboutShape(0.8, 0.4), 'The foreground above the nose remains empty.')
  assert.ok(!insideAboutShape(0.75, 0.1), 'The space below the nose separates it from the lips.')
  assert.ok(insideAboutShape(0.1, -0.5), 'The head connects to the neck.')
  const target = createShapeTargets(5600).about.positions
  let left = Infinity, right = -Infinity, bottom = Infinity, top = -Infinity
  for (let i = 0; i < target.length; i += 3) {
    left = Math.min(left, target[i])
    right = Math.max(right, target[i])
    bottom = Math.min(bottom, target[i + 1])
    top = Math.max(top, target[i + 1])
  }
  assert.ok(right - left > 1.7, 'The profile is not a small glyph.')
  assert.ok(top - bottom > 1.95, 'The profile has the globe’s full vertical weight.')
})

test('an interrupted morph snapshots the rendered positions exactly, including globe rotation', () => {
  const source = new Float32Array([1, 2, 3, -2, 1, 0])
  const target = new Float32Array([3, 4, 5, 2, -1, 2])
  const snapshot = snapshotMorph(source, target, 0.5, Math.PI / 2, new Float32Array(6))
  assert.ok(Math.abs(snapshot[0] - 4) < 0.000001)
  assert.equal(snapshot[1], 3)
  assert.ok(Math.abs(snapshot[2] + 2) < 0.000001)
  // In-place snapshots must preserve all coordinates before overwriting them.
  assert.deepEqual(snapshotMorph(source, target, 0.5, Math.PI / 2, source), snapshot)
  assert.deepEqual(snapshotStyle(new Float32Array([0.1, 1]), new Float32Array([0.9, 0]), 0.5, new Float32Array(2)), new Float32Array([0.5, 0.5]))
  assert.equal(smoothProgress(-1), 0)
  assert.equal(smoothProgress(1.5), 1)
})

test('all six states have deterministic finite targets at desktop and fallback counts', () => {
  const desktop = createShapeTargets(5600)
  const fallback = createShapeTargets(900)
  assert.deepEqual(Object.keys(desktop), VISUAL_STATES)
  for (const state of VISUAL_STATES) {
    assert.equal(visualState(state.toUpperCase()), state)
    assert.equal(desktop[state].positions.length, 5600 * 3)
    assert.equal(desktop[state].style.length, 5600 * 2)
    if (state !== 'projects') assert.deepEqual(desktop[state].positions.slice(0, 900 * 3), fallback[state].positions)
    assert.ok(desktop[state].positions.every(Number.isFinite))
    assert.ok(desktop[state].positions.every((value) => Math.abs(value) <= (state === 'journey' ? 4 : 1.1)))
    assert.ok(desktop[state].style.every((value) => value >= 0 && value <= 1))
  }
  assert.equal(visualState('unknown'), 'home')
})

test('the volumetric aerostatic target keeps its architecture and fixed budgets across renderers', () => {
  for (const count of [900, 1200, 1800, 5600]) {
    const target = createShapeTargets(count).projects
    assert.equal(target.positions.length, count * 3)
    assert.equal(target.style.length, count * 2)
    for (const name of ['groups', 'features', 'delays']) assert.equal(target[name].length, count)
    assert.ok(target.positions.every(Number.isFinite))
    assert.ok(target.positions.every((value) => Math.abs(value) < 1.1))
    assert.ok(target.delays.every((value) => Number.isFinite(value) && value >= 0.06 && value <= 0.4))
    assert.equal(new Set(target.features).size, Object.keys(balloonSamples.featureNames).length)
    assert.ok(target.groups.filter((group) => group === 0).length > count * 0.6, 'The envelope receives most of the fixed budget.')
    const z = target.positions.filter((_, index) => index % 3 === 2)
    assert.ok(Math.min(...z) < -0.45 && Math.max(...z) > 0.45, 'The envelope includes a full front and back shell.')
    assert.ok(target.positions.some((value, index) => index % 3 === 1 && value > 0.9), 'The envelope crown is present.')
    assert.ok(target.positions.some((value, index) => index % 3 === 1 && value < -0.85), 'The architectural base is present.')
    assert.deepEqual(target, createShapeTargets(count).projects, 'Correspondence is deterministic at each renderer budget.')
  }
})
