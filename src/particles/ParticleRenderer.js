import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import {
  createShapeTargets,
  HOME_ROTATION_SPEED,
  MAX_PARTICLES,
  MOBILE_PARTICLES,
  smoothProgress,
  visualState,
} from './shapeTargets.js'
import { sampleMorph, sampleMorphValues } from './aerostaticTransition.js'

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec2 aSourceStyle;
  attribute vec2 aTargetStyle;
  attribute vec2 aSourceDepth;
  attribute vec2 aTargetDepth;
  attribute float aDelay;
  attribute float aSeed;
  uniform float uMorph;
  uniform float uDirection;
  uniform float uRotation;
  uniform float uPitch;
  uniform float uPointSize;
  varying float vOpacity;
  varying float vAccent;
  varying float vProject;

  void main() {
    float m = uMorph;
    if (uDirection > 0.5) m = smoothstep(aDelay, min(0.98, aDelay + 0.60), uMorph);
    if (uDirection < -0.5) m = 1.0 - smoothstep(aDelay, min(0.98, aDelay + 0.60), 1.0 - uMorph);
    vec3 p = mix(position, aTarget, m);
    if (abs(uDirection) > 0.5) {
      float sweep = sin(3.14159265359 * m);
      float phase = aSeed * 6.28318530718;
      p += sweep * vec3(0.025 * (0.4 + 0.6 * sin(phase)), 0.012 * cos(phase), 0.018 * sin(phase));
    }
    float c = cos(uRotation);
    float s = sin(uRotation);
    p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
    p = vec3(p.x, p.y * cos(uPitch) - p.z * sin(uPitch), p.y * sin(uPitch) + p.z * cos(uPitch));
    vec2 style = mix(aSourceStyle, aTargetStyle, m);
    vec2 depthWeights = mix(aSourceDepth, aTargetDepth, m);
    float depth = 0.35 + 0.65 * smoothstep(-0.35, 0.85, p.z);
    float projectDepth = 0.20 + 0.80 * smoothstep(-0.52, 0.52, p.z);
    vOpacity = style.x * (1.0 + (depth - 1.0) * depthWeights.x + (projectDepth - 1.0) * depthWeights.y);
    vAccent = style.y;
    vProject = depthWeights.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uPointSize * mix(1.0, 1.2, vAccent);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  varying float vOpacity;
  varying float vAccent;
  varying float vProject;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5) discard;
    float coverage = 1.0 - smoothstep(mix(0.25, 0.40, vProject), 0.5, radius);
    gl_FragColor = vec4(mix(uBaseColor, uAccentColor, vAccent), coverage * vOpacity);
    #include <colorspace_fragment>
  }
