import { useEffect, useRef, useState } from 'react'
import StaticFallback from '../particles/StaticFallback.jsx'
import { canvasRendererReason } from '../particles/capabilities.js'

export default function ParticleStage({ section, motionPaused = false, reducedMotion = false, onRendererChange }) {
  const containerRef = useRef(null)
  const webglCanvasRef = useRef(null)
  const fallbackCanvasRef = useRef(null)
  const rendererRef = useRef(null)
  const propertiesRef = useRef({ section, motionPaused, reducedMotion })
  const [status, setStatus] = useState({ mode: 'static', reason: 'loading' })
  const available = status.mode !== 'static'

  useEffect(() => {
    onRendererChange?.(status.mode)
  }, [status.mode, onRendererChange])

  useEffect(() => {
    propertiesRef.current = { section, motionPaused, reducedMotion }
    rendererRef.current?.setMotionPreferences(motionPaused, reducedMotion)
    rendererRef.current?.setSection(section)
  }, [section, motionPaused, reducedMotion])

  useEffect(() => {
    let active = true
    let renderer
    setStatus({ mode: 'static', reason: reducedMotion ? 'reduced-motion' : 'loading' })
    if (reducedMotion) return undefined
    const canvasReason = canvasRendererReason()
    let fallingBack = false

    async function startCanvas(reason) {
      if (!active || fallingBack) return
      fallingBack = true
      renderer?.destroy()
      rendererRef.current = null
      setStatus({ mode: 'static', reason: 'loading' })
      try {
        const { createCanvasParticleRenderer } = await import('../particles/CanvasParticleRenderer.js')
        if (!active) return
        renderer = createCanvasParticleRenderer({
          canvas: fallbackCanvasRef.current,
          container: containerRef.current,
          ...propertiesRef.current,
          lowPower: Boolean(canvasReason),
        })
        rendererRef.current = renderer
        setStatus({ mode: 'canvas', reason })
      } catch {
        if (active) setStatus({ mode: 'static', reason: 'unavailable' })
      }
    }

    // HTML and a static geographic preview paint before either renderer loads.
    if (canvasReason) {
      startCanvas(canvasReason)
    } else {
      import('../particles/ParticleRenderer.js').then(({ createParticleRenderer }) => {
        if (!active) return
        renderer = createParticleRenderer({
          canvas: webglCanvasRef.current,
          container: containerRef.current,
          ...propertiesRef.current,
          onUnavailable: startCanvas,
        })
        if (!active) {
          renderer.destroy()
          return
        }
        rendererRef.current = renderer
        setStatus({ mode: 'webgl', reason: null })
      }).catch(() => startCanvas('webgl-unavailable'))
    }

    return () => {
      active = false
      renderer?.destroy()
      rendererRef.current = null
    }
  }, [reducedMotion])

  return (
    <div className="particle-stage" ref={containerRef} aria-hidden="true" data-renderer={status.mode} data-renderer-reason={status.reason || undefined}>
      <canvas className="particle-canvas particle-webgl-canvas" ref={webglCanvasRef} hidden={status.mode !== 'webgl'} />
      <canvas className="particle-canvas particle-2d-canvas" ref={fallbackCanvasRef} hidden={status.mode !== 'canvas'} />
      {!available && <StaticFallback section={section} />}
    </div>
  )
}
