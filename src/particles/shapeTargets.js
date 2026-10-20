import globeSamples from './globe-samples.json' with { type: 'json' }
import balloonSamples from './balloon-samples.json' with { type: 'json' }
import { createJourneyTarget } from './journeyTarget.js'
import { createBoardTarget } from './boardTarget.js'
import { createWatchTarget } from './watchTarget.js'
import { matchBalloonToGlobe } from './aerostaticTransition.js'

export const MAX_PARTICLES = 5600
export const MOBILE_PARTICLES = 1800
export const HOME_ROTATION_SPEED = 0.045
export const VISUAL_STATES = ['home', 'about', 'projects', 'journey', 'skills', 'contact']

export function visualState(section) {
  const normalized = String(section).toLowerCase()
  return VISUAL_STATES.includes(normalized) ? normalized : 'home'
}

export function geographicPosition(longitude, latitude, radius = 1) {
  const lon = (longitude + 65) * Math.PI / 180
  const lat = latitude * Math.PI / 180
  const latitudeRadius = Math.cos(lat) * radius
  return [latitudeRadius * Math.sin(lon), Math.sin(lat) * radius, latitudeRadius * Math.cos(lon)]
}

function sampleCurve(start, controlA, controlB, end, steps = 18) {
  return Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) / steps
    const inverse = 1 - t
    return [0, 1].map((axis) => inverse ** 3 * start[axis] +
      3 * inverse ** 2 * t * controlA[axis] +
      3 * inverse * t ** 2 * controlB[axis] + t ** 3 * end[axis])
  })
}

// Original right-facing profile, rather than a head-circle/avatar glyph.
// Curves define the skull and shoulder sweep; small facial steps define the
// forehead, nose, lips and chin without adding pictorial detail or a likeness.
const profileOutline = [
  [-0.22, 1],
  ...sampleCurve([-0.22, 1], [-0.55, 1], [-0.75, 0.78], [-0.76, 0.42]),
  ...sampleCurve([-0.76, 0.42], [-0.77, 0.05], [-0.61, -0.18], [-0.43, -0.36]),
  [-0.4, -0.53],
  ...sampleCurve([-0.4, -0.53], [-0.44, -0.71], [-0.85, -0.68], [-0.97, -0.98]),
  [0.83, -0.98],
  ...sampleCurve([0.83, -0.98], [0.77, -0.83], [0.4, -0.7], [0.31, -0.56]),
  [0.3, -0.35],
  ...sampleCurve([0.3, -0.35], [0.56, -0.32], [0.62, -0.23], [0.62, -0.08]),
  [0.72, -0.02],
  ...sampleCurve([0.72, -0.02], [0.73, 0.02], [0.71, 0.05], [0.66, 0.06], 6),
  [0.63, 0.12], [0.81, 0.17],
  ...sampleCurve([0.81, 0.17], [0.86, 0.2], [0.85, 0.24], [0.81, 0.28], 6),
  [0.58, 0.49],
  ...sampleCurve([0.58, 0.49], [0.55, 0.58], [0.57, 0.72], [0.47, 0.83]),
  ...sampleCurve([0.47, 0.83], [0.28, 1.01], [0.06, 1], [-0.22, 1]),
]

export function insideAboutShape(x, y) {
  let inside = false
  for (let i = 0, j = profileOutline.length - 1; i < profileOutline.length; j = i++) {
    const [xi, yi] = profileOutline[i]
    const [xj, yj] = profileOutline[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function radicalInverse(index, base) {
  let value = 0
  let factor = 1 / base
  while (index > 0) {
    value += (index % base) * factor
    index = Math.floor(index / base)
    factor /= base
  }
  return value
}

export function createShapeTargets(count = MAX_PARTICLES) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_PARTICLES) throw new RangeError('Invalid particle count.')
  const globe = new Float32Array(count * 3)
  const globeStyle = new Float32Array(count * 2)
  const about = new Float32Array(count * 3)
  const aboutStyle = new Float32Array(count * 2)
  const projects = Float32Array.from(balloonSamples.positions.slice(0, count * 3))
  const projectStyle = new Float32Array(count * 2)
  const delays = Float32Array.from(balloonSamples.delays.slice(0, count))
  const groups = Uint8Array.from(balloonSamples.groups.slice(0, count))
  const features = Uint8Array.from(balloonSamples.features.slice(0, count))
  let profileCandidate = 1

  for (let i = 0; i < count; i++) {
    const [lon, lat, kind] = globeSamples.samples.slice(i * 3, i * 3 + 3)
    globe.set(geographicPosition(lon, lat), i * 3)
    globeStyle.set([kind === 0 ? 0.27 : kind === 2 ? 1 : 0.9, kind === 2 ? 1 : 0], i * 2)

    let x, y
    do {
      // Low-discrepancy samples keep a consistent dot field without random clumps.
      x = radicalInverse(profileCandidate, 2) * 1.84 - 0.99
      y = radicalInverse(profileCandidate, 3) * 2.02 - 1
      profileCandidate++
    } while (!insideAboutShape(x, y))
    about.set([x, y, (radicalInverse(i + 1, 5) - 0.5) * 0.08], i * 3)
    aboutStyle.set([0.57 + radicalInverse(i + 1, 7) * 0.32, 0], i * 2)
    projectStyle.set([features[i] === balloonSamples.featureNames.shell ? 0.82 : 1, 0], i * 2)
  }

  return {
    home: { positions: globe, style: globeStyle },
    about: { positions: about, style: aboutStyle },
    projects: matchBalloonToGlobe(globe, { positions: projects, style: projectStyle, delays, groups, features }),
    journey: createJourneyTarget(count),
    skills: createWatchTarget(count),
    contact: createBoardTarget(count),
  }
}

export function smoothProgress(progress) {
  const clamped = Math.min(1, Math.max(0, progress))
  return clamped * clamped * (3 - 2 * clamped)
}

// CPU snapshots occur only on a navigation interruption. Normal frames interpolate on the GPU.
export function snapshotMorph(source, target, progress, rotation, destination) {
  const cosine = Math.cos(rotation)
  const sine = Math.sin(rotation)
  for (let i = 0; i < source.length; i += 3) {
    const x = source[i] + (target[i] - source[i]) * progress
    const y = source[i + 1] + (target[i + 1] - source[i + 1]) * progress
    const z = source[i + 2] + (target[i + 2] - source[i + 2]) * progress
    destination[i] = x * cosine + z * sine
    destination[i + 1] = y
    destination[i + 2] = z * cosine - x * sine
  }
  return destination
}

export function snapshotStyle(source, target, progress, destination) {
  for (let i = 0; i < source.length; i++) destination[i] = source[i] + (target[i] - source[i]) * progress
  return destination
}
