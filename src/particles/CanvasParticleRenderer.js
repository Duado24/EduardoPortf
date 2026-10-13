import {
  createShapeTargets,
  HOME_ROTATION_SPEED,
  smoothProgress,
  visualState,
} from './shapeTargets.js'
import { particleProgress, sampleMorph, sampleMorphValues } from './aerostaticTransition.js'

// This renderer has no GPU dependency. The same points and interruption model
// remain animated when WebGL is unavailable, including ordinary Chrome software rendering.
export function createCanvasParticleRenderer({ canvas, container, section, motionPaused, reducedMotion, lowPower = false, onMorphFrame }) {
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('Canvas drawing is unavailable.')
  const mobile = window.matchMedia('(max-width: 760px)').matches
  const count = lowPower ? 900 : mobile ? 1200 : 1800
  const targets = createShapeTargets(count)
  let currentState = visualState(section)
  const source = targets[currentState].positions.slice()
  const target = targets[currentState].positions.slice()
  const sourceStyle = targets[currentState].style.slice()
  const targetStyle = targets[currentState].style.slice()
  const sourceDepth = new Float32Array(count * 2)
  const targetDepth = new Float32Array(count * 2)
  const delays = targets.projects.delays
  for (let i = 0; i < count; i++) {
    sourceDepth[i * 2] = currentState === 'home' ? 1 : 0
    sourceDepth[i * 2 + 1] = currentState === 'projects' ? 1 : 0
  }
  targetDepth.set(sourceDepth)
  const buckets = Array.from({ length: 20 }, () => [])
  const colors = buckets.map((_, index) => {
    const opacity = (index % 10 + 1) / 10
    return index >= 10 ? `rgba(220,128,121,${opacity})` : `rgba(236,225,211,${opacity})`
  })
  let paused = motionPaused
  let reduced = reducedMotion
  let disposed = false
  let frame = 0
  let lastFrame = 0
  let elapsed = 0
  let transitioning = false
  let duration = mobile ? 450 : 1000
  let transitionDuration = duration
  let morph = 1
  let transitionDirection = 0
  let globeProjectTransition = false
  let rotation = currentState === 'projects' ? 0.35 : 0
  let sourceRotation = 0
  let targetRotation = rotation
  let lastGlobeRotation = 0
  let globeWeight = currentState === 'home' ? 1 : 0
  let sourceGlobe = globeWeight
  let targetGlobe = globeWeight
  let projectWeight = currentState === 'projects' ? 1 : 0
  let sourceProject = projectWeight
  let targetProject = projectWeight
  let projectPhase = 0
  let projectIdleElapsed = 0
  let idleYaw = 0
  let placementPointScale = 1
  let placementProgressBase = 0
  let inViewport = true
  let width = 1
  let height = 1
  let scale = 1
  let pointRadius = 1
  let drawCount = count
  let frameInterval = 1000 / 30
  let slowFrames = 0

  function canAnimate() {
    return !disposed && !document.hidden && inViewport && !paused &&
      (transitioning || (!reduced && (currentState === 'home' || currentState === 'projects')))
  }

  function draw() {
    if (disposed || document.hidden || !inViewport) return
    context.clearRect(0, 0, width, height)
    for (const bucket of buckets) bucket.length = 0
    const cosine = Math.cos(rotation + idleYaw)
    const sine = Math.sin(rotation + idleYaw)
    const pitch = (0.035 + Math.sin(projectPhase * 0.61) * 0.01) * projectWeight
    const pitchCosine = Math.cos(pitch)
    const pitchSine = Math.sin(pitch)
    const sway = Math.sin(projectPhase * 0.72) * 0.018 * projectWeight
    const swayCosine = Math.cos(sway)
    const swaySine = Math.sin(sway)
    const float = (Math.sin(projectPhase * 1.05) * 0.024 + Math.sin(projectPhase * 0.43) * 0.009) * projectWeight
    const radius = (pointRadius + (0.75 - pointRadius) * projectWeight) * placementPointScale
    for (let i = 0; i < drawCount; i++) {
      const p = i * 3
      const s = i * 2
      const movement = particleProgress(morph, delays?.[i] ?? 0, transitionDirection)
      let x = source[p] + (target[p] - source[p]) * movement
      let y = source[p + 1] + (target[p + 1] - source[p + 1]) * movement
      let z = source[p + 2] + (target[p + 2] - source[p + 2]) * movement
      if (transitionDirection) {
        const seed = (i * 0.61803398875) % 1
        const sweep = Math.sin(Math.PI * movement)
        x += sweep * 0.025 * (0.4 + 0.6 * Math.sin(Math.PI * 2 * seed))
        y += sweep * 0.012 * Math.cos(Math.PI * 2 * seed)
        z += sweep * 0.018 * Math.sin(Math.PI * 2 * seed)
      }
      const rotatedX = x * cosine + z * sine
      const yawZ = z * cosine - x * sine
      const rotatedY = y * pitchCosine - yawZ * pitchSine
      const rotatedZ = y * pitchSine + yawZ * pitchCosine
      const brightness = sourceStyle[s] + (targetStyle[s] - sourceStyle[s]) * movement
      const accent = sourceStyle[s + 1] + (targetStyle[s + 1] - sourceStyle[s + 1]) * movement
      const globeDepth = 0.35 + 0.65 * smoothProgress((rotatedZ + 0.35) / 1.2)
      const projectDepth = 0.20 + 0.80 * smoothProgress((rotatedZ + 0.52) / 1.04)
      const depthGlobeWeight = sourceDepth[s] + (targetDepth[s] - sourceDepth[s]) * movement
      const depthProjectWeight = sourceDepth[s + 1] + (targetDepth[s + 1] - sourceDepth[s + 1]) * movement
      const opacity = brightness * (1 + (globeDepth - 1) * depthGlobeWeight + (projectDepth - 1) * depthProjectWeight)
      if (opacity < 0.025) continue
      const bucket = buckets[(accent > 0.35 ? 10 : 0) + Math.min(9, Math.max(0, Math.round(opacity * 10) - 1))]
      bucket.push(width / 2 + (rotatedX * swayCosine - rotatedY * swaySine) * scale,
        height / 2 - (rotatedX * swaySine + rotatedY * swayCosine + float) * scale,
        radius * (1 + accent * 0.2))
    }
    // At most twenty fills per frame rather than changing style/filling per dot.
    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i]
      if (!bucket.length) continue
      context.beginPath()
      for (let p = 0; p < bucket.length; p += 3) {
        const x = bucket[p]
        const y = bucket[p + 1]
        const radius = bucket[p + 2]
        context.moveTo(x + radius, y)
        context.arc(x, y, radius, 0, Math.PI * 2)
      }
      context.fillStyle = colors[i]
      context.fill()
    }
  }

  function finishTransition() {
    morph = 1
    rotation = targetRotation
    globeWeight = targetGlobe
    projectWeight = targetProject
    transitioning = false
    transitionDirection = 0
    placementPointScale = onMorphFrame?.(1) ?? 1
  }

  function schedule() {
    if (!frame && canAnimate()) frame = requestAnimationFrame(animate)
  }

  function animate(timestamp) {
    frame = 0
    if (!canAnimate()) return
    const difference = lastFrame ? timestamp - lastFrame : frameInterval
    if (difference < frameInterval - 0.5) {
      schedule()
      return
    }
    lastFrame = timestamp
    const delta = Math.min(difference, 100)
    if (!reduced && (projectWeight || targetProject)) projectPhase += delta / 1000
    if (transitioning) {
      elapsed += delta
      const progress = Math.min(1, elapsed / transitionDuration)
      const eased = smoothProgress(progress)
      morph = transitionDirection ? progress : eased
      const rotationProgress = transitionDirection ? smoothProgress((progress - 0.10) / 0.80) : eased
      rotation = sourceRotation + (targetRotation - sourceRotation) * rotationProgress
      if (transitionDirection === 1) rotation += HOME_ROTATION_SPEED * transitionDuration / 1000 * progress * (1 - progress) ** 2
      globeWeight = sourceGlobe + (targetGlobe - sourceGlobe) * eased
      const idleProgress = transitionDirection === 1 ? smoothProgress((progress - 0.66) / 0.34)
        : transitionDirection === -1 ? smoothProgress(progress / 0.34) : eased
      projectWeight = sourceProject + (targetProject - sourceProject) * idleProgress
      placementPointScale = onMorphFrame?.(placementProgressBase + (1 - placementProgressBase) * progress) ?? 1
      if (elapsed >= transitionDuration) finishTransition()
    } else if (currentState === 'home') {
      rotation += delta / 1000 * HOME_ROTATION_SPEED
      lastGlobeRotation = rotation
    } else if (currentState === 'projects') {
      projectIdleElapsed += delta
      idleYaw = Math.sin(projectPhase * 0.37) * 0.02 * smoothProgress(projectIdleElapsed / 600)
    }
    const started = performance.now()
    draw()
    slowFrames = performance.now() - started > 16 ? slowFrames + 1 : Math.max(0, slowFrames - 1)
    if (slowFrames >= 18) {
      drawCount = Math.min(drawCount, 900)
      frameInterval = 1000 / (frameInterval < 50 ? 20 : 15)
      slowFrames = 0
    }
    schedule()
  }

  function resetAnimationClock() {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    lastFrame = 0
    schedule()
  }

  function resize() {
    if (disposed) return
    const bounds = container.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    width = Math.round(bounds.width)
    height = Math.round(bounds.height)
    // DPR1 is deliberate for the CPU renderer, even on high-density phones.
    canvas.width = width
    canvas.height = height
    const aspect = width / height
    scale = height / (2 * Math.max(1.2, 1.2 / aspect))
    const narrow = window.matchMedia('(max-width: 760px)').matches
    pointRadius = narrow ? 0.95 : 1.075
    duration = narrow ? 450 : 1000
    drawCount = Math.min(drawCount, narrow ? 1200 : count)
    draw()
  }

  function setSection(nextSection, durationOverride) {
    if (disposed) return
    const nextState = visualState(nextSection)
    if (nextState === currentState && !transitioning) return
    sampleMorph(source, target, morph, delays, transitionDirection, source)
    sampleMorphValues(sourceStyle, targetStyle, morph, delays, transitionDirection, 2, sourceStyle)
    sampleMorphValues(sourceDepth, targetDepth, morph, delays, transitionDirection, 2, sourceDepth)
    target.set(targets[nextState].positions)
    targetStyle.set(targets[nextState].style)
    for (let i = 0; i < count; i++) {
      targetDepth[i * 2] = nextState === 'home' ? 1 : 0
      targetDepth[i * 2 + 1] = nextState === 'projects' ? 1 : 0
    }
    sourceGlobe = globeWeight
    targetGlobe = nextState === 'home' ? 1 : 0
    sourceProject = projectWeight
    targetProject = nextState === 'projects' ? 1 : 0
    sourceRotation = Math.atan2(Math.sin(rotation + idleYaw), Math.cos(rotation + idleYaw))
    rotation = sourceRotation
    idleYaw = 0
    projectIdleElapsed = 0
    if (currentState === 'home' && !transitioning) lastGlobeRotation = sourceRotation
    const destinationRotation = nextState === 'home' ? lastGlobeRotation : nextState === 'projects' ? 0.35 : 0
    targetRotation = sourceRotation + Math.atan2(Math.sin(destinationRotation - sourceRotation), Math.cos(destinationRotation - sourceRotation))
    globeProjectTransition = (currentState === 'home' && nextState === 'projects') || (currentState === 'projects' && nextState === 'home')
    transitionDirection = globeProjectTransition && !reduced ? nextState === 'projects' ? 1 : -1 : 0
    currentState = nextState
    morph = 0
    elapsed = 0
    placementProgressBase = 0
    transitionDuration = reduced && globeProjectTransition ? 220 : durationOverride ?? (transitionDirection ? mobile ? 1200 : 2000 : duration)
    transitioning = true
    placementPointScale = onMorphFrame?.(0) ?? 1
    if (paused || (reduced && !globeProjectTransition)) finishTransition()
    draw()
    resetAnimationClock()
  }

  function setMotionPreferences(nextPaused, nextReduced) {
    if (disposed) return
    paused = nextPaused
    reduced = nextReduced
    if (paused && transitioning) finishTransition()
    else if (reduced && transitioning) {
      if (globeProjectTransition) {
        placementProgressBase += (1 - placementProgressBase) * Math.min(1, elapsed / transitionDuration)
        sampleMorph(source, target, morph, delays, transitionDirection, source)
        sampleMorphValues(sourceStyle, targetStyle, morph, delays, transitionDirection, 2, sourceStyle)
        sampleMorphValues(sourceDepth, targetDepth, morph, delays, transitionDirection, 2, sourceDepth)
        sourceRotation = rotation + idleYaw
        sourceGlobe = globeWeight
        sourceProject = projectWeight
        idleYaw = 0
        morph = 0
        elapsed = 0
        transitionDirection = 0
        transitionDuration = 220
      } else finishTransition()
    }
    draw()
    resetAnimationClock()
  }

  function visibilityChanged() {
    resetAnimationClock()
    if (!document.hidden) draw()
  }

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
  const visibilityObserver = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting
    resetAnimationClock()
    if (inViewport) draw()
  }, { threshold: 0 }) : null

  function destroy() {
    if (disposed) return
    disposed = true
    if (frame) cancelAnimationFrame(frame)
    resizeObserver?.disconnect()
    visibilityObserver?.disconnect()
    window.removeEventListener('resize', resize)
    document.removeEventListener('visibilitychange', visibilityChanged)
    context.clearRect(0, 0, width, height)
  }

  resizeObserver?.observe(container)
  visibilityObserver?.observe(container)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', visibilityChanged)
  resize()
  schedule()
  return { setSection, setMotionPreferences, destroy, getRenderSize: () => width }
}
