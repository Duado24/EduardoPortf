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
  snapshotMorph,
  snapshotStyle,
  visualState,
} from './shapeTargets.js'

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec2 aSourceStyle;
  attribute vec2 aTargetStyle;
  uniform float uMorph;
  uniform float uRotation;
  uniform float uGlobeWeight;
  uniform float uPointSize;
  varying float vOpacity;
  varying float vAccent;

  void main() {
    vec3 p = mix(position, aTarget, uMorph);
    float c = cos(uRotation);
    float s = sin(uRotation);
    p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
    vec2 style = mix(aSourceStyle, aTargetStyle, uMorph);
    float depth = 0.35 + 0.65 * smoothstep(-0.35, 0.85, p.z);
    vOpacity = style.x * mix(1.0, depth, uGlobeWeight);
    vAccent = style.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uPointSize * mix(1.0, 1.2, vAccent);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  varying float vOpacity;
  varying float vAccent;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5) discard;
    float coverage = 1.0 - smoothstep(0.25, 0.5, radius);
    gl_FragColor = vec4(mix(uBaseColor, uAccentColor, vAccent), coverage * vOpacity);
    #include <colorspace_fragment>
  }
`

export function createParticleRenderer({ canvas, container, section, motionPaused, reducedMotion, onUnavailable }) {
  const mobile = window.matchMedia('(max-width: 760px)').matches
  const count = mobile ? MOBILE_PARTICLES : MAX_PARTICLES
  const targets = createShapeTargets(count)
  const initialState = visualState(section)
  const source = targets[initialState].positions.slice()
  const target = targets[initialState].positions.slice()
  const sourceStyle = targets[initialState].style.slice()
  const targetStyle = targets[initialState].style.slice()

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

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    uniforms: {
      uMorph: { value: 1 },
      uRotation: { value: 0 },
      uGlobeWeight: { value: initialState === 'home' ? 1 : 0 },
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
  let transitioning = false
  let sourceGlobe = initialState === 'home' ? 1 : 0
  let targetGlobe = sourceGlobe
  let inViewport = true
  let performanceDrawLimit = count
  let slowFrames = 0
  let performanceTier = 0
  let frameInterval = 1000 / 30

  function canAnimate() {
    return !disposed && !document.hidden && inViewport && !paused && !reduced && (transitioning || currentState === 'home')
  }

  function draw() {
    if (!disposed && !document.hidden && inViewport) renderer.render(scene, camera)
  }

  function finishTransition() {
    material.uniforms.uMorph.value = 1
    material.uniforms.uGlobeWeight.value = targetGlobe
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
    if (transitioning) {
      elapsed += delta
      const progress = smoothProgress(elapsed / duration)
      material.uniforms.uMorph.value = progress
      material.uniforms.uGlobeWeight.value = sourceGlobe + (targetGlobe - sourceGlobe) * progress
      if (elapsed >= duration) finishTransition()
    } else if (currentState === 'home') {
      material.uniforms.uRotation.value += delta / 1000 * HOME_ROTATION_SPEED
    }

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
    renderer.setSize(Math.round(width), Math.round(height), false)
    const aspect = width / height
    const halfHeight = Math.max(1.2, 1.2 / aspect)
    camera.left = -halfHeight * aspect
    camera.right = halfHeight * aspect
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    material.uniforms.uPointSize.value = (narrow ? 1.9 : 2.15) * dpr
    geometry.setDrawRange(0, Math.min(performanceDrawLimit, narrow ? MOBILE_PARTICLES : count))
    duration = narrow ? 450 : 1000
    draw()
  }

  function setSection(nextSection) {
    if (disposed) return
    const nextState = visualState(nextSection)
    if (nextState === currentState) return
    const uniforms = material.uniforms
    snapshotMorph(source, target, uniforms.uMorph.value, uniforms.uRotation.value, source)
    snapshotStyle(sourceStyle, targetStyle, uniforms.uMorph.value, sourceStyle)
    target.set(targets[nextState].positions)
    targetStyle.set(targets[nextState].style)
    for (const name of ['position', 'aTarget', 'aSourceStyle', 'aTargetStyle']) geometry.attributes[name].needsUpdate = true
    sourceGlobe = uniforms.uGlobeWeight.value
    targetGlobe = nextState === 'home' ? 1 : 0
    uniforms.uRotation.value = 0
    uniforms.uMorph.value = 0
    currentState = nextState
    elapsed = 0
    transitioning = true
    if (paused || reduced) finishTransition()
    draw()
    resetAnimationClock()
  }

  function setMotionPreferences(nextPaused, nextReduced) {
    if (disposed) return
    paused = nextPaused
    reduced = nextReduced
    if ((paused || reduced) && transitioning) finishTransition()
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

  return { setSection, setMotionPreferences, destroy }
}
