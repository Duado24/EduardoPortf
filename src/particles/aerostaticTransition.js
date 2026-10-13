const TAU = Math.PI * 2

function clampProgress(value) {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(value) {
  const progress = clampProgress(value)
  return progress * progress * (3 - 2 * progress)
}

// Ordinary transitions supply their existing eased progress. Aerostatic
// transitions supply raw progress so each feature can retain its own timing.
export function particleProgress(progress, delay = 0, direction = 0) {
  const time = clampProgress(progress)
  if (direction === 0) return time
  const start = Math.max(0, Math.min(0.4, delay))
  const end = Math.min(0.98, start + 0.6)
  const amount = smoothstep(((direction > 0 ? time : 1 - time) - start) / (end - start))
  return direction > 0 ? amount : 1 - amount
}

// The shader and Canvas fallback use the same deterministic movement. Read all
// coordinates before writing so navigation can snapshot directly into either
// existing buffer without allocating a second cloud.
export function sampleMorph(source, target, progress, delays, direction, destination = new Float32Array(source.length)) {
  for (let offset = 0, index = 0; offset < source.length; offset += 3, index++) {
    const amount = particleProgress(progress, delays?.[index] ?? 0, direction)
    const sourceX = source[offset], sourceY = source[offset + 1], sourceZ = source[offset + 2]
    const targetX = target[offset], targetY = target[offset + 1], targetZ = target[offset + 2]
    let sweepX = 0, sweepY = 0, sweepZ = 0
    if (direction !== 0 && amount > 0 && amount < 1) {
      const seed = (index * 0.61803398875) % 1
      const wave = Math.sin(Math.PI * amount)
      const sine = Math.sin(seed * TAU)
      sweepX = wave * 0.025 * (0.4 + 0.6 * sine)
      sweepY = wave * 0.012 * Math.cos(seed * TAU)
      sweepZ = wave * 0.018 * sine
    }
    destination[offset] = sourceX + (targetX - sourceX) * amount + sweepX
    destination[offset + 1] = sourceY + (targetY - sourceY) * amount + sweepY
    destination[offset + 2] = sourceZ + (targetZ - sourceZ) * amount + sweepZ
  }
  return destination
}

export function sampleMorphValues(source, target, progress, delays, direction, stride, destination = new Float32Array(source.length)) {
  for (let offset = 0; offset < source.length; offset += stride) {
    const amount = particleProgress(progress, delays?.[offset / stride] ?? 0, direction)
    for (let component = 0; component < stride; component++) {
      const index = offset + component
      destination[index] = source[index] + (target[index] - source[index]) * amount
    }
  }
  return destination
}

// Match latitude ranks first, then longitude within small latitude bands. This
// runs only when constructing targets, and remaps metadata with each point.
export function matchBalloonToGlobe(globe, balloon) {
  const globePositions = globe.positions ?? globe
  const count = globePositions.length / 3
  if (!Number.isInteger(count) || count < 1 || balloon.positions.length !== globePositions.length) {
    throw new RangeError('Globe and balloon must contain the same number of positions.')
  }
  const globeIndices = Array.from({ length: count }, (_, index) => index)
  const balloonIndices = globeIndices.slice()
  const byLatitude = (positions) => (first, second) => positions[first * 3 + 1] - positions[second * 3 + 1] || first - second
  const byAzimuth = (positions) => (first, second) => Math.atan2(positions[first * 3], positions[first * 3 + 2]) -
    Math.atan2(positions[second * 3], positions[second * 3 + 2]) || first - second
  globeIndices.sort(byLatitude(globePositions))
  balloonIndices.sort(byLatitude(balloon.positions))
  const matched = { ...balloon }
  const attributes = Object.entries(balloon).filter(([, values]) => ArrayBuffer.isView(values) &&
    values.length % count === 0 && values.length >= count)
  for (const [name, values] of attributes) matched[name] = new values.constructor(values.length)
  const globeAzimuth = byAzimuth(globePositions)
  const balloonAzimuth = byAzimuth(balloon.positions)
  for (let start = 0; start < count; start += 48) {
    const end = Math.min(count, start + 48)
    const globeBand = globeIndices.slice(start, end).sort(globeAzimuth)
    const balloonBand = balloonIndices.slice(start, end).sort(balloonAzimuth)
    for (let rank = 0; rank < globeBand.length; rank++) {
      const globeIndex = globeBand[rank]
      const balloonIndex = balloonBand[rank]
      for (const [name, values] of attributes) {
        const stride = values.length / count
        for (let component = 0; component < stride; component++) {
          matched[name][globeIndex * stride + component] = values[balloonIndex * stride + component]
        }
      }
    }
  }
  return matched
}

// x/y describe the square's top-left corner; interpolate its center so a size
// change does not distort the arc. Keep the backing size stable until arrival.
export function placementAt(from, to, progress, direction, out = {}) {
  const time = clampProgress(progress)
  const amount = smoothstep(time)
  const fromX = from.x, fromY = from.y, fromSize = from.size, fromBacking = from.backing
  const toX = to.x, toY = to.y, toSize = to.size, toBacking = to.backing
  const arc = direction === 0 || time === 0 || time === 1 ? 0 : Math.sin(Math.PI * time)
  const size = (fromSize + (toSize - fromSize) * amount) * (1 - arc * 0.08)
  const centerX = fromX + fromSize / 2 + (toX + toSize / 2 - fromX - fromSize / 2) * amount
  const centerY = fromY + fromSize / 2 + (toY + toSize / 2 - fromY - fromSize / 2) * amount -
    Math.min(fromSize, toSize) * 0.13 * arc
  out.x = time === 0 ? fromX : time === 1 ? toX : centerX - size / 2
  out.y = time === 0 ? fromY : time === 1 ? toY : centerY - size / 2
  out.size = time === 0 ? fromSize : time === 1 ? toSize : size
  out.backing = time === 1 ? toBacking : fromBacking
  return out
}
