// Contact target: a dot-matrix board (after original prototype).
// Every dot is one of the shared particles. Random dim letters fill the grid; the
// message "READY TO / CONNECT?" is set at double size on desktop. The board is placed
// per viewport inside the full-screen region Contact shares with Journey and Skills,
// and ContactSection.jsx positions its links and hover block from the same layout.

const GLYPHS = Object.fromEntries(Object.entries({
  A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110',
  C: '01110,10001,10000,10000,10000,10001,01110', D: '11110,10001,10001,10001,10001,10001,11110',
  E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000',
  G: '01110,10001,10000,10111,10001,10001,01111', H: '10001,10001,10001,11111,10001,10001,10001',
  I: '01110,00100,00100,00100,00100,00100,01110', J: '00111,00010,00010,00010,00010,10010,01100',
  K: '10001,10010,10100,11000,10100,10010,10001', L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001', N: '10001,11001,10101,10011,10001,10001,10001',
  O: '01110,10001,10001,10001,10001,10001,01110', P: '11110,10001,10001,11110,10000,10000,10000',
  R: '11110,10001,10001,11110,10100,10010,10001', S: '01111,10000,10000,01110,00001,00001,11110',
  T: '11111,00100,00100,00100,00100,00100,00100', U: '10001,10001,10001,10001,10001,10001,01110',
  V: '10001,10001,10001,10001,10001,01010,00100', W: '10001,10001,10001,10101,10101,11011,10001',
  X: '10001,10001,01010,00100,01010,10001,10001', Y: '10001,10001,01010,00100,00100,00100,00100',
  Z: '11111,00001,00010,00100,01000,10000,11111', '?': '01110,10001,00001,00010,00100,00000,00100',
}).map(([letter, rows]) => [letter, rows.split(',').flatMap((row, y) => [...row].flatMap((bit, x) => bit === '1' ? [[x, y]] : []))]))
const FILLER = 'ABCDEFGHIJKLMNOPRSTUVWXYZ'
export const BOARD_MESSAGE = ['READY TO', 'CONNECT?']
// Dot kinds read by both renderers.
export const BOARD_KINDS = { dim: 0, lit: 1, frame: 2, glow: 3, hidden: 4 }
// Hover block, in cells: 5 wide, 3 tall, centered on the cell under the pointer.
export const HOVER_SPAN = [5, 3]

function seeded(seed) {
  let state = seed >>> 0
  return () => (state = (state * 1664525 + 1013904223) >>> 0) / 4294967296
}

/**
 * Board geometry in CSS px, relative to the center of the square sky region (which
 * is centered on the viewport on desktop; on phones it sits under the heading).
 * Desktop: about half the width, a little below center, message at double size.
 * Phones: full width with a smaller grid. `camera` converts px to shared camera units.
 */
export function boardLayout({ width, height }) {
  const mobile = width <= 760
  const narrow = !mobile && width <= 1100
  const cols = mobile ? 12 : 24
  const rows = mobile ? 8 : 10
  const aspect = cols / (rows * 1.5)
  let boardWidth, centerY
  if (mobile) {
    boardWidth = Math.min(width - 32, 420)
    centerY = 0
  } else if (narrow) {
    boardWidth = Math.min(width * 0.82, height * 0.44 * aspect)
    centerY = (0.47 - 0.5) * height
  } else {
    boardWidth = Math.min(width * 0.54, 900, height * 0.62 * aspect)
    centerY = (0.53 - 0.5) * height
  }
  const cellW = boardWidth / cols
  const cellH = cellW * 1.5
  const side = mobile ? Math.max(width, 400) : Math.max(width, height)
  return {
    cols, rows, cellW, cellH, scale: mobile ? 1 : 2,
    left: -boardWidth / 2, top: centerY - rows * cellH / 2,
    width: boardWidth, height: rows * cellH,
    camera: 2.4 / side,
  }
}

/** Keeps the 5×3 hover block inside the board. */
export function hoverCell(layout, col, row) {
  return [
    Math.min(layout.cols - 1 - (HOVER_SPAN[0] - 1) / 2, Math.max((HOVER_SPAN[0] - 1) / 2, col)),
    Math.min(layout.rows - 1 - (HOVER_SPAN[1] - 1) / 2, Math.max((HOVER_SPAN[1] - 1) / 2, row)),
  ]
}

