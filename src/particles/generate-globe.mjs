// Offline asset preparation only. Never imported by the portfolio.
// Usage: node src/particles/generate-globe.mjs /path/to/ne_110m_admin_0_countries.geojson
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const sourcePath = process.argv[2]
if (!sourcePath) throw new Error('Provide the downloaded Natural Earth countries GeoJSON path.')
const source = await readFile(sourcePath, 'utf8')
const countries = JSON.parse(source).features.map(({ properties, geometry }) => ({
  peru: properties.ADM0_A3 === 'PER',
  polygons: geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates,
})).flatMap(({ peru, polygons }) => polygons.map((rings) => ({
  peru,
  rings,
  bounds: rings[0].reduce(([west, south, east, north], [lon, lat]) => [
    Math.min(west, lon), Math.min(south, lat), Math.max(east, lon), Math.max(north, lat),
  ], [180, 90, -180, -90]),
})))

function insideRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function classify(lon, lat) {
  for (const { bounds: [west, south, east, north], rings, peru } of countries) {
    if (lon < west || lon > east || lat < south || lat > north) continue
    if (insideRing(lon, lat, rings[0]) && !rings.slice(1).some((hole) => insideRing(lon, lat, hole))) return peru ? 2 : 1
  }
  return 0
}

let seed = 240629
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return seed / 4294967296
}
function shuffle(points) {
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[points[i], points[j]] = [points[j], points[i]]
  }
  return points
}

const pools = [[], [], []]
const candidates = 22000
const goldenAngle = Math.PI * (3 - Math.sqrt(5))
for (let i = 0; i < candidates; i++) {
  const latitude = Math.asin(1 - 2 * (i + 0.5) / candidates) * 180 / Math.PI
  const longitude = (i * goldenAngle * 180 / Math.PI) % 360 - 180
  const kind = classify(longitude, latitude)
  pools[kind].push([Number(longitude.toFixed(4)), Number(latitude.toFixed(4)), kind])
}

// Dense real land shapes, subdued ocean dots, and a small geographically accurate Peru accent.
// Shuffling creates a spatially representative prefix when the renderer reduces its draw range.
const samples = shuffle([
  ...shuffle(pools[0]).slice(0, 1950),
  ...shuffle(pools[1]).slice(0, 3606),
  ...shuffle(pools[2]).slice(0, 44),
]).flat()
if (samples.length !== 5600 * 3) throw new Error('Not enough geographic samples.')

await writeFile(new URL('./globe-samples.json', import.meta.url), JSON.stringify({
  source: 'Natural Earth 1:110m Admin 0 countries, public domain',
  sourceUrl: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  samples,
}) + '\n')