`

export function createParticleRenderer({ canvas, container, section, motionPaused, reducedMotion, onUnavailable, onMorphFrame }) {
  const mobile = window.matchMedia('(max-width: 760px)').matches
  const count = mobile ? MOBILE_PARTICLES : MAX_PARTICLES
  const targets = createShapeTargets(count)
  const initialState = visualState(section)
  const source = targets[initialState].positions.slice()
  const target = targets[initialState].positions.slice()
  const sourceStyle = targets[initialState].style.slice()
  const targetStyle = targets[initialState].style.slice()
  const sourceDepth = new Float32Array(count * 2)
  const targetDepth = new Float32Array(count * 2)
  const delays = targets.projects.delays
  const seeds = Float32Array.from({ length: count }, (_, i) => i * 0.61803398875 % 1)
  for (let i = 0; i < count; i++) {
    sourceDepth[i * 2] = targetDepth[i * 2] = initialState === 'home' ? 1 : 0
    sourceDepth[i * 2 + 1] = targetDepth[i * 2 + 1] = initialState === 'projects' ? 1 : 0
  }

  // Software-backed WebGL2 is permitted. Measured frame cost determines whether
  // to reduce quality or use the lighter animated Canvas renderer.
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  })
  if (!context) throw new Error('A suitable WebGL2 context is unavailable.')
  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: false })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(source, 3).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTarget', new BufferAttribute(target, 3).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aSourceStyle', new BufferAttribute(sourceStyle, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTargetStyle', new BufferAttribute(targetStyle, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aSourceDepth', new BufferAttribute(sourceDepth, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTargetDepth', new BufferAttribute(targetDepth, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aDelay', new BufferAttribute(delays, 1))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    uniforms: {
      uMorph: { value: 1 },
      uDirection: { value: 0 },
      uRotation: { value: initialState === 'projects' ? 0.35 : 0 },
      uPitch: { value: initialState === 'projects' ? 0.035 : 0 },
      uPointSize: { value: 2 },
      uBaseColor: { value: new Color('#ece1d3') },
      uAccentColor: { value: new Color('#dc8079') },
    },
  })

  const points = new Points(geometry, material)
  points.frustumCulled = false
  const scene = new Scene()
  scene.add(points)
  const camera = new OrthographicCamera(-1.25, 1.25, 1.25, -1.25, 0.1, 10)
  camera.position.z = 3

  let currentState = initialState
  let paused = motionPaused
  let reduced = reducedMotion
  let disposed = false
  let frame = 0
  let lastFrame = 0
  let elapsed = 0
  let duration = mobile ? 450 : 1000
  let transitionDuration = duration
  let transitioning = false
  let sourceRotation = 0
  let targetRotation = initialState === 'projects' ? 0.35 : 0
  let lastGlobeRotation = 0
  let direction = 0
  let globePair = false
  let projectWeight = initialState === 'projects' ? 1 : 0
  let sourceProject = projectWeight
  let targetProject = projectWeight
  let projectPhase = 0
  let inViewport = true
  let performanceDrawLimit = count
  let slowFrames = 0
  let performanceTier = 0
  let frameInterval = 1000 / 30
  let pointDpr = 1
  let pointBaseCss = mobile ? 1.9 : 2.15
  let placementPointScale = 1
  let placementProgressBase = 0
  let projectIdleElapsed = 0
  let renderSize = 1

  function canAnimate() {
    return !disposed && !document.hidden && inViewport && !paused &&
      (transitioning || !reduced && (currentState === 'home' || currentState === 'projects'))
  }

  function positionProject() {
    points.rotation.z = Math.sin(projectPhase * 0.72) * 0.018 * projectWeight
    points.position.y = (Math.sin(projectPhase * 1.05) * 0.024 + Math.sin(projectPhase * 0.43) * 0.009) * projectWeight
    material.uniforms.uPitch.value = (0.035 + Math.sin(projectPhase * 0.61) * 0.01) * projectWeight
    material.uniforms.uPointSize.value = (pointBaseCss + (1.5 - pointBaseCss) * projectWeight) * pointDpr * placementPointScale
  }

  function draw() {
    if (!disposed && !document.hidden && inViewport) renderer.render(scene, camera)
  }

  function finishTransition() {
    material.uniforms.uMorph.value = 1
    material.uniforms.uRotation.value = targetRotation
    projectWeight = targetProject
    direction = 0
    material.uniforms.uDirection.value = 0
    placementPointScale = onMorphFrame?.(1) ?? 1
    positionProject()
    transitioning = false
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
      const raw = Math.min(1, elapsed / transitionDuration)
      const progress = smoothProgress(raw)
      material.uniforms.uMorph.value = direction ? raw : progress
      const rotationProgress = direction ? smoothProgress((raw - 0.10) / 0.80) : progress
      const momentum = direction > 0 ? HOME_ROTATION_SPEED * transitionDuration / 1000 * raw * (1 - raw) ** 2 : 0
      material.uniforms.uRotation.value = sourceRotation + (targetRotation - sourceRotation) * rotationProgress + momentum
      const idleProgress = direction > 0 ? smoothProgress((raw - 0.66) / 0.34) : direction < 0 ? smoothProgress(raw / 0.34) : progress
      projectWeight = sourceProject + (targetProject - sourceProject) * idleProgress
      placementPointScale = onMorphFrame?.(placementProgressBase + (1 - placementProgressBase) * raw) ?? 1
      if (elapsed >= transitionDuration) finishTransition()
    } else if (currentState === 'home') {
      material.uniforms.uRotation.value += delta / 1000 * HOME_ROTATION_SPEED
      lastGlobeRotation = material.uniforms.uRotation.value
    } else if (currentState === 'projects') {
      projectIdleElapsed += delta
      material.uniforms.uRotation.value = targetRotation + Math.sin(projectPhase * 0.37) * 0.02 * smoothProgress(projectIdleElapsed / 600)
    }
    positionProject()

    const renderStarted = performance.now()
    draw()
    const renderCost = performance.now() - renderStarted
    slowFrames = renderCost > 18 || difference > 85 ? slowFrames + 1 : Math.max(0, slowFrames - 1)
    if (slowFrames >= 18) {
      if (performanceTier < 2) {
        performanceDrawLimit = Math.min(count, performanceTier === 0 ? 2800 : 1400)
        geometry.setDrawRange(0, performanceDrawLimit)
        if (performanceTier === 1) frameInterval = 1000 / 20
        performanceTier++
        slowFrames = 0
      } else {
        destroy()
        onUnavailable('performance')
        return
      }
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
    const { width, height } = container.getBoundingClientRect()
    if (!width || !height) return
    const narrow = window.matchMedia('(max-width: 760px)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1 : 1.25)
    renderer.setPixelRatio(dpr)
    renderSize = Math.round(width)
    renderer.setSize(renderSize, Math.round(height), false)
    const aspect = width / height
    const halfHeight = Math.max(1.2, 1.2 / aspect)
    camera.left = -halfHeight * aspect
    camera.right = halfHeight * aspect
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    pointDpr = dpr
    pointBaseCss = narrow ? 1.9 : 2.15
    positionProject()
    geometry.setDrawRange(0, Math.min(performanceDrawLimit, narrow ? MOBILE_PARTICLES : count))
    duration = narrow ? 450 : 1000
    draw()
  }

  function setSection(nextSection, durationOverride) {
    if (disposed) return
    const nextState = visualState(nextSection)
    if (nextState === currentState && !transitioning) return
    const uniforms = material.uniforms
    sampleMorph(source, target, uniforms.uMorph.value, delays, direction, source)
    sampleMorphValues(sourceStyle, targetStyle, uniforms.uMorph.value, delays, direction, 2, sourceStyle)
    sampleMorphValues(sourceDepth, targetDepth, uniforms.uMorph.value, delays, direction, 2, sourceDepth)
    globePair = (currentState === 'home' && nextState === 'projects') || (currentState === 'projects' && nextState === 'home')
    direction = !reduced && globePair ? nextState === 'projects' ? 1 : -1 : 0
    target.set(targets[nextState].positions)
    targetStyle.set(targets[nextState].style)
    for (let i = 0; i < count; i++) {
      targetDepth[i * 2] = nextState === 'home' ? 1 : 0
      targetDepth[i * 2 + 1] = nextState === 'projects' ? 1 : 0
    }
    for (const name of ['position', 'aTarget', 'aSourceStyle', 'aTargetStyle', 'aSourceDepth', 'aTargetDepth']) geometry.attributes[name].needsUpdate = true
    sourceProject = projectWeight
    targetProject = nextState === 'projects' ? 1 : 0
    sourceRotation = Math.atan2(Math.sin(uniforms.uRotation.value), Math.cos(uniforms.uRotation.value))
    uniforms.uRotation.value = sourceRotation
    if (currentState === 'home' && !transitioning) lastGlobeRotation = sourceRotation
    const destinationRotation = nextState === 'home' ? lastGlobeRotation : nextState === 'projects' ? 0.35 : 0
    targetRotation = sourceRotation + Math.atan2(Math.sin(destinationRotation - sourceRotation), Math.cos(destinationRotation - sourceRotation))
    uniforms.uDirection.value = direction
    uniforms.uMorph.value = 0
    currentState = nextState
    elapsed = 0
    placementProgressBase = 0
    projectIdleElapsed = 0
    transitionDuration = reduced && globePair ? 220 : durationOverride ?? (globePair ? mobile ? 1200 : 2000 : duration)
    transitioning = true
    placementPointScale = onMorphFrame?.(0) ?? 1
    if (paused || reduced && !globePair) finishTransition()
    draw()
    resetAnimationClock()
  }

  function setMotionPreferences(nextPaused, nextReduced) {
    if (disposed) return
    paused = nextPaused
    reduced = nextReduced
    if (paused && transitioning) finishTransition()
    else if (reduced && transitioning) {
      if (globePair) {
        placementProgressBase += (1 - placementProgressBase) * Math.min(1, elapsed / transitionDuration)
        const uniforms = material.uniforms
        sampleMorph(source, target, uniforms.uMorph.value, delays, direction, source)
        sampleMorphValues(sourceStyle, targetStyle, uniforms.uMorph.value, delays, direction, 2, sourceStyle)
        sampleMorphValues(sourceDepth, targetDepth, uniforms.uMorph.value, delays, direction, 2, sourceDepth)
        for (const name of ['position', 'aSourceStyle', 'aSourceDepth']) geometry.attributes[name].needsUpdate = true
        sourceRotation = uniforms.uRotation.value
        sourceProject = projectWeight
        uniforms.uMorph.value = 0
        uniforms.uDirection.value = 0
        direction = 0
        elapsed = 0
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

  function contextLost(event) {
    event.preventDefault()
    destroy()
    onUnavailable('context-loss')
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
    frame = 0
    resizeObserver?.disconnect()
    visibilityObserver?.disconnect()
    document.removeEventListener('visibilitychange', visibilityChanged)
    window.removeEventListener('resize', resize)
    canvas.removeEventListener('webglcontextlost', contextLost)
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    scene.clear()
  }

  let shaderError = false
  renderer.debug.onShaderError = () => { shaderError = true }
  renderer.compile(scene, camera)
  if (shaderError) {
    destroy()
    throw new Error('The particle shader could not be initialized.')
  }
  resizeObserver?.observe(container)
  visibilityObserver?.observe(container)
  document.addEventListener('visibilitychange', visibilityChanged)
  window.addEventListener('resize', resize)
  canvas.addEventListener('webglcontextlost', contextLost)
  resize()
  schedule()

  return { setSection, setMotionPreferences, destroy, getRenderSize: () => renderSize }
}