/**
 * `count` particles: lit message dots first, then dim letters (shuffled, so a smaller
 * budget thins them evenly), the board frame, a soft glow under the message, and any
 * spare particles hidden on existing dots. `board` = cell col, cell row, kind, glyph row.
 * `grid` = board origin and cell size in camera units, for the hover block.
 */
export function createBoardTarget(count, layout = boardLayout({ width: 1440, height: 810 })) {
  const { cols, rows, cellW, cellH, scale, left, top, camera } = layout
  const random = seeded(7)
  const cellOf = (x, y) => [Math.min(cols - 1, Math.max(0, Math.floor((x - left) / cellW))), Math.min(rows - 1, Math.max(0, Math.floor((y - top) / cellH)))]

  const lit = []
  const covered = new Set()
  const firstRow = Math.floor((rows - BOARD_MESSAGE.length * scale) / 2)
  BOARD_MESSAGE.forEach((line, lineIndex) => {
    const firstCol = Math.floor((cols - line.length * scale) / 2)
    ;[...line].forEach((letter, index) => {
      const col = firstCol + index * scale
      const row = firstRow + lineIndex * scale
      for (let dx = 0; dx < scale; dx++) for (let dy = 0; dy < scale; dy++) covered.add((row + dy) * cols + col + dx)
      if (letter === ' ') return
      const pitch = scale * cellW / 6.4
      const x0 = left + col * cellW + (scale * cellW - 4 * pitch) / 2
      const y0 = top + row * cellH + (scale * cellH - 6 * pitch) / 2
      for (const [gx, gy] of GLYPHS[letter]) {
        const x = x0 + gx * pitch
        const y = y0 + gy * pitch
        lit.push({ x, y, cell: cellOf(x, y), glyphRow: gy, size: 2 * Math.max(0.75, pitch * 0.33) })
      }
    })
  })

  const dim = []
  const pitch = cellW / 6.4
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (covered.has(row * cols + col)) continue
      const letter = FILLER[Math.floor(random() * FILLER.length)]
      const x0 = left + col * cellW + (cellW - 4 * pitch) / 2
      const y0 = top + row * cellH + (cellH - 6 * pitch) / 2
      for (const [gx, gy] of GLYPHS[letter]) {
        dim.push({ x: x0 + gx * pitch, y: y0 + gy * pitch, cell: [col, row], glyphRow: gy, size: 1.8 * Math.max(0.75, pitch * 0.33), key: random() })
      }
    }
  }
  dim.sort((a, b) => a.key - b.key)

  // A dotted rounded frame just outside the grid, sized to whatever budget remains.
  const litCount = Math.min(lit.length, count)
  const dimCount = Math.min(dim.length, count - litCount)
  const pad = cellW * 0.35
  const radius = cellW * 0.45
  const fx0 = left - pad, fy0 = top - pad, fw = layout.width + pad * 2, fh = layout.height + pad * 2
  const straight = 2 * (fw + fh - 4 * radius)
  const perimeter = straight + 2 * Math.PI * radius
  const frameCount = Math.max(0, Math.min(Math.round(perimeter / (pitch * 1.25)), count - litCount - dimCount))
  const frame = Array.from({ length: frameCount }, (_, index) => {
    let d = (index / frameCount) * perimeter
    const edges = [fw - 2 * radius, Math.PI * radius / 2, fh - 2 * radius, Math.PI * radius / 2, fw - 2 * radius, Math.PI * radius / 2, fh - 2 * radius, Math.PI * radius / 2]
    const corners = [[fx0 + fw - radius, fy0 + radius, -Math.PI / 2], [fx0 + fw - radius, fy0 + fh - radius, 0], [fx0 + radius, fy0 + fh - radius, Math.PI / 2], [fx0 + radius, fy0 + radius, Math.PI]]
    let x = fx0 + radius, y = fy0
    for (let e = 0; e < 8; e++) {
      if (d > edges[e]) { d -= edges[e]; continue }
      const side = e >> 1
      if (e % 2 === 0) {
        x = [fx0 + radius + d, fx0 + fw, fx0 + fw - radius - d, fx0][side]
        y = [fy0, fy0 + radius + d, fy0 + fh, fy0 + fh - radius - d][side]
      } else {
        const [cx, cy, start] = corners[side]
        const angle = start + d / radius
        x = cx + Math.cos(angle) * radius
        y = cy + Math.sin(angle) * radius
      }
      break
    }
    return { x, y, cell: cellOf(x, y), glyphRow: 0, size: 1.5 * Math.max(0.75, pitch * 0.33) }
  })

  const positions = new Float32Array(count * 3)
  const style = new Float32Array(count * 2)
  const sizes = new Float32Array(count)
  const board = new Float32Array(count * 4)
  const write = (i, dot, kind, brightness, accent, sizeFactor = 1) => {
    positions.set([dot.x * camera, -dot.y * camera, 0], i * 3)
    style.set([brightness, accent], i * 2)
    // Shared renderer points are about 2.15 CSS px at size 1.
    sizes[i] = dot.size * sizeFactor / 2.15
    board.set([dot.cell[0], dot.cell[1], kind, dot.glyphRow], i * 4)
  }
  let i = 0
  for (let k = 0; k < litCount; k++) write(i++, lit[k], BOARD_KINDS.lit, 0.95, 0)
  for (let k = 0; k < dimCount; k++) write(i++, dim[k], BOARD_KINDS.dim, 0.16, 0)
  for (const dot of frame) write(i++, dot, BOARD_KINDS.frame, 0.3, 0)
  for (let k = 0; i < count && k < litCount; k++) write(i++, lit[k], BOARD_KINDS.glow, 0.14, 1, 1.8)
  const spare = dim.length ? dim : lit
  for (let k = 0; i < count; k++) write(i++, spare[k % spare.length], BOARD_KINDS.hidden, 0, 0)

  return {
    positions, style, sizes, board,
    grid: [left * camera, -top * camera, cellW * camera, cellH * camera],
  }
}

