import { CONS } from '../data/astronomyCatalog.js'
import { journeyConstellations } from '../data/journeyConstellations.js'
import { constellationView, projectSky } from './skyProjection.js'
import { createJourneyTarget } from './journeyTarget.js'
import { useMemo } from 'react'
import { createShapeTargets, smoothProgress, visualState } from './shapeTargets.js'

export default function StaticFallback({ section, journeyView }) {
  const targets = useMemo(() => createShapeTargets(1800), [])
  const state = visualState(section)
  const code = journeyConstellations[journeyView?.index ?? 0].con
  const { positions, style } = state === 'journey' ? createJourneyTarget(1800, code) : targets[state]
  const dots = []
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = positions.subarray(i, i + 3)
    const brightness = style[i / 3 * 2]
    const accent = style[i / 3 * 2 + 1]
    const depth = 0.35 + 0.65 * smoothProgress((z + 0.35) / 1.2)
    const projectDepth = 0.20 + 0.80 * smoothProgress((z + 0.52) / 1.04)
    dots.push(<circle key={i} cx={150 + x * 118} cy={150 - y * 118} r={state === 'projects' ? 0.32 : accent ? 1.3 : 0.95} fill={accent ? '#dc8079' : '#ece1d3'} opacity={brightness * (state === 'home' ? depth : state === 'projects' ? projectDepth : 1)} />)
  }
  if (state === 'journey') {
    const view = constellationView(CONS[code]);
    for (const [index, line] of CONS[code].l.entries()) {
      const points = [];
      for (let i = 0; i < line.length; i += 2) {
        const point = projectSky(line[i], line[i + 1], view);
        if (point) points.push(`${150 + point[0] * 118},${150 - point[1] * 118}`);
      }
      dots.push(<polyline key={`line-${index}`} points={points.join(' ')} fill="none" stroke="#f6ddd0" strokeWidth=".45" strokeDasharray=".3 .8" />);
    }
  }
  return <svg className="particle-fallback" viewBox="0 0 300 300" aria-hidden="true" focusable="false">{dots}</svg>
}
