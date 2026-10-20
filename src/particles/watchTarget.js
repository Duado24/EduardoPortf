// Skills target: "The Last Watch", a knight resting beside a campfire.
// Its 5,600 world-space samples are stored in watch-samples.json.
// One fixed camera, mirrored so the knight sits left of the fire. Solid parts are lit
// by the flickering fire; flame, sparks, smoke and dust move in world space.
// The WebGL vertex shader mirrors watchShade() exactly.
import samples from './watch-samples.json' with { type: 'json' }

export const WATCH_KINDS = samples.kindNames
const { ground, flame, spark, smoke, metal, cloth, wood, ember } = WATCH_KINDS
const TOTAL = samples.kinds.length
const CAMERA_TARGET = [0.9, 0.56, 0.14]
const YAW = -0.16
const PITCH = 0.28
const LIGHT = [0, 0.32, 0]
// Point size relative to the shared renderer's base point size: the reference's 0.61,
// scaled up because the portfolio shows the knight larger with the same 5,600 points.
const SIZE = 0.95

export const WATCH_CAMERA = {
  target: CAMERA_TARGET,
  rotation: [Math.cos(YAW), Math.sin(YAW), Math.cos(PITCH), Math.sin(PITCH)],
}

/** Reference camera, unscaled: view x (mirrored), view y (up), perspective w. */
function view(x, y, z, out) {
  const [cy, sy, cp, sp] = WATCH_CAMERA.rotation
  x -= CAMERA_TARGET[0]
  y -= CAMERA_TARGET[1]
  z -= CAMERA_TARGET[2]
  const rx = x * cy + z * sy
  const rz = -x * sy + z * cy
  const qy = y * cp - rz * sp
  const qz = y * sp + rz * cp
  const w = 4.6 + qz
  out[0] = -rx / w
  out[1] = qy / w
  out[2] = w
  out[3] = qz
  return out
}

// Static per-sample values: view position, perspective, fire light before flicker,
// and depth alpha (negative when the surface faces away from the camera).
const restX = new Float32Array(TOTAL)
const restY = new Float32Array(TOTAL)
const restW = new Float32Array(TOTAL)
const light = new Float32Array(TOTAL)
const depth = new Float32Array(TOTAL)
const BOX = [Infinity, Infinity, -Infinity, -Infinity]
let horizonY = -Infinity
{
  const out = [0, 0, 0, 0]
  const camera = [CAMERA_TARGET[0] + 4.6 * Math.sin(YAW), 0.9, CAMERA_TARGET[2] - 4.6 * Math.cos(YAW)]
  for (let i = 0; i < TOTAL; i++) {
    const [x, y, z] = samples.positions.slice(i * 3, i * 3 + 3)
    const [nx, ny, nz] = samples.normals.slice(i * 3, i * 3 + 3)
    const kind = samples.kinds[i]
    view(x, y, z, out)
    restX[i] = out[0]
    restY[i] = out[1]
    restW[i] = out[2]
    const lx = LIGHT[0] - x, ly = LIGHT[1] - y, lz = LIGHT[2] - z
    const distance = Math.hypot(lx, ly, lz) || 1
    let facing = (nx * lx + ny * ly + nz * lz) / distance
    facing = kind === cloth ? Math.abs(facing) : Math.max(0, facing)
    light[i] = Math.min(1, facing) * 4 / (0.6 + distance * distance * 2.2) * 0.8
    const vx = camera[0] - x, vy = camera[1] - y, vz = camera[2] - z
    const away = nx * vx + ny * vy + nz * vz < 0
    const alpha = Math.min(1, Math.max(0.12, 0.55 - out[3] * 0.4))
    depth[i] = away ? -alpha : alpha
    // The composition box: knight, logs, embers and the stone ring, plus the flame column.
    const nearFire = Math.hypot(x - 0.38, z + 0.02) < 0.8
    if (kind === metal || kind === cloth || kind === wood || kind === ember || kind === ground && nearFire) {
      BOX[0] = Math.min(BOX[0], out[0]); BOX[1] = Math.min(BOX[1], out[1])
      BOX[2] = Math.max(BOX[2], out[0]); BOX[3] = Math.max(BOX[3], out[1])
    }
    if (kind === ground && Math.hypot(x, z) <= 2.6) horizonY = Math.max(horizonY, out[1])
  }
  view(0.38, 0.95, -0.02, out)
  BOX[3] = Math.max(BOX[3], out[1])
}
const BOX_WIDTH = BOX[2] - BOX[0]
const BOX_HEIGHT = BOX[3] - BOX[1]
const BOX_CENTER = [(BOX[0] + BOX[2]) / 2, (BOX[1] + BOX[3]) / 2]

