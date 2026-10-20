import { createJourneySky } from './JourneyScene.js'
import { SKY_STARS as STARS, CONS } from '../data/astronomyCatalog.js'
import { journeyConstellations } from '../data/journeyConstellations.js'
import {
  createShapeTargets,
  HOME_ROTATION_SPEED,
  smoothProgress,
  visualState,
} from './shapeTargets.js'
import { particleProgress, sampleMorph, sampleMorphValues } from './aerostaticTransition.js'
import { placeWatch, watchFlare, watchLayout, watchShade } from './watchTarget.js'
import { boardLayout, boardShade, createBoardTarget } from './boardTarget.js'

// Journey and Skills share the full-screen sky region and its slow transitions.
const SKY_STATES = ['journey', 'skills']
const DEFAULT_FLAME = [1, 0.7, 0.42]

// This renderer has no GPU dependency. The same points and interruption model
// remain animated when WebGL is unavailable, including ordinary Chrome software rendering.
export function createCanvasParticleRenderer({ canvas, skyCanvas, journeyView, container, section, motionPaused, reducedMotion, flame = DEFAULT_FLAME, lowPower = false, onMorphFrame }) {
  const context = canvas.getContext('2d', { alpha: true })
  if (!context) throw new Error('Canvas drawing is unavailable.')
  const mobile = window.matchMedia('(max-width: 760px)').matches
  const count = lowPower ? 900 : mobile ? 1200 : 1800
  const targets = createShapeTargets(count)
  let placement = watchLayout({ width: window.innerWidth, height: window.innerHeight })
  placeWatch(placement, targets.skills.positions)
  const { watchA, watchB } = targets.skills
  const shade = [0, 0, 1, 1, 0]
  let flare = 0
  const sky = createJourneySky(skyCanvas, { stars: STARS, cons: CONS, milestones: journeyConstellations, count })
  sky.setView(journeyView, true)
  sky.project(targets.journey.positions, targets.journey.style)
  let currentState = visualState(section)
  const source = targets[currentState].positions.slice()
  const target = targets[currentState].positions.slice()
  const sourceStyle = targets[currentState].style.slice()
  const targetStyle = targets[currentState].style.slice()
  const sourceSize = new Float32Array(count).fill(1)
  const targetSize = new Float32Array(count).fill(1)
  if (visualState(section) === 'journey') { sky.project(target, targetStyle, targetSize); sourceSize.set(targetSize) }
  if (currentState === 'skills') { targetSize.set(targets.skills.sizes); sourceSize.set(targetSize) }
  const boardOut = [0, 0, 1, 0]
  const hoverState = [0, 0, 0]
  let hoverOn = false
  placeBoardTarget()
  if (currentState === 'contact') {
    for (const array of [source, target]) array.set(targets.contact.positions)
    for (const array of [sourceStyle, targetStyle]) array.set(targets.contact.style)
    for (const array of [sourceSize, targetSize]) array.set(targets.contact.sizes)
  }

  // The board is rebuilt per viewport: its grid and dot count change between desktop and phones.
  function placeBoardTarget() {
    const built = createBoardTarget(count, boardLayout({ width: window.innerWidth, height: window.innerHeight }))
    for (const name of ['positions', 'style', 'sizes', 'board']) targets.contact[name].set(built[name])
    targets.contact.grid = built.grid
  }
  const sourceDepth = new Float32Array(count * 2)
  const targetDepth = new Float32Array(count * 2)
  const delays = targets.projects.delays
  for (let i = 0; i < count; i++) {
    sourceDepth[i * 2] = currentState === 'home' ? 1 : 0
    sourceDepth[i * 2 + 1] = currentState === 'projects' ? 1 : 0
  }
  targetDepth.set(sourceDepth)
  // Ten opacity buckets each: 0 base, 10 accent, 20 tintable flame, 30 the Contact board's Peru red.
  const buckets = Array.from({ length: 40 }, () => [])
  const colors = buckets.map((_, index) => {
    const opacity = (index % 10 + 1) / 10
    return index >= 30 ? `rgba(232,38,54,${opacity})` : index >= 10 ? `rgba(220,128,121,${opacity})` : `rgba(236,225,211,${opacity})`
  })
  const flameColor = flame.slice()
  let flameTarget = flame.slice()
  let burst = 0
  function tintFlame(seconds) {
    const blend = seconds === null ? 1 : Math.min(1, seconds * 3)
    for (let i = 0; i < 3; i++) flameColor[i] += (flameTarget[i] - flameColor[i]) * blend
    const [r, g, b] = flameColor.map((channel) => Math.round(channel * 255))
    for (let i = 20; i < 30; i++) colors[i] = `rgba(${r},${g},${b},${(i % 10 + 1) / 10})`
    if (seconds !== null) burst *= Math.pow(0.18, seconds)
  }
  tintFlame(null)
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
  let previousState = currentState
  let skillsWeight = currentState === 'skills' ? 1 : 0
  let sourceSkills = skillsWeight
  let targetSkills = skillsWeight
  let skillsTime = 0
  let descentSign = 0
  let sourceLift = 0
  let targetLift = 0
  let boardWeight = currentState === 'contact' ? 1 : 0
  let sourceBoard = boardWeight
  let targetBoard = boardWeight

  function placeBoard() {
    placeBoardTarget()
    if (currentState !== 'contact') return
    target.set(targets.contact.positions)
    targetStyle.set(targets.contact.style)
    targetSize.set(targets.contact.sizes)
  }

  // The hover block snaps to cells; its strength eases in and out with the frame loop.
  function setBoardHover({ col = hoverState[0], row = hoverState[1], on = false } = {}) {
    if (disposed) return
    hoverState[0] = col
    hoverState[1] = row
    hoverOn = on
    if (paused || reduced || !canAnimate()) {
      hoverState[2] = on ? 1 : 0
      draw()
    }
    resetAnimationClock()
  }
  sky.setDescent(currentState === 'skills' ? 1 : 0)

  // The sky stays up between Journey and Skills; arriving from elsewhere it fades in late in the morph.
  function skyOpacity() {
    if (!SKY_STATES.includes(currentState)) return 0
    if (!transitioning || SKY_STATES.includes(previousState)) return 1
    return smoothProgress((morph - .45) / .55)
  }

  function updateDescent(progress) {
    if (!descentSign) return
    const eased = smoothProgress(progress)
    sourceLift = descentSign * placement.lift * eased
    targetLift = -descentSign * placement.lift * (1 - eased)
    sky.setDescent(descentSign > 0 ? eased : 1 - eased)
  }

  function placeSkills() {
    placement = watchLayout({ width: window.innerWidth, height: window.innerHeight })
    placeWatch(placement, targets.skills.positions)
    sky.setHorizon(placement.horizon)
    if (currentState === 'skills') target.set(targets.skills.positions)
  }

  function setFlame(color, flare = false) {
    if (disposed) return
    flameTarget = color.slice()
    const still = paused || reduced || !canAnimate()
    if (flare && !still) burst = 1
    if (still) {
      tintFlame(null)
      draw()
    }
    resetAnimationClock()
  }

  function updateSkyTarget() {
    if (currentState !== 'journey') return
    sky.project(target, targetStyle, targetSize)
  }
  function setJourneyView(view) {
    journeyView = view
    sky.setView(view, paused || reduced || currentState !== 'journey')
    updateSkyTarget()
    draw()
    resetAnimationClock()
  }

  function canAnimate() {
    return !disposed && !document.hidden && (inViewport || transitioning) && !paused &&
      (transitioning || (!reduced && (currentState === 'home' || currentState === 'projects' || currentState === 'skills' || currentState === 'contact' || currentState === 'journey' && sky.moving)))
  }

  function draw() {
    sky.present(skyOpacity())
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
      let y = source[p + 1] + sourceLift + (target[p + 1] + targetLift - source[p + 1] - sourceLift) * movement
      let z = source[p + 2] + (target[p + 2] - source[p + 2]) * movement
      let watchAlpha = 0
      let watchSize = 1
      let watchFlame = false
      if (skillsWeight) {
        watchShade(watchA, watchB, i, skillsTime, flare, shade)
        x += shade[0] * placement.scale * skillsWeight
        y += shade[1] * placement.scale * skillsWeight
        watchAlpha = shade[2]
        watchSize = 1 + (shade[3] - 1) * skillsWeight
        watchFlame = skillsWeight > 0.5 && shade[4] > 0.5
      }
      let boardAlpha = 0
      let boardColor = 0
      if (boardWeight) {
        boardShade(targets.contact.board, i, skillsTime, hoverState, target[p], targets.contact.grid, boardOut)
        x += boardOut[0] * targets.contact.grid[2] * boardWeight
        boardAlpha = boardOut[1]
        watchSize *= 1 + (boardOut[2] - 1) * boardWeight
        if (boardWeight > 0.5) boardColor = boardOut[3]
      }
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
      const shaded = brightness * (1 + (globeDepth - 1) * depthGlobeWeight + (projectDepth - 1) * depthProjectWeight)
      const watched = shaded + (watchAlpha - shaded) * skillsWeight
      const opacity = watched + (boardAlpha - watched) * boardWeight
      if (opacity < 0.025) continue
      // Board colors: 1 coral glow uses the accent set, 2 Peru red has its own, 3 white reads as cream.
      const set = boardColor === 2 ? 30 : boardColor === 1 ? 10 : boardColor === 3 ? 0 : watchFlame ? 20 : accent > 0.35 ? 10 : 0
      const bucket = buckets[set + Math.min(9, Math.max(0, Math.round(opacity * 10) - 1))]
      bucket.push(width / 2 + (rotatedX * swayCosine - rotatedY * swaySine) * scale,
        height / 2 - (rotatedX * swaySine + rotatedY * swayCosine + float) * scale,
        radius * (sourceSize[i] + (targetSize[i] - sourceSize[i]) * movement) * (1 + accent * 0.2) * watchSize)
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
    skillsWeight = targetSkills
    boardWeight = targetBoard
    if (descentSign) updateDescent(1)
    descentSign = 0
    sourceLift = targetLift = 0
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
    if (currentState === 'journey' && sky.moving) { sky.update(delta / 1000); updateSkyTarget() }
    if (!reduced && (projectWeight || targetProject)) projectPhase += delta / 1000
    if (!reduced && (skillsWeight || targetSkills || boardWeight || targetBoard)) skillsTime += delta / 1000
    hoverState[2] += ((hoverOn ? 1 : 0) - hoverState[2]) * Math.min(1, delta / 1000 * 8)
    tintFlame(delta / 1000)
    flare = watchFlare(skillsTime, burst)
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
      skillsWeight = sourceSkills + (targetSkills - sourceSkills) * idleProgress
      boardWeight = sourceBoard + (targetBoard - sourceBoard) * idleProgress
      updateDescent(progress)
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
    // Before the sky redraw, so it draws the new horizon once.
    placeSkills()
    sky.resize()
    updateSkyTarget()
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
    placeBoard()
    draw()
  }

  function setSection(nextSection, durationOverride) {
    if (disposed) return
    const nextState = visualState(nextSection)
    if (nextState === currentState && !transitioning) return
    sampleMorph(source, target, morph, delays, transitionDirection, source)
    sampleMorphValues(sourceStyle, targetStyle, morph, delays, transitionDirection, 2, sourceStyle)
    sampleMorphValues(sourceDepth, targetDepth, morph, delays, transitionDirection, 2, sourceDepth)
    if (nextState === 'journey') { sky.resize(); sky.project(targets.journey.positions, targets.journey.style) }
    if (nextState === 'skills') placeSkills()
    sampleMorphValues(sourceSize, targetSize, morph, delays, transitionDirection, 1, sourceSize)
    targetSize.fill(1)
    if (nextState === 'skills') targetSize.set(targets.skills.sizes)
    if (nextState === 'contact') { placeBoard(); targetSize.set(targets.contact.sizes) }
    if (nextState === 'journey') sky.project(targets.journey.positions, targets.journey.style, targetSize)
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
    sourceSkills = skillsWeight
    targetSkills = nextState === 'skills' ? 1 : 0
    sourceBoard = boardWeight
    targetBoard = nextState === 'contact' ? 1 : 0
    sourceRotation = Math.atan2(Math.sin(rotation + idleYaw), Math.cos(rotation + idleYaw))
    rotation = sourceRotation
    idleYaw = 0
    projectIdleElapsed = 0
    if (currentState === 'home' && !transitioning) lastGlobeRotation = sourceRotation
    const destinationRotation = nextState === 'home' ? lastGlobeRotation : nextState === 'projects' ? 0.35 : 0
    targetRotation = sourceRotation + Math.atan2(Math.sin(destinationRotation - sourceRotation), Math.cos(destinationRotation - sourceRotation))
    globeProjectTransition = (currentState === 'home' && nextState === 'projects') || (currentState === 'projects' && nextState === 'home')
    const skyPair = SKY_STATES.includes(currentState) || SKY_STATES.includes(nextState)
    // Staggered (delayed) morphs belong to the globe ↔ balloon pair and to Journey's sky;
    // Skills ↔ any other section morphs all at once so nothing hangs on the old shape.
    const staggered = globeProjectTransition || skyPair && (currentState === 'journey' || nextState === 'journey')
    transitionDirection = staggered && !reduced ? ['journey', 'skills', 'projects'].includes(nextState) ? 1 : -1 : 0
    // Journey → Skills tilts the view down to the horizon; Skills → Journey looks back up.
    descentSign = reduced ? 0 : currentState === 'journey' && nextState === 'skills' ? 1 : currentState === 'skills' && nextState === 'journey' ? -1 : 0
    if (!descentSign && SKY_STATES.includes(nextState)) sky.setDescent(nextState === 'skills' ? 1 : 0)
    sourceLift = targetLift = 0
    previousState = currentState
    currentState = nextState
    morph = 0
    elapsed = 0
    placementProgressBase = 0
    transitionDuration = reduced && globeProjectTransition ? 220 : durationOverride ?? ((globeProjectTransition || skyPair) ? mobile ? 1200 : 2000 : duration)
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
    if (paused || reduced) { sky.setView(journeyView, true); updateSkyTarget() }
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
    sky.destroy()
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
  return { setJourneyView, setSection, setMotionPreferences, setFlame, setBoardHover, destroy, getRenderSize: () => width }
}