/** CPU mirror of the board shading in the WebGL vertex shader, for the Canvas2D renderer:
 * out = [x shift in cells, alpha, size factor, color (0 cream, 1 coral, 2 red, 3 white)]. */
export function boardShade(board, i, time, hover, targetX, grid, out) {
  const col = board[i * 4], row = board[i * 4 + 1], kind = board[i * 4 + 2], glyphRow = board[i * 4 + 3]
  const hash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
  let alpha = 0
  out[0] = 0
  out[2] = 1
  out[3] = 0
  if (kind === BOARD_KINDS.dim) {
    const u = (time / 53 + hash(col, row)) % 1
    alpha = 0.16 + 0.5 * Math.sin(Math.min(1, u * 53 / 2.2) * Math.PI)
  } else if (kind === BOARD_KINDS.lit) {
    alpha = 0.9 + 0.1 * Math.sin(time * 2.4 + (i * 0.61803398875 % 1) * 20)
  } else if (kind === BOARD_KINDS.frame) {
    alpha = 0.3
  } else if (kind === BOARD_KINDS.glow) {
    alpha = 0.14
    out[3] = 1
  }
  const [hoverCol, hoverRow, strength] = hover
  if (strength > 0.01 && kind <= BOARD_KINDS.lit && Math.abs(col - hoverCol) <= 2 && Math.abs(row - hoverRow) <= 1) {
    const step = Math.floor(time * 14)
    const line = row * 7 + glyphRow
    const r = hash(line, step), r2 = hash(line + 99, Math.floor(step / 3))
    out[0] = ((r - 0.5) * (r > 0.86 ? 0.9 : 0.18) + (r2 > 0.93 ? -0.45 : 0)) * strength
    const across = (targetX - (grid[0] + (hoverCol - 2) * grid[2])) / (5 * grid[2])
    out[3] = across < 1 / 3 || across > 2 / 3 ? 2 : 3
    alpha = (kind === BOARD_KINDS.dim ? 0.45 : 1) * (0.6 + 0.4 * strength)
    if (glyphRow % 2 === 1) alpha *= 0.55
    alpha *= 1 + 0.35 * (hash(step, 3) - 0.5)
    out[2] = 1 + 0.2 * strength
  }
  out[1] = Math.min(1, alpha)
  return out
}
