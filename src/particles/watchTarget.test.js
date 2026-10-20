import test from 'node:test'
import assert from 'node:assert/strict'
import { createWatchTarget, placeWatch, WATCH_KINDS, watchLayout, watchShade } from './watchTarget.js'

test('every Skills budget keeps each part of the scene, from the knight to the smoke', () => {
  for (const count of [900, 1200, 1400, 1800, 2800, 5600]) {
    const { watchA } = createWatchTarget(count)
    const kinds = new Set()
    for (let i = 0; i < count; i++) kinds.add(watchA[i * 4])
    assert.deepEqual([...kinds].sort(), Object.values(WATCH_KINDS).sort(), `${count} particles`)
  }
})

test('the knight sits left of the fire and the scene fits the region on desktop and phones', () => {
  for (const viewport of [{ width: 1440, height: 810 }, { width: 390, height: 844 }]) {
    const layout = watchLayout(viewport)
    const { positions, watchA } = createWatchTarget(5600, layout)
    placeWatch(layout, positions)
    const mean = (kind) => {
      let sum = 0, n = 0
      for (let i = 0; i < 5600; i++) if (watchA[i * 4] === kind) { sum += positions[i * 3]; n++ }
      return sum / n
    }
    assert.ok(mean(WATCH_KINDS.metal) < mean(WATCH_KINDS.flame), 'knight left of the flame')
    for (let i = 0; i < 5600; i++) {
      const kind = watchA[i * 4]
      if (kind !== WATCH_KINDS.metal && kind !== WATCH_KINDS.cloth) continue
      assert.ok(Math.abs(positions[i * 3]) < 1.2 && Math.abs(positions[i * 3 + 1]) < 1.2, 'knight inside the camera square')
    }
  }
})

test('fire effects animate while the knight stays put', () => {
  const { watchA, watchB } = createWatchTarget(5600)
  const out = [0, 0, 0, 0, 0]
  const flame = watchA.findIndex((value, index) => index % 4 === 0 && value === WATCH_KINDS.flame) / 4
  const metal = watchA.findIndex((value, index) => index % 4 === 0 && value === WATCH_KINDS.metal) / 4
  const at = (i, time) => watchShade(watchA, watchB, i, time, 0, out).slice()
  assert.notDeepEqual(at(flame, 0.3).slice(0, 2), at(flame, 1.1).slice(0, 2))
  assert.deepEqual(at(metal, 0.3).slice(0, 2), [0, 0])
  assert.ok(out.every(Number.isFinite))
})
