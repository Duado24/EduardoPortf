// Original technical contours. No fonts, icon assets, emoji or scene objects.
function line(start, end, width = 0.075, accent = 0) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  return { kind: 'line', start, end, length: Math.hypot(dx, dy), width, accent }
}

function polyline(points, width = 0.075, accent = 0) {
  return points.slice(1).map((end, index) => line(points[index], end, width, accent))
}

function circle(center, radius, width = 0.075, accent = 0) {
  return { kind: 'circle', center, radius, length: Math.PI * 2 * radius, width, accent }
}

function roundedFrame(left, bottom, right, top, radius = 0.1, width = 0.075) {
  const points = []
  for (const [cx, cy, start] of [
    [right - radius, top - radius, 0],
    [left + radius, top - radius, Math.PI / 2],
    [left + radius, bottom + radius, Math.PI],
    [right - radius, bottom + radius, Math.PI * 1.5],
  ]) {
    for (let i = 0; i <= 12; i++) {
      const angle = start + i / 12 * Math.PI / 2
      points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius])
    }
  }
  points.push(points[0])
  return polyline(points, width)
}

const projectStrokes = [
  // A restrained hot-air balloon: rounded envelope, suspension, house basket.
  ...polyline([
    [0, 0.98], [-0.37, 0.9], [-0.63, 0.69], [-0.76, 0.36],
    [-0.72, 0.09], [-0.55, -0.12], [-0.31, -0.23],
    [0.31, -0.23], [0.55, -0.12], [0.72, 0.09],
    [0.76, 0.36], [0.63, 0.69], [0.37, 0.9], [0, 0.98],
  ], 0.055),
  line([-0.31, -0.23], [-0.23, -0.58], 0.035),
  line([0.31, -0.23], [0.23, -0.58], 0.035),
  line([-0.13, -0.23], [-0.12, -0.49], 0.025),
  line([0.13, -0.23], [0.12, -0.49], 0.025),
  ...polyline([[-0.28, -0.59], [0, -0.47], [0.28, -0.59], [0.23, -0.9], [-0.23, -0.9], [-0.28, -0.59]], 0.055),
]

const journeyStrokes = [
  ...polyline([[-0.86, -0.65], [-0.84, -0.35], [-0.65, -0.1], [-0.34, 0.01], [-0.12, 0.27], [0.21, 0.32], [0.48, 0.62], [0.8, 0.8]], 0.065),
  circle([-0.86, -0.65], 0.095, 0.05),
  circle([-0.34, 0.01], 0.09, 0.05),
  circle([0.21, 0.32], 0.09, 0.05),
  circle([0.8, 0.8], 0.095, 0.05, 0.6),
  circle([0.5, -0.51], 0.34, 0.055),
  ...polyline([[0.63, -0.24], [0.4, -0.52], [0.37, -0.78], [0.61, -0.5], [0.63, -0.24]], 0.065),
  line([0.28, -0.51], [0.34, -0.51], 0.035),
  line([0.66, -0.51], [0.72, -0.51], 0.035),
]

const skillStrokes = [
  ...roundedFrame(-0.5, -0.5, 0.5, 0.5, 0.075, 0.065),
  ...polyline([[-0.23, 0.2], [0.23, 0.2], [0.23, -0.2], [-0.23, -0.2], [-0.23, 0.2]], 0.05),
  line([-0.23, 0.2], [0.23, -0.2], 0.045),
  ...[-0.23, 0.23].flatMap((x) => [-0.2, 0.2].map((y) => circle([x, y], 0.055, 0.04))),
  ...[-0.32, -0.11, 0.11, 0.32].flatMap((coordinate) => [
    line([-0.5, coordinate], [-0.82, coordinate], 0.055),
    line([0.5, coordinate], [0.82, coordinate], 0.055),
    line([coordinate, -0.5], [coordinate, -0.82], 0.055),
    line([coordinate, 0.5], [coordinate, 0.82], 0.055),
  ]),
  ...[-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [
    line([x * 0.45, y * 0.45], [x * 0.82, y * 0.82], 0.055),
    circle([x * 0.88, y * 0.88], 0.065, 0.045),
  ])),
]

const contactStrokes = [
  ...roundedFrame(-0.97, -0.64, 0.97, 0.64, 0.09, 0.075),
  ...polyline([[-0.9, 0.58], [0, -0.04], [0.9, 0.58]], 0.075),
  line([-0.9, -0.58], [-0.26, -0.03], 0.07),
  line([0.9, -0.58], [0.26, -0.03], 0.07),
]

const contours = {
  projects: projectStrokes,
  journey: journeyStrokes,
  skills: skillStrokes,
  contact: contactStrokes,
}

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

export function createSymbolTarget(state, count) {
  const strokes = contours[state]
  if (!strokes) throw new RangeError('Unknown technical contour.')
  const positions = new Float32Array(count * 3)
  const style = new Float32Array(count * 2)
  const total = strokes.reduce((sum, stroke) => sum + stroke.length, 0)
  for (let i = 0; i < count; i++) {
    let distance = radicalInverse(i + 1, 2) * total
    let stroke = strokes[strokes.length - 1]
    for (const candidate of strokes) {
      if (distance <= candidate.length) {
        stroke = candidate
        break
      }
      distance -= candidate.length
    }
    const t = distance / stroke.length
    const offset = (radicalInverse(i + 1, 3) - 0.5) * stroke.width
    let x, y
    if (stroke.kind === 'circle') {
      const angle = t * Math.PI * 2
      x = stroke.center[0] + Math.cos(angle) * (stroke.radius + offset)
      y = stroke.center[1] + Math.sin(angle) * (stroke.radius + offset)
    } else {
      const dx = stroke.end[0] - stroke.start[0]
      const dy = stroke.end[1] - stroke.start[1]
      x = stroke.start[0] + dx * t - dy / stroke.length * offset
      y = stroke.start[1] + dy * t + dx / stroke.length * offset
    }
    positions.set([x, y, (radicalInverse(i + 1, 5) - 0.5) * 0.055], i * 3)
    style.set([0.45 + radicalInverse(i + 1, 7) * 0.4, stroke.accent], i * 2)
  }
  return { positions, style }
}
