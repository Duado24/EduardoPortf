// Offline asset preparation only. Never imported by the portfolio.
// Usage: node scripts/generate-balloon-targets.mjs
// Uses the supplied SVG and sampler in headless Chromium because SVGGeometryElement
// path-length APIs are browser APIs. The source files remain unchanged.
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = resolve(projectRoot, 'references/claude/balloon (2).svg')
const samplerPath = resolve(projectRoot, 'references/claude/balloonTargets (2).js')
const destination = resolve(projectRoot, 'src/particles/balloon-samples.json')
const svg = await readFile(svgPath, 'utf8')
const sampler = await readFile(samplerPath, 'utf8')
const count = 5600
const height = 2.2

function replaceExactly(source, before, after, expected = 1) {
  const found = source.split(before).length - 1
  if (found !== expected) throw new Error(`The supplied sampler changed; expected ${expected} occurrence(s) of: ${before}`)
  return source.replaceAll(before, after)
}

// The supplied sampler is run as written, apart from recording the source SVG
// path for each sample. That metadata lets the output retain every detail even
// when the renderer uses only a prefix of the 5600-point buffer.
let instrumented = sampler.replace(/^export /gm, '')
instrumented = replaceExactly(instrumented,
  'shapes.push({ el, name, len });',
  'shapes.push({ el, name, len, shapeId: shapes.length });')
instrumented = replaceExactly(instrumented,
  'const glow = new Float32Array(count);',
  'const glow = new Float32Array(count);\n  const shapeIds = new Uint16Array(count);')
instrumented = replaceExactly(instrumented,
  'groups[i] = GROUPS[sh.name];',
  'groups[i] = GROUPS[sh.name];\n      shapeIds[i] = sh.shapeId;', 2)
instrumented = replaceExactly(instrumented,
  'return { positions, groups, glow, count, scale };',
  'return { positions, groups, glow, shapeIds, count, scale };')

// Avoid adding a DOM package just for asset generation. Chromium evaluates the
// original geometry with native SVG path APIs and returns the flat buffers.
const encodedSvg = JSON.stringify(svg).replaceAll('<', '\\u003c')
const page = `<!doctype html><html><body><script>
${instrumented}
try {
  const sampled = sampleBalloon(${encodedSvg}, { count: ${count}, height: ${height}, seed: 1 });
  const result = {
    positions: Array.from(sampled.positions),
    groups: Array.from(sampled.groups),
    glow: Array.from(sampled.glow),
    shapeIds: Array.from(sampled.shapeIds),
    groupNames: GROUPS,
  };
  document.body.innerHTML = '<pre id="balloon-result">' + btoa(JSON.stringify(result)) + '</pre>';
} catch (error) {
  document.body.innerHTML = '<pre id="balloon-error">' + String(error.stack || error) + '</pre>';
}
</script></body></html>`

const browserCandidates = [
  process.env.BALLOON_CHROME,
  process.env.HOME && resolve(process.env.HOME, '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'),
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean)
let browser
for (const candidate of browserCandidates) {
  try {
    await access(candidate, constants.X_OK)
    browser = candidate
    break
  } catch { /* Try the next installed browser. */ }
}
if (!browser) throw new Error('Chromium is required for SVG sampling. Set BALLOON_CHROME to its executable path.')
const tempDir = await mkdtemp(resolve(tmpdir(), 'eduardo-balloon-'))
let sampled
try {
  const pagePath = resolve(tempDir, 'sample.html')
  await writeFile(pagePath, page)
  const { stdout } = await execFileAsync(browser, [
    '--headless', '--no-sandbox', '--disable-gpu', '--disable-extensions',
    '--disable-background-networking', '--dump-dom', `--user-data-dir=${resolve(tempDir, 'profile')}`,
    `file://${pagePath}`,
  ], { maxBuffer: 12 * 1024 * 1024, timeout: 30000 })
  const result = stdout.match(/<pre id="balloon-result">([A-Za-z0-9+/=]+)<\/pre>/)
  if (!result) {
    const error = stdout.match(/<pre id="balloon-error">([\s\S]*?)<\/pre>/)
    throw new Error(`SVG sampling failed: ${error?.[1] || stdout.slice(-1000)}`)
  }
  sampled = JSON.parse(Buffer.from(result[1], 'base64').toString('utf8'))
} finally {
  await rm(tempDir, { recursive: true, force: true })
}

if (sampled.positions.length !== count * 3 || sampled.groups.length !== count ||
    sampled.glow.length !== count || sampled.shapeIds.length !== count) {
  throw new Error('The supplied sampler returned an unexpected particle count.')
}

// Weighted fair ordering across the original SVG paths. A 900/1200/1800-point
// prefix includes parts of the envelope, gores, house, and small features,
// rather than ending partway through a feature group or a single long path.
const shapeCount = Math.max(...sampled.shapeIds) + 1
const paths = Array.from({ length: shapeCount }, () => [])
for (let i = 0; i < count; i++) paths[sampled.shapeIds[i]].push(i)
let seed = 0x5eb0a11
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}
for (const path of paths) {
  for (let i = path.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[path[i], path[j]] = [path[j], path[i]]
  }
}
const used = new Uint16Array(shapeCount)
const order = new Uint16Array(count)
for (let i = 0; i < count; i++) {
  let next = -1
  let deficit = -Infinity
  for (let shapeId = 0; shapeId < shapeCount; shapeId++) {
    if (used[shapeId] >= paths[shapeId].length) continue
    const owed = (i + 1) * paths[shapeId].length / count - used[shapeId]
    if (owed > deficit) {
      deficit = owed
      next = shapeId
    }
  }
  order[i] = paths[next][used[next]++]
}

const round = (value) => Number(value.toFixed(5))
const positions = []
const groups = []
const glow = []
const shapeIds = []
for (const sample of order) {
  positions.push(...sampled.positions.slice(sample * 3, sample * 3 + 3).map(round))
  groups.push(sampled.groups[sample])
  glow.push(round(sampled.glow[sample]))
  shapeIds.push(sampled.shapeIds[sample])
}

const output = {
  sourceSvg: 'references/claude/balloon (2).svg',
  sourceSampler: 'references/claude/balloonTargets (2).js',
  sourceSvgSha256: createHash('sha256').update(svg).digest('hex'),
  sourceSamplerSha256: createHash('sha256').update(sampler).digest('hex'),
  sampleOptions: { count, height, seed: 1 },
  groupNames: sampled.groupNames,
  positions, groups, glow, shapeIds,
}
await writeFile(destination, JSON.stringify(output) + '\n')

const bounds = [0, 1, 2].map((axis) => {
  const values = positions.filter((_, index) => index % 3 === axis)
  return [Math.min(...values), Math.max(...values)]
})
const distribution = Object.fromEntries(Object.entries(sampled.groupNames).map(([name, id]) => [
  name, [900, 1200, 1800, count].map((prefix) => groups.slice(0, prefix).filter((group) => group === id).length),
]))
console.log(JSON.stringify({ destination, count, shapeCount, bounds, prefixes: [900, 1200, 1800, count], distribution }, null, 2))
