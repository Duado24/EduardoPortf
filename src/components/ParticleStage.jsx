import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import StaticFallback from '../particles/StaticFallback.jsx'
import { canvasRendererReason } from '../particles/capabilities.js'
import { placementAt } from '../particles/aerostaticTransition.js'

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

const SKY_STATES = ['journey', 'skills']

export default function ParticleStage({ section, journeyView, skillFlame, visualSection = section, motionPaused = false, reducedMotion = false, onRendererChange, onTransitionProgress }) {
  const containerRef = useRef(null)
  const placementRef = useRef(null)
  const lastBoxRef = useRef(null)
  const lastVisualSectionRef = useRef(visualSection)
  const webglCanvasRef = useRef(null)
  const skyCanvasRef = useRef(null)
  const fallbackCanvasRef = useRef(null)
  const rendererRef = useRef(null)
  const presentationCallbackRef = useRef(onTransitionProgress)
  const placementFrameRef = useRef({})
  const propertiesRef = useRef({ section, journeyView, motionPaused, reducedMotion, flame: skillFlame?.color })
  const [status, setStatus] = useState({ mode: 'static', reason: 'loading' })
  const available = status.mode !== 'static'

  useLayoutEffect(() => { presentationCallbackRef.current = onTransitionProgress }, [onTransitionProgress])

  const onMorphFrame = useCallback((progress) => {
    presentationCallbackRef.current?.(progress)
    const placement = placementRef.current
    if (!placement) return 1
    const region = containerRef.current?.parentElement
    if (!region) return 1
    placement.progress = progress
    const localProgress = (progress - (placement.start ?? 0)) / (1 - (placement.start ?? 0))
    const box = placementAt(placement.from, placement.to, localProgress, placement.direction, placementFrameRef.current)
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
      return 1
    }
    return placement.renderSize / box.size
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
    const fromGlobe = previous === 'about' || previous === 'home'
    const toGlobe = visualSection === 'about' || visualSection === 'home'
    const pair = (fromGlobe && visualSection === 'projects') || (previous === 'projects' && toGlobe)
    const skyPair = SKY_STATES.includes(previous) || SKY_STATES.includes(visualSection)
    if (!pair && !skyPair && !interrupted) return
    const from = { ...lastBoxRef.current }
    region.style.transition = 'none'
    clearPlacement(region)
    const to = placementBox(region)
    if (!motionPaused && rendererRef.current && (pair || skyPair || interrupted)) {
      placementRef.current = {
        from, to,
        renderSize: rendererRef.current.getRenderSize?.() ?? from.size,
        direction: reducedMotion || !pair ? 0 : visualSection === 'projects' ? 1 : -1,
        duration: reducedMotion ? 220 : (pair || skyPair) ? window.matchMedia('(max-width: 760px)').matches ? 1200 : 2000 : undefined,
      }
      onMorphFrame(0)
    } else {
      placementRef.current = null
      lastBoxRef.current = to
      region.style.removeProperty('transition')
    }
  }, [visualSection, motionPaused, reducedMotion, onMorphFrame])

  useEffect(() => {
    function rememberPlacement() {
      const region = containerRef.current?.parentElement
      if (!region) return
      const placement = placementRef.current
      if (placement) {
        // Retarget placement after resizing from the currently displayed square.
        const from = { ...lastBoxRef.current }
        clearPlacement(region)
        placement.to = placementBox(region)
        placement.from = from
        placement.start = placement.progress ?? 0
        onMorphFrame(placement.start)
      } else lastBoxRef.current = placementBox(region)
    }
    window.addEventListener('resize', rememberPlacement)
    const region = containerRef.current?.parentElement
    region?.addEventListener('transitionend', rememberPlacement)
    return () => {
      window.removeEventListener('resize', rememberPlacement)
      region?.removeEventListener('transitionend', rememberPlacement)
    }
  }, [onMorphFrame])

  useEffect(() => {
    onRendererChange?.(status.mode)
  }, [status.mode, onRendererChange])

  useEffect(() => {
    propertiesRef.current = { section, journeyView, motionPaused, reducedMotion, flame: skillFlame?.color }
  }, [section, journeyView, motionPaused, reducedMotion, skillFlame])

  useEffect(() => { rendererRef.current?.setJourneyView(journeyView) }, [journeyView])

  useEffect(() => {
    if (skillFlame) rendererRef.current?.setFlame?.(skillFlame.color, skillFlame.flare)
  }, [skillFlame])

  useEffect(() => {
    rendererRef.current?.setMotionPreferences(motionPaused, reducedMotion)
  }, [motionPaused, reducedMotion])

  useEffect(() => {
    rendererRef.current?.setSection(section, placementRef.current?.duration)
  }, [section, visualSection])

  useEffect(() => {
    let active = true
    let renderer
    setStatus({ mode: 'static', reason: 'loading' })
    const canvasReason = propertiesRef.current.reducedMotion ? 'reduced-motion' : canvasRendererReason()
    let fallingBack = false

    async function startCanvas(reason) {
      if (!active || fallingBack) return
      fallingBack = true
      renderer?.destroy()
      onMorphFrame(1)
      rendererRef.current = null
      setStatus({ mode: 'static', reason: 'loading' })
      try {
        const { createCanvasParticleRenderer } = await import('../particles/CanvasParticleRenderer.js')
        if (!active) return
        renderer = createCanvasParticleRenderer({
          canvas: fallbackCanvasRef.current,
          skyCanvas: skyCanvasRef.current,
          container: containerRef.current,
          ...propertiesRef.current,
          onMorphFrame,
          lowPower: Boolean(canvasReason && canvasReason !== 'reduced-motion'),
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
          skyCanvas: skyCanvasRef.current,
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
  }, [onMorphFrame])

  return (
    <div className="particle-stage" ref={containerRef} aria-hidden="true" data-renderer={status.mode} data-renderer-reason={status.reason || undefined}>
      <canvas className="particle-canvas particle-webgl-canvas" ref={webglCanvasRef} hidden={status.mode !== 'webgl'} />
      <canvas className="particle-canvas particle-2d-canvas" ref={fallbackCanvasRef} hidden={status.mode !== 'canvas'} />
      <canvas className="particle-canvas journey-detail-canvas" ref={skyCanvasRef} />
      {!available && <StaticFallback section={section} journeyView={journeyView} />}
    </div>
  )
}
