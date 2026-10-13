import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import StaticFallback from '../particles/StaticFallback.jsx'
import { canvasRendererReason } from '../particles/capabilities.js'

function placementBox(region) {
  const bounds = region.getBoundingClientRect()
  const parent = region.offsetParent.getBoundingClientRect()
  return {
    x: bounds.left - parent.left,
    y: bounds.top - parent.top,
    size: bounds.width,
    backing: region.offsetWidth,
  }
}

function clearPlacement(region) {
  for (const property of ['left', 'top', 'width', 'height', 'transform', 'transform-origin']) {
    region.style.removeProperty(property)
  }
}

export default function ParticleStage({ section, visualSection = section, motionPaused = false, reducedMotion = false, onRendererChange }) {
  const containerRef = useRef(null)
  const placementRef = useRef(null)
  const lastBoxRef = useRef(null)
  const lastVisualSectionRef = useRef(visualSection)
  const webglCanvasRef = useRef(null)
  const fallbackCanvasRef = useRef(null)
  const rendererRef = useRef(null)
  const propertiesRef = useRef({ section, motionPaused, reducedMotion })
  const [status, setStatus] = useState({ mode: 'static', reason: 'loading' })
  const available = status.mode !== 'static'

  const onMorphFrame = useCallback((progress) => {
    const placement = placementRef.current
    if (!placement) return
    const region = containerRef.current?.parentElement
    if (!region) return
    const interpolate = (start, end) => start + (end - start) * progress
    const box = {
      x: interpolate(placement.from.x, placement.to.x),
      y: interpolate(placement.from.y, placement.to.y),
      size: interpolate(placement.from.size, placement.to.size),
      backing: interpolate(placement.from.backing, placement.to.backing),
    }
    region.style.left = '0px'
    region.style.top = '0px'
    region.style.width = `${box.backing}px`
    region.style.height = `${box.backing}px`
    region.style.transformOrigin = '0 0'
    region.style.transform = `translate3d(${box.x}px, ${box.y}px, 0) scale(${box.size / box.backing})`
    lastBoxRef.current = box
    if (progress >= 1) {
      placementRef.current = null
      region.style.transition = 'none'
      clearPlacement(region)
      lastBoxRef.current = placementBox(region)
      region.style.removeProperty('transition')
    }
  }, [])

  useLayoutEffect(() => {
    const region = containerRef.current?.parentElement
    if (!region) return
    const previous = lastVisualSectionRef.current
    lastVisualSectionRef.current = visualSection
    if (!lastBoxRef.current) {
      lastBoxRef.current = placementBox(region)
      return
    }
    if (previous === visualSection) return
    const interrupted = Boolean(placementRef.current)
    const pair = (previous === 'about' && visualSection === 'projects') ||
      (previous === 'projects' && visualSection === 'about')
    if (!pair && !interrupted) return
    const from = lastBoxRef.current
    region.style.transition = 'none'
    clearPlacement(region)
    const to = placementBox(region)
    if (!motionPaused && !reducedMotion && rendererRef.current && (pair || interrupted)) {
      placementRef.current = { from, to, duration: pair ? 1400 : undefined }
      onMorphFrame(0)
    } else {
      placementRef.current = null
      lastBoxRef.current = to
      region.style.removeProperty('transition')
    }
  }, [visualSection, motionPaused, reducedMotion, onMorphFrame])

  useEffect(() => {
    function rememberPlacement() {
      if (!placementRef.current && containerRef.current?.parentElement) {
        lastBoxRef.current = placementBox(containerRef.current.parentElement)
      }
    }
    window.addEventListener('resize', rememberPlacement)
    const region = containerRef.current?.parentElement
    region?.addEventListener('transitionend', rememberPlacement)
    return () => {
      window.removeEventListener('resize', rememberPlacement)
      region?.removeEventListener('transitionend', rememberPlacement)
    }
  }, [])

  useEffect(() => {
    onRendererChange?.(status.mode)
  }, [status.mode, onRendererChange])

  useEffect(() => {
    propertiesRef.current = { section, motionPaused, reducedMotion }
    rendererRef.current?.setMotionPreferences(motionPaused, reducedMotion)
    rendererRef.current?.setSection(section, placementRef.current?.duration)
  }, [section, visualSection, motionPaused, reducedMotion])

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
          onMorphFrame,
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
          onMorphFrame,
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
  }, [reducedMotion, onMorphFrame])

  return (
    <div className="particle-stage" ref={containerRef} aria-hidden="true" data-renderer={status.mode} data-renderer-reason={status.reason || undefined}>
      <canvas className="particle-canvas particle-webgl-canvas" ref={webglCanvasRef} hidden={status.mode !== 'webgl'} />
      <canvas className="particle-canvas particle-2d-canvas" ref={fallbackCanvasRef} hidden={status.mode !== 'canvas'} />
      {!available && <StaticFallback section={section} />}
    </div>
  )
}
