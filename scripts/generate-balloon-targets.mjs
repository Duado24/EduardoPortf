// Offline asset preparation only. Never imported by the portfolio.
// Usage: node scripts/generate-balloon-targets.mjs
// The approved HTML's geometry runs once in Node. Its canvas, animation, and
// atmospheric extras are deliberately excluded from the production asset.
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = 'references/claude/aerostatic_globe_detailed.html'
const destination = resolve(projectRoot, 'src/particles/balloon-samples.json')
const html = await readFile(resolve(projectRoot, sourcePath), 'utf8')
const count = 5600
const height = 2.12
const seed = 11

// Keep the original construction of the envelope profile and all architectural
// curves. Only tag semantic sections so the fixed budget can be shared between
// the shell and small details instead of inheriting the demo's line density.
const start = html.indexOf('function mulberry(')
const end = html.indexOf('const N=bx.length;')
if (start < 0 || end <= start) throw new Error('The approved HTML geometry boundaries changed.')
let geometry = html.slice(start, end)
const featureNames = {
  shell: 0, gores: 1, bands: 2, mouth: 3, patches: 4, ropes: 5,
  spire: 6, tower: 7, windows: 8, house: 9, gable: 10, balcony: 11,
  telescopes: 12, bunting: 13,
}
const groupNames = { envelope: 0, structure: 1, detail: 2 }
const definitions = [
  ['shell', 2240, 0, .06, .12],
  ['gores', 900, 0, .08, .15],
  ['bands', 240, 0, .10, .18],
  ['mouth', 100, 0, .11, .19],
  ['patches', 280, 0, .12, .20],
  ['ropes', 190, 1, .18, .24],
  ['spire', 180, 1, .20, .27],
  ['tower', 220, 1, .23, .29],
  ['windows', 100, 2, .33, .40],
  ['house', 270, 1, .26, .33],
  ['gable', 150, 2, .30, .37],
  ['balcony', 220, 2, .30, .38],
  ['telescopes', 280, 2, .29, .37],
  ['bunting', 230, 2, .34, .40],
]
if (definitions.reduce((sum, entry) => sum + entry[1], 0) !== count) {
  throw new Error('Feature allocations must match the existing particle budget.')
}

function replaceExactly(before, after) {
  if (geometry.split(before).length !== 2) throw new Error(`The approved HTML changed: ${before}`)
  geometry = geometry.replace(before, after)
}
function mark(before, name) {
  replaceExactly(before, `feature=${featureNames[name]};primitive++;\n${before}`)
}

replaceExactly('const bx=[],by=[],bz=[],grp=[],fl=[],gl=[];',
  'let feature=0,primitive=0;const features=[],primitives=[];const bx=[],by=[],bz=[],grp=[],fl=[],gl=[];')
replaceExactly('function add(x,y,z,g,f,hot){',
  'function add(x,y,z,g,f,hot){features.push(feature);primitives.push(primitive);')
for (const declaration of [
  'function line(a,b,g,f,hot){', 'function ring(cy,r,g,hot){',
  'function circ(c,r,v,w,g){', 'function ball(c,r,n,g){',
  'function patch(poly,thc){',
]) replaceExactly(declaration, `${declaration}primitive++;`)

replaceExactly('for(let k=0;k<10;k++){', `feature=${featureNames.gores};\nfor(let k=0;k<10;k++){primitive++;`)
replaceExactly('for(const y of[224,242,288])ring(y,rAtY(y),0,true);',
  `feature=${featureNames.bands};for(const y of[224,242])ring(y,rAtY(y),0,true);\n` +
  `feature=${featureNames.mouth};ring(288,rAtY(288),0,true);`)
mark('patch(PL,0);', 'patches')
mark('// 2. ropes', 'ropes')
mark('// 3. gothic spire', 'spire')
mark('// 4. tower', 'tower')
mark('for(const zs of[1,-1])', 'windows')
mark('// 5. lower house', 'house')
mark('{const d=[[-15,500]', 'windows')
mark('// 6. gabled birdhouse', 'gable')
mark('// 7. balcony', 'balcony')
mark('// 8. telescopes', 'telescopes')
mark('// 9. bunting', 'bunting')
// These are filled surfaces or independently sampled curves, rather than
// additional points on the last line/ring primitive.
replaceExactly('for(let i=0;i<170;i++){', 'primitive++;for(let i=0;i<170;i++){')
replaceExactly('for(let i=0;i<260;i++){', 'primitive++;for(let i=0;i<260;i++){')
replaceExactly('for(let i=0;i<300;i++){', 'primitive++;for(let i=0;i<300;i++){')
replaceExactly('for(let i=0;i<150;i++){', 'primitive++;for(let i=0;i<150;i++){')
replaceExactly('for(let k=0;k<3;k++){', 'for(let k=0;k<3;k++){primitive++;')
replaceExactly('const n=Math.round(BR*span*D*1.1);', 'primitive++;const n=Math.round(BR*span*D*1.1);')

const sampled = runInNewContext(
  `${geometry}\n({bx,by,bz,features,primitives,PY,PR,PA,random:mulberry(${seed + 1})});`,
  {}, { timeout: 5000 })
