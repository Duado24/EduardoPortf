import { useMemo } from 'react'
import { createShapeTargets, smoothProgress, visualState } from './shapeTargets.js'

export default function StaticFallback({ section }) {
  const targets = useMemo(() => createShapeTargets(1800), [])
  const state = visualState(section)
  const { positions, style } = targets[state]
  const dots = []
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = positions.subarray(i, i + 3)
    const brightness = style[i / 3 * 2]
    const accent = style[i / 3 * 2 + 1]
    const depth = 0.35 + 0.65 * smoothProgress((z + 0.35) / 1.2)
    const projectDepth = 0.20 + 0.80 * smoothProgress((z + 0.52) / 1.04)
    dots.push(<circle key={i} cx={150 + x * 118} cy={150 - y * 118} r={state === 'projects' ? 0.32 : accent ? 1.3 : 0.95} fill={accent ? '#dc8079' : '#ece1d3'} opacity={brightness * (state === 'home' ? depth : state === 'projects' ? projectDepth : 1)} />)
  }
  return <svg className="particle-fallback" viewBox="0 0 300 300" aria-hidden="true" focusable="false">{dots}</svg>
}