/**
 * Where the scene sits in the shared camera (±1.2 across the square sky region,
 * centered on the viewport). Desktop: between the intro and the inventory, low in the
 * frame. Phones: full width, in the lower half of the 400px sky band. Returns offset
 * and scale (camera units per view unit), the sky horizon (CSS px below the band
 * center) and the descent lift (camera units).
 *
 * The region's size comes from the viewport, matching SkillsSection.css, never from
 * the live element: during arrival that element is still animating from the previous
 * section's square.
 */
export function watchLayout({ width, height }) {
  const ratio = BOX_WIDTH / BOX_HEIGHT
  const mobile = width <= 760
  const side = mobile ? Math.max(width, 400) : Math.max(width, height)
  let span, offsetX, offsetY
  if (mobile) {
    span = Math.min(width * 0.96, 270 * ratio)
    offsetX = 0
    offsetY = 58
  } else if (width <= 900) {
    span = Math.min(width * 0.7, height * 0.5 * ratio)
    offsetX = 0
    offsetY = (0.38 - 0.5) * height
  } else {
    span = Math.min(width * 0.5, height * 0.62 * ratio, 900)
    offsetX = (0.46 - 0.5) * width
    offsetY = (0.58 - 0.5) * height
  }
  const pixels = span / BOX_WIDTH
  const camera = 2.4 / side
  const scale = pixels * camera
  return {
    x: offsetX * camera - BOX_CENTER[0] * scale,
    y: -offsetY * camera - BOX_CENTER[1] * scale,
    scale,
    horizon: offsetY - (horizonY - BOX_CENTER[1]) * pixels,
    lift: 0.42 * (mobile ? 400 : height) * camera,
  }
}

/**
 * Writes camera positions for the first positions.length / 3 samples. Far ground and
 * dust spill past the region like Journey's sky; they stay finite within ±4.
 */
export function placeWatch(layout, positions) {
  for (let i = 0; i < positions.length / 3; i++) {
    positions[i * 3] = clamp(layout.x + restX[i] * layout.scale, -4, 4)
    positions[i * 3 + 1] = clamp(layout.y + restY[i] * layout.scale, -4, 4)
  }
  return positions
}

/**
 * Prefix of `count` samples (the baked order keeps every prefix representative).
 * `watchA` = kind, seed, tone, static light; `watchB` = world xyz, signed depth alpha.
 */
export function createWatchTarget(count, layout = watchLayout({ width: 1440, height: 810 })) {
  if (count > TOTAL) throw new RangeError('The Last Watch has 5,600 samples.')
  const positions = new Float32Array(count * 3)
  const style = new Float32Array(count * 2)
  const sizes = new Float32Array(count)
  const watchA = new Float32Array(count * 4)
  const watchB = new Float32Array(count * 4)
  const out = [0, 0, 0, 1, 0]
  for (let i = 0; i < count; i++) {
    const kind = samples.kinds[i]
    watchA.set([kind, samples.seeds[i], samples.tones[i], light[i]], i * 4)
    watchB.set([...samples.positions.slice(i * 3, i * 3 + 3), depth[i]], i * 4)
    positions[i * 3 + 2] = depth[i] * 0.05
    // Resting appearance (no flicker, no flare) so the arrival matches the first lit frame.
    watchShade(watchA, watchB, i, 0, 0, out)
    style[i * 2] = kind === flame ? 0.5 : kind === spark ? 0.25 : kind === smoke ? 0.05 : out[2]
    sizes[i] = SIZE * 1.05 * 4.6 / restW[i]
  }
  placeWatch(layout, positions)
  return { positions, style, sizes, watchA, watchB }
}

/** Reference flare: a soft automatic swell every nine seconds, or a stoke (0–1) on selection. */
export function watchFlare(time, stoke) {
  const phase = (time % 9) / 9
  const auto = phase < 0.06 ? phase / 0.06 * 0.3 : 0.3 * Math.exp(-(phase - 0.06) * 6)
  return Math.max(auto, stoke)
}