const random = sampled.random
const goldenAngle = Math.PI * (3 - Math.sqrt(5))
function radicalInverse(index) {
  let result = 0, weight = .5
  while (index) {
    result += (index & 1) * weight
    index >>>= 1
    weight *= .5
  }
  return result
}

// Area coordinate is the prototype's integral of r * ds. Pairing a van der
// Corput area sequence with golden-angle azimuth avoids random shell clumps,
// and remains well spread when Canvas consumes only the first few hundred.
function shellSamples(total) {
  const { PY, PR, PA } = sampled
  return Array.from({ length: total }, (_, i) => {
    const area = radicalInverse(i + 1) * PA.at(-1)
    let lo = 0, hi = PA.length - 1
    while (lo < hi) {
      const middle = (lo + hi) >>> 1
      if (PA[middle] < area) lo = middle + 1
      else hi = middle
    }
    const next = Math.max(1, lo), previous = next - 1
    const fraction = (area - PA[previous]) / (PA[next] - PA[previous])
    const y = PY[previous] + (PY[next] - PY[previous]) * fraction
    const radius = PR[previous] + (PR[next] - PR[previous]) * fraction
    const azimuth = i * goldenAngle
    return [radius * Math.sin(azimuth), y, radius * Math.cos(azimuth)]
  })
}

// Uniformly spread a primitive's original line/ring/surface samples before fair
// interleaving. A bit-reversed selection visits both ends and the middle early.
function distributePrimitive(points) {
  const result = [], used = new Set()
  for (let i = 1; result.length < points.length; i++) {
    const index = Math.min(points.length - 1, Math.floor(radicalInverse(i) * points.length))
    if (!used.has(index)) {
      result.push(points[index])
      used.add(index)
    }
  }
  return result
}

function fairInterleave(lists, total) {
  const lengths = lists.map((list) => list.length)
  const available = lengths.reduce((sum, length) => sum + length, 0)
  if (total > available) throw new Error('A feature allocation exceeds its source geometry.')
  const used = lists.map(() => 0), result = []
  for (let i = 0; i < total; i++) {
    let next = -1, largestDeficit = -Infinity
    for (let j = 0; j < lists.length; j++) {
      if (used[j] >= lengths[j]) continue
      const deficit = (i + 1) * lengths[j] / available - used[j]
      if (deficit > largestDeficit) {
        next = j
        largestDeficit = deficit
      }
    }
    result.push(lists[next][used[next]++])
  }
  return result
}

const sourceFeatures = definitions.map(() => new Map())
for (let i = 0; i < sampled.bx.length; i++) {
  const feature = sampled.features[i], primitive = sampled.primitives[i]
  if (!sourceFeatures[feature].has(primitive)) sourceFeatures[feature].set(primitive, [])
  sourceFeatures[feature].get(primitive).push([sampled.bx[i], sampled.by[i], sampled.bz[i]])
}
const featureSamples = definitions.map(([name, total, group, delayStart, delayEnd]) => {
  const positions = name === 'shell' ? shellSamples(total) : fairInterleave(
    Array.from(sourceFeatures[featureNames[name]].values(), distributePrimitive), total)
  return positions.map((position) => ({
    position, feature: featureNames[name], group,
    delay: delayStart + random() * (delayEnd - delayStart),
  }))
})
const ordered = fairInterleave(featureSamples, count)

// The original drawing's 6..580 height sets the aspect ratio. Keep the same
// scale on all three axes: neither the envelope nor the architecture is flattened.
const sourceBounds = [0, 1, 2].map((axis) => {
  const values = ordered.map((sample) => sample.position[axis])
  return [Math.min(...values), Math.max(...values)]
})
const centerY = (sourceBounds[1][0] + sourceBounds[1][1]) / 2
const scale = height / (sourceBounds[1][1] - sourceBounds[1][0])
const round = (value) => Number(value.toFixed(5))
const positions = [], groups = [], features = [], delays = []
for (const sample of ordered) {
  const [x, y, z] = sample.position
  positions.push(round(x * scale), round((centerY - y) * scale), round(z * scale))
  groups.push(sample.group)
  features.push(sample.feature)
  delays.push(round(sample.delay))
}
if (positions.length !== count * 3 || !positions.every(Number.isFinite)) {
  throw new Error('Invalid generated geometry.')
}

const output = {
  sourceHtml: sourcePath,
  sourceHtmlSha256: createHash('sha256').update(html).digest('hex'),
  sampleOptions: { count, height, seed, shellSampling: 'area-stratified-golden-angle' },
  groupNames, featureNames, positions, groups, features, delays,
}
await writeFile(destination, JSON.stringify(output) + '\n')
const bounds = [0, 1, 2].map((axis) => {
  const values = positions.filter((_, index) => index % 3 === axis)
  return [Math.min(...values), Math.max(...values)]
})
const prefixes = [900, 1200, 1800, count]
const distribution = Object.fromEntries(definitions.map(([name]) => [name,
  prefixes.map((prefix) => features.slice(0, prefix).filter((id) => id === featureNames[name]).length),
]))
console.log(JSON.stringify({ destination, count, sourceCount: sampled.bx.length, bounds, prefixes, distribution }, null, 2))
