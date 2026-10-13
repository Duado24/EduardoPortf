import test from 'node:test'
import assert from 'node:assert/strict'
import {
  matchBalloonToGlobe,
  particleProgress,
  placementAt,
  sampleMorph,
  sampleMorphValues,
} from './aerostaticTransition.js'

function close(first, second, tolerance = 0.000001) {
  assert.ok(Math.abs(first - second) < tolerance, `${first} differs from ${second}`)
}

test('staged particle timing has exact endpoints and reverses each particle’s timeline', () => {
  for (const delay of [0.06, 0.18, 0.34, 0.4]) {
    assert.equal(particleProgress(0, delay, 1), 0)
    assert.equal(particleProgress(1, delay, 1), 1)
    assert.equal(particleProgress(0, delay, -1), 0)
    assert.equal(particleProgress(1, delay, -1), 1)
    for (let frame = 0; frame <= 100; frame++) {
      const time = frame / 100
      close(particleProgress(time, delay, 1) + particleProgress(1 - time, delay, -1), 1)
    }
  }
  assert.ok(particleProgress(0.2, 0.06, 1) > 0, 'Envelope particles begin before the house architecture.')
  assert.equal(particleProgress(0.2, 0.34, 1), 0)
  assert.equal(particleProgress(0.7, 0.06, 1), 1)
  assert.ok(particleProgress(0.7, 0.34, 1) < 1)
  assert.equal(particleProgress(0.37, 0.34, 0), 0.37, 'Existing transitions retain their supplied easing.')
})

test('geometry snapshots retain exact endpoints and are safe in either input buffer', () => {
  const source = new Float32Array([0.4, 0.8, 0.2, -0.6, -0.8, -0.3])
  const target = new Float32Array([-0.2, 0.9, -0.1, 0.3, -0.7, 0.2])
  const delays = new Float32Array([0.06, 0.34])
  assert.deepEqual(sampleMorph(source, target, 0, delays, 1), source)
  assert.deepEqual(sampleMorph(source, target, 1, delays, 1), target)
  const snapshot = sampleMorph(source, target, 0.47, delays, 1)
  assert.deepEqual(sampleMorph(source.slice(), target, 0.47, delays, 1, source.slice()), snapshot)
  const sourceInPlace = source.slice()
  assert.deepEqual(sampleMorph(sourceInPlace, target, 0.47, delays, 1, sourceInPlace), snapshot)
  const targetInPlace = target.slice()
  assert.deepEqual(sampleMorph(source, targetInPlace, 0.47, delays, 1, targetInPlace), snapshot)
  const resumedStart = sampleMorph(snapshot, source, 0, delays, -1)
  assert.deepEqual(resumedStart, snapshot, 'Interrupting navigation starts from the rendered positions.')
  assert.ok(snapshot.every(Number.isFinite))
  assert.ok(snapshot.every((value) => Math.abs(value) <= 1.1))
  const reverse = sampleMorph(target, source, 1 - 0.47, delays, -1)
  for (let index = 0; index < snapshot.length; index++) close(snapshot[index], reverse[index])
})

test('style and depth metadata share geometry timing and support in-place snapshots', () => {
  const source = new Float32Array([0.2, 1, 0.4, 0])
  const target = new Float32Array([1, 0, 0.8, 0.5])
  const delays = new Float32Array([0.06, 0.34])
  const snapshot = sampleMorphValues(source, target, 0.25, delays, 1, 2)
  const amount = particleProgress(0.25, delays[0], 1)
  close(snapshot[0], source[0] + (target[0] - source[0]) * amount)
  close(snapshot[1], source[1] + (target[1] - source[1]) * amount)
  assert.equal(snapshot[2], source[2])
  assert.equal(snapshot[3], source[3])
  const inPlace = source.slice()
  assert.deepEqual(sampleMorphValues(inPlace, target, 0.25, delays, 1, 2, inPlace), snapshot)
  assert.deepEqual(sampleMorphValues(source, target, 1, delays, 1, 2), target)
})

test('latitude-band matching preserves every particle and its feature metadata', () => {
  const count = 192
  const globe = { positions: new Float32Array(count * 3) }
  const balloon = {
    positions: new Float32Array(count * 3),
    style: new Float32Array(count * 2),
    delays: new Float32Array(count),
    groups: new Uint8Array(count),
    features: new Uint16Array(count),
  }
  for (let index = 0; index < count; index++) {
    const angle = (index % 48) / 48 * Math.PI * 2
    globe.positions.set([Math.sin(angle), index / count * 2 - 1, Math.cos(angle)], index * 3)
    const latitudeRank = index * 73 % count
    balloon.positions.set([Math.sin(angle) * 0.5, latitudeRank / count * 2 - 1, Math.cos(angle) * 0.2], index * 3)
    balloon.style.set([index / count, (index % 10) / 10], index * 2)
    balloon.delays[index] = 0.06 + index / count * 0.28
    balloon.groups[index] = index % 10
    balloon.features[index] = index
  }
  const mapped = matchBalloonToGlobe(globe, balloon)
  assert.deepEqual(mapped, matchBalloonToGlobe(globe, balloon), 'Matching is deterministic.')
  assert.equal(new Set(mapped.features).size, count)
  let beforeLatitudeError = 0, afterLatitudeError = 0
  for (let index = 0; index < count; index++) {
    const original = mapped.features[index]
    assert.deepEqual(mapped.positions.slice(index * 3, index * 3 + 3), balloon.positions.slice(original * 3, original * 3 + 3))
    assert.deepEqual(mapped.style.slice(index * 2, index * 2 + 2), balloon.style.slice(original * 2, original * 2 + 2))
    assert.equal(mapped.delays[index], balloon.delays[original])
    assert.equal(mapped.groups[index], balloon.groups[original])
    beforeLatitudeError += Math.abs(globe.positions[index * 3 + 1] - balloon.positions[index * 3 + 1])
    afterLatitudeError += Math.abs(globe.positions[index * 3 + 1] - mapped.positions[index * 3 + 1])
  }
  assert.ok(afterLatitudeError < beforeLatitudeError / 2, 'Related latitude bands reduce globe-to-balloon crossings.')
  assert.notEqual(mapped.positions, balloon.positions)
})

test('viewport placement follows a reversible arc and holds its backing size until arrival', () => {
  const from = { x: 300, y: 170, size: 1200, backing: 600 }
  const to = { x: 960, y: 150, size: 480, backing: 480 }
  assert.deepEqual(placementAt(from, to, 0, 1), from)
  assert.deepEqual(placementAt(from, to, 1, 1), to)
  const out = {}
  assert.equal(placementAt(from, to, 0.5, 1, out), out)
  close(out.size, 840 * 0.92)
  close(out.y + out.size / 2, (from.y + from.size / 2 + to.y + to.size / 2) / 2 - 480 * 0.13)
  assert.equal(out.backing, from.backing)
  for (let frame = 0; frame <= 100; frame++) {
    const time = frame / 100
    const forward = placementAt(from, to, time, 1)
    const reverse = placementAt(to, from, 1 - time, -1)
    for (const value of ['x', 'y', 'size']) close(forward[value], reverse[value])
  }
})