const fract = (value) => value - Math.floor(value)
const clamp = (value, low, high) => Math.min(high, Math.max(low, value))
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Shading and motion for sample i at `time`: out = [view dx, view dy, alpha, size factor,
 * flame mix].
 */
export function watchShade(watchA, watchB, i, time, flare, out) {
  const kind = watchA[i * 4]
  const seed = watchA[i * 4 + 1]
  const tone = watchA[i * 4 + 2]
  const intensity = (1 + 0.16 * Math.sin(time * 8.3) + 0.1 * Math.sin(time * 13.7 + 1) + 0.07 * Math.sin(time * 21 + 2)) * (1 + 0.35 * flare)
  out[0] = 0
  out[1] = 0
  out[3] = 1
  if (kind === ground || kind >= metal) {
    const lit = clamp(watchA[i * 4 + 3] * intensity, 0, 1)
    const signed = watchB[i * 4 + 3]
    const alpha = Math.abs(signed)
    let a = alpha * (0.26 + 0.74 * lit) * (signed < 0 ? 0.55 : 1) + (tone > 0.9 ? 0.12 * alpha : 0)
    if (kind === ground) a *= 0.6
    out[4] = smoothstep(0.5, 1, lit)
    if (kind === ember) {
      out[4] = 1
      a = clamp(0.7 + 0.3 * Math.sin(seed * 40 + time * 5), 0, 1)
    }
    out[2] = clamp(a, 0.07, 1)
    return out
  }
  const x0 = watchB[i * 4], y0 = watchB[i * 4 + 1], z0 = watchB[i * 4 + 2]
  let x = x0, y = y0, z = z0, size = 1.05
  if (kind === flame) {
    const phase = fract(time * (0.45 + 0.25 * fract(seed * 5.3)) + seed)
    const radius = Math.hypot(x0, z0)
    const height = (0.35 + 0.75 * (1 - clamp(radius / 0.21, 0, 1))) * (0.7 + 0.3 * fract(seed * 11)) * (1 + 0.6 * flare)
    y = 0.12 + phase * height
    x *= 1 - phase * 0.9
    z *= 1 - phase * 0.9
    x += 0.06 * phase * Math.sin(time * 5 + seed * 50 + phase * 7) + 0.03 * phase * phase * Math.sin(time * 2.3 + seed * 9)
    z += 0.06 * phase * Math.cos(time * 4.3 + seed * 37 + phase * 6) + 0.025 * phase * phase * Math.cos(time * 1.9 + seed * 13)
    out[2] = (1 - phase) * 0.95
    out[4] = clamp(phase * 1.5, 0, 1)
    size = 1.75 * (1 - phase * 0.45)
  } else if (kind === spark) {
    const phase = fract(time * 0.1 + seed)
    y = 0.2 + phase * (2.2 + 1.1 * flare)
    x += 0.5 * Math.sin(time * 0.8 + seed * 30) * phase + 0.2 * phase * phase
    z += 0.4 * Math.cos(time * 0.6 + seed * 20) * phase
    out[2] = (1 - phase) * (0.45 + 0.55 * Math.sin(time * 13 + seed * 80))
    out[4] = 1
    size = 1.2
  } else if (kind === smoke) {
    const phase = fract(time * 0.06 + seed)
    y = 0.7 + phase * 1.7
    x *= 1 + phase * 3
    z *= 1 + phase * 3
    x += 0.3 * Math.sin(time * 0.3 + seed * 10) * phase
    z += 0.2 * phase
    out[2] = 0.1 * Math.sin(phase * Math.PI)
    out[4] = 0
    size = 1.1
  } else {
    x += 0.12 * Math.sin(time * 0.2 + seed * 40)
    y += 0.12 * Math.sin(time * 0.17 + seed * 20)
    z += 0.12 * Math.cos(time * 0.15 + seed * 30)
    const warmth = 1 / (1 + 9 * ((x - LIGHT[0]) ** 2 + (y - LIGHT[1]) ** 2 + (z - LIGHT[2]) ** 2))
    out[2] = 0.14 + 0.45 * warmth
    out[4] = warmth
    size = 0.9
  }
  const moved = view(x, y, z, [0, 0, 0, 0])
  out[0] = moved[0] - restX[i]
  out[1] = moved[1] - restY[i]
  out[3] = size / 1.05 * restW[i] / moved[2]
  return out
}

