// Offline asset preparation only. Never imported by the portfolio.
// Usage: node scripts/generate-watch-targets.mjs
// Runs the approved "Last Watch" HTML's scene builder once in Node (its own
// 5,600-particle tuning) and bakes the world-space samples. Camera, lighting,
// fire animation and placement stay in src/particles/watchTarget.js.
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = 'references/claude/the_last_watch_tweak_claude_5600 (1).html'
const destination = resolve(projectRoot, 'src/particles/watch-samples.json')
const html = await readFile(resolve(projectRoot, sourcePath), 'utf8')
const count = 5600
const density = 1.3

const start = html.indexOf('function build(')
const end = html.indexOf('(function(){')
if (start < 0 || end <= start) throw new Error('The approved HTML scene boundaries changed.')
// The ground's three dotted rings (radii 1.0, 1.7, 2.5 at exactly y = 0) are left out
// before the reference's own tuning, so its ground budget refills from scattered dirt.
const withoutRings = `
  function dropRings(B) {
    var P = [], N = [], V = []
    for (var i = 0; i < B.S.V.length; i += 3) {
      var x = B.S.P[i], y = B.S.P[i + 1], z = B.S.P[i + 2], r = Math.hypot(x, z)
      var ring = B.S.V[i] === 0 && y === 0 && [1.0, 1.7, 2.5].some(function (rr) { return Math.abs(r - rr) < 1e-6 })
      if (ring) continue
      P.push(x, y, z); N.push(B.S.N[i], B.S.N[i + 1], B.S.N[i + 2]); V.push(B.S.V[i], B.S.V[i + 1], B.S.V[i + 2])
    }
    B.S = { P: P, N: N, V: V }
    return B
  }`
const sandbox = { Math, Float32Array, module: undefined }
runInNewContext(`${html.slice(start, end)}\n${withoutRings}\nthis.scene = tuneScene(dropRings(build(${density})))`, sandbox)
const { S, F } = sandbox.scene

const kindNames = { ground: 0, flame: 1, spark: 2, smoke: 3, dust: 4, metal: 5, cloth: 6, wood: 7, ember: 8 }
const samples = []
for (const set of [S, F]) {
  for (let i = 0; i < set.V.length / 3; i++) {
    samples.push({
      position: [set.P[i * 3], set.P[i * 3 + 1], set.P[i * 3 + 2]],
      normal: [set.N[i * 3], set.N[i * 3 + 1], set.N[i * 3 + 2]],
      kind: set.V[i * 3], seed: set.V[i * 3 + 1], tone: set.V[i * 3 + 2],
    })
  }
}
if (samples.length !== count) throw new Error(`Expected ${count} samples, got ${samples.length}.`)

// Bit-reversed order inside each kind, merged by that key: every prefix keeps
// each part of the scene in proportion and spread across its whole surface.
function radicalInverse(index, base) {
  let value = 0
  let factor = 1 / base
  while (index > 0) {
    value += index % base * factor
    index = Math.floor(index / base)
    factor /= base
  }
  return value
}
const ranks = {}
for (const sample of samples) {
  ranks[sample.kind] = (ranks[sample.kind] ?? 0) + 1
  sample.key = radicalInverse(ranks[sample.kind], 2)
}
samples.sort((a, b) => a.key - b.key || a.kind - b.kind)

const round = (value, digits) => Number(value.toFixed(digits))
const output = {
  sourceHtml: sourcePath,
  sourceHtmlSha256: createHash('sha256').update(html).digest('hex'),
  sampleOptions: { count, density, ordering: 'per-kind-radical-inverse', groundRings: false },
  kindNames,
  positions: samples.flatMap((s) => s.position.map((v) => round(v, 3))),
  normals: samples.flatMap((s) => s.normal.map((v) => round(v, 2))),
  kinds: samples.map((s) => s.kind),
  seeds: samples.map((s) => round(s.seed, 3)),
  tones: samples.map((s) => round(s.tone, 2)),
}
await writeFile(destination, JSON.stringify(output) + '\n')
const prefixes = [1400, 1800, 2800, count]
const distribution = Object.fromEntries(Object.entries(kindNames).map(([name, id]) => [name,
  prefixes.map((prefix) => output.kinds.slice(0, prefix).filter((kind) => kind === id).length),
]))
console.log(JSON.stringify({ destination, count, prefixes, distribution }, null, 2))
