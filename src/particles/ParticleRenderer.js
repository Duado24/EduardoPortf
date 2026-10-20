import { createJourneySky } from './JourneyScene.js'
import { SKY_STARS as STARS, CONS } from '../data/astronomyCatalog.js'
import { journeyConstellations } from '../data/journeyConstellations.js'
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
  Vector3,
  Vector4,
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
import { placeWatch, WATCH_CAMERA, watchFlare, watchLayout } from './watchTarget.js'

// Journey and Skills share the full-screen sky region and its slow transitions.
const SKY_STATES = ['journey', 'skills']
const DEFAULT_FLAME = [1, 0.7, 0.42]

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute vec4 aWatchA;
  attribute vec4 aWatchB;
  attribute float aSourceSize;
  attribute float aTargetSize;
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
  uniform float uSourceLift;
  uniform float uTargetLift;
  uniform float uIdle;
  uniform float uTime;
  uniform float uFlare;
  uniform vec3 uFlameColor;
  uniform vec3 uWatchTarget;
  uniform vec4 uWatchCamera;
  uniform vec3 uWatchLayout;
  varying float vOpacity;
  varying float vAccent;
  varying float vProject;
  varying vec4 vWatch;

  // The Last Watch camera (fixed, mirrored), placed in shared camera units; see watchTarget.js.
  vec3 watchView(vec3 q) {
    q -= uWatchTarget;
    q = vec3(q.x * uWatchCamera.x + q.z * uWatchCamera.y, q.y, -q.x * uWatchCamera.y + q.z * uWatchCamera.x);
    q = vec3(q.x, q.y * uWatchCamera.z - q.z * uWatchCamera.w, q.y * uWatchCamera.w + q.z * uWatchCamera.z);
    float w = 4.6 + q.z;
    return vec3(uWatchLayout.x - q.x / w * uWatchLayout.z, uWatchLayout.y + q.y / w * uWatchLayout.z, w);
  }

  void main() {
    float m = uMorph;
    if (uDirection > 0.5) m = smoothstep(aDelay, min(0.98, aDelay + 0.60), uMorph);
    if (uDirection < -0.5) m = 1.0 - smoothstep(aDelay, min(0.98, aDelay + 0.60), 1.0 - uMorph);
    // The Journey/Skills descent: the sky's points rise away while the bonfire rises into view.
    vec3 p = mix(position + vec3(0.0, uSourceLift, 0.0), aTarget + vec3(0.0, uTargetLift, 0.0), m);

    // Skills: the reference's fire lighting and fire effects; mirrors watchShade() in watchTarget.js.
    // Kinds: 0 ground, 1 flame, 2 spark, 3 smoke, 4 dust, 5 metal, 6 cloth, 7 wood, 8 ember.
    vec4 watch = vec4(0.949, 0.922, 0.882, 1.0);
    float watchSize = 1.0;
    if (uIdle > 0.001) {
      float kind = aWatchA.x;
      float sd = aWatchA.y;
      float tn = aWatchA.z;
      float intensity = (1.0 + 0.16 * sin(uTime * 8.3) + 0.1 * sin(uTime * 13.7 + 1.0) + 0.07 * sin(uTime * 21.0 + 2.0)) * (1.0 + 0.35 * uFlare);
      if (kind < 0.5 || kind > 4.5) {
        float lit = clamp(aWatchA.w * intensity, 0.0, 1.0);
        float da = abs(aWatchB.w);
        float al = da * (0.26 + 0.74 * lit) * (aWatchB.w < 0.0 ? 0.55 : 1.0) + (tn > 0.9 ? 0.12 * da : 0.0);
        if (kind < 0.5) al *= 0.6;
        watch.rgb = mix(watch.rgb, uFlameColor, smoothstep(0.5, 1.0, lit));
        if (kind > 7.5) {
          watch.rgb = uFlameColor;
          al = clamp(0.7 + 0.3 * sin(sd * 40.0 + uTime * 5.0), 0.0, 1.0);
        }
        watch.a = clamp(al, 0.07, 1.0);
      } else {
        vec3 rest = aWatchB.xyz;
        vec3 q = rest;
        float size = 1.05;
        if (kind < 1.5) {
          float ph = fract(uTime * (0.45 + 0.25 * fract(sd * 5.3)) + sd);
          float hm = (0.35 + 0.75 * (1.0 - clamp(length(rest.xz) / 0.21, 0.0, 1.0))) * (0.7 + 0.3 * fract(sd * 11.0)) * (1.0 + 0.6 * uFlare);
          q.y = 0.12 + ph * hm;
          q.xz *= 1.0 - ph * 0.9;
          q.x += 0.06 * ph * sin(uTime * 5.0 + sd * 50.0 + ph * 7.0) + 0.03 * ph * ph * sin(uTime * 2.3 + sd * 9.0);
          q.z += 0.06 * ph * cos(uTime * 4.3 + sd * 37.0 + ph * 6.0) + 0.025 * ph * ph * cos(uTime * 1.9 + sd * 13.0);
          watch = vec4(mix(vec3(0.96, 0.92, 0.86), uFlameColor, clamp(ph * 1.5, 0.0, 1.0)), (1.0 - ph) * 0.95);
          size = 1.75 * (1.0 - ph * 0.45);
        } else if (kind < 2.5) {
          float ph = fract(uTime * 0.1 + sd);
          q.y = 0.2 + ph * (2.2 + 1.1 * uFlare);
          q.x += 0.5 * sin(uTime * 0.8 + sd * 30.0) * ph + 0.2 * ph * ph;
          q.z += 0.4 * cos(uTime * 0.6 + sd * 20.0) * ph;
          watch = vec4(uFlameColor, (1.0 - ph) * (0.45 + 0.55 * sin(uTime * 13.0 + sd * 80.0)));
          size = 1.2;
        } else if (kind < 3.5) {
          float ph = fract(uTime * 0.06 + sd);
          q.y = 0.7 + ph * 1.7;
          q.xz *= 1.0 + ph * 3.0;
          q.x += 0.3 * sin(uTime * 0.3 + sd * 10.0) * ph;
          q.z += 0.2 * ph;
          watch.a = 0.1 * sin(ph * 3.14159);
          size = 1.1;
        } else {
          q += 0.12 * vec3(sin(uTime * 0.2 + sd * 40.0), sin(uTime * 0.17 + sd * 20.0), cos(uTime * 0.15 + sd * 30.0));
          float dd = length(q - vec3(0.0, 0.32, 0.0));
          float warmth = 1.0 / (1.0 + 9.0 * dd * dd);
          watch = vec4(mix(watch.rgb, uFlameColor, warmth), 0.14 + 0.45 * warmth);
          size = 0.9;
        }
        vec3 moved = watchView(q);
        vec3 still = watchView(rest);
        p.xy += (moved.xy - still.xy) * uIdle;
        watchSize = size / 1.05 * still.z / moved.z;
      }
    }
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
    vOpacity = mix(style.x * (1.0 + (depth - 1.0) * depthWeights.x + (projectDepth - 1.0) * depthWeights.y), watch.a, uIdle);
    vAccent = style.y;
    vProject = depthWeights.y;
    // Reference colors are sRGB; the output stage expects linear.
    vWatch = vec4(pow(watch.rgb, vec3(2.2)), uIdle);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = mix(aSourceSize, aTargetSize, m) * uPointSize * mix(1.0, 1.2, vAccent) * mix(1.0, watchSize, uIdle);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  varying float vOpacity;
  varying float vAccent;
  varying float vProject;
  varying vec4 vWatch;

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    if (radius > 0.5) discard;
    // Skills draws solid dots like its reference; other states keep soft edges.
    float coverage = mix(1.0 - smoothstep(mix(0.25, 0.40, vProject), 0.5, radius), 1.0, vWatch.a);
    gl_FragColor = vec4(mix(mix(uBaseColor, uAccentColor, vAccent), vWatch.rgb, vWatch.a), coverage * vOpacity);
    #include <colorspace_fragment>
  }
`

export function createParticleRenderer({ canvas, skyCanvas, journeyView, container, section, motionPaused, reducedMotion, flame = DEFAULT_FLAME, onUnavailable, onMorphFrame }) {
  const mobile = window.matchMedia('(max-width: 760px)').matches
  const count = mobile ? MOBILE_PARTICLES : MAX_PARTICLES
  const targets = createShapeTargets(count)
  let placement = watchLayout({ width: window.innerWidth, height: window.innerHeight })
  placeWatch(placement, targets.skills.positions)
  const sky = createJourneySky(skyCanvas, { stars: STARS, cons: CONS, milestones: journeyConstellations, count })
  sky.setView(journeyView, true)
  sky.project(targets.journey.positions, targets.journey.style)
  const initialState = visualState(section)
  const source = targets[initialState].positions.slice()
  const target = targets[initialState].positions.slice()
  const sourceStyle = targets[initialState].style.slice()
  const targetStyle = targets[initialState].style.slice()
  const sourceSize = new Float32Array(count).fill(1)
  const targetSize = new Float32Array(count).fill(1)
  if (visualState(section) === 'journey') { sky.project(target, targetStyle, targetSize); sourceSize.set(targetSize) }
  if (initialState === 'skills') { targetSize.set(targets.skills.sizes); sourceSize.set(targetSize) }
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
  geometry.setAttribute('aSourceSize', new BufferAttribute(sourceSize, 1).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTargetSize', new BufferAttribute(targetSize, 1).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTarget', new BufferAttribute(target, 3).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aSourceStyle', new BufferAttribute(sourceStyle, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTargetStyle', new BufferAttribute(targetStyle, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aSourceDepth', new BufferAttribute(sourceDepth, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aTargetDepth', new BufferAttribute(targetDepth, 2).setUsage(DynamicDrawUsage))
  geometry.setAttribute('aDelay', new BufferAttribute(delays, 1))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  geometry.setAttribute('aWatchA', new BufferAttribute(targets.skills.watchA, 4))
  geometry.setAttribute('aWatchB', new BufferAttribute(targets.skills.watchB, 4))

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
      // sRGB like the reference; the shader converts after mixing.
      uFlameColor: { value: new Vector3(...flame) },
      uWatchTarget: { value: new Vector3(...WATCH_CAMERA.target) },
      uWatchCamera: { value: new Vector4(...WATCH_CAMERA.rotation) },
      uWatchLayout: { value: new Vector3(placement.x, placement.y, placement.scale) },
      uSourceLift: { value: 0 },
      uTargetLift: { value: 0 },
      uIdle: { value: initialState === 'skills' ? 1 : 0 },
      uTime: { value: 0 },
      uFlare: { value: 0 },
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
  let previousState = initialState
  let skillsWeight = initialState === 'skills' ? 1 : 0
  let sourceSkills = skillsWeight
  let targetSkills = skillsWeight
  let descentSign = 0
  const flameColor = flame.slice()
  let flameTarget = flame.slice()
  let burst = 0
  sky.setDescent(initialState === 'skills' ? 1 : 0)

  function updateSkyTarget() {
    if (currentState !== 'journey') return
    sky.project(target, targetStyle, targetSize)
    geometry.attributes.aTarget.needsUpdate = true
    geometry.attributes.aTargetStyle.needsUpdate = true
    geometry.attributes.aTargetSize.needsUpdate = true
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
      (transitioning || !reduced && (currentState === 'home' || currentState === 'projects' || currentState === 'skills' || currentState === 'journey' && sky.moving))
  }

  // The sky stays up between Journey and Skills; arriving from elsewhere it fades in late in the morph.
  function skyOpacity() {
    if (!SKY_STATES.includes(currentState)) return 0
    if (!transitioning || SKY_STATES.includes(previousState)) return 1
    return smoothProgress((material.uniforms.uMorph.value - .45) / .55)
  }

  function updateDescent(raw) {
    if (!descentSign) return
    const eased = smoothProgress(raw)
    material.uniforms.uSourceLift.value = descentSign * placement.lift * eased
    material.uniforms.uTargetLift.value = -descentSign * placement.lift * (1 - eased)
    sky.setDescent(descentSign > 0 ? eased : 1 - eased)
  }

  // Flame tint eases toward the selected category; a selection stokes the fire.
  function updateFlame(seconds) {
    const blend = seconds === null ? 1 : Math.min(1, seconds * 3)
    for (let i = 0; i < 3; i++) flameColor[i] += (flameTarget[i] - flameColor[i]) * blend
    material.uniforms.uFlameColor.value.set(...flameColor)
    if (seconds !== null) burst *= Math.pow(0.18, seconds)
    material.uniforms.uFlare.value = watchFlare(material.uniforms.uTime.value, burst)
  }

  function setFlame(color, flare = false) {
    if (disposed) return
    flameTarget = color.slice()
    const still = paused || reduced || !canAnimate()
    if (flare && !still) burst = 1
    if (still) {
      updateFlame(null)
      draw()
    }
    resetAnimationClock()
  }

  function placeSkills() {
    placement = watchLayout({ width: window.innerWidth, height: window.innerHeight })
    placeWatch(placement, targets.skills.positions)
    material.uniforms.uWatchLayout.value.set(placement.x, placement.y, placement.scale)
    sky.setHorizon(placement.horizon)
    if (currentState !== 'skills') return
    target.set(targets.skills.positions)
    geometry.attributes.aTarget.needsUpdate = true
  }

  function positionProject() {
    points.rotation.z = Math.sin(projectPhase * 0.72) * 0.018 * projectWeight
    points.position.y = (Math.sin(projectPhase * 1.05) * 0.024 + Math.sin(projectPhase * 0.43) * 0.009) * projectWeight
    material.uniforms.uPitch.value = (0.035 + Math.sin(projectPhase * 0.61) * 0.01) * projectWeight
    material.uniforms.uPointSize.value = (pointBaseCss + (1.5 - pointBaseCss) * projectWeight) * pointDpr * placementPointScale
  }

  function draw() {
    sky.present(skyOpacity())
    if (!disposed && !document.hidden && inViewport) renderer.render(scene, camera)
  }

  function finishTransition() {
    material.uniforms.uMorph.value = 1
    material.uniforms.uRotation.value = targetRotation
    projectWeight = targetProject
    skillsWeight = targetSkills
    material.uniforms.uIdle.value = skillsWeight
    if (descentSign) updateDescent(1)
    descentSign = 0
    material.uniforms.uSourceLift.value = 0
    material.uniforms.uTargetLift.value = 0
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
    if (currentState === 'journey' && sky.moving) { sky.update(delta / 1000); updateSkyTarget() }
    if (!reduced && (projectWeight || targetProject)) projectPhase += delta / 1000
    if (!reduced && (skillsWeight || targetSkills)) material.uniforms.uTime.value += delta / 1000
    updateFlame(delta / 1000)
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
      skillsWeight = sourceSkills + (targetSkills - sourceSkills) * idleProgress
      material.uniforms.uIdle.value = skillsWeight
      updateDescent(raw)
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
    // Before the sky redraw, so it draws the new horizon once.
    placeSkills()
    sky.resize()
    updateSkyTarget()
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
    sampleMorphValues(sourceSize, targetSize, uniforms.uMorph.value, delays, direction, 1, sourceSize)
    globePair = (currentState === 'home' && nextState === 'projects') || (currentState === 'projects' && nextState === 'home')
    const skyPair = SKY_STATES.includes(currentState) || SKY_STATES.includes(nextState)
    // Staggered (delayed) morphs belong to the globe ↔ balloon pair and to Journey's sky;
    // Skills ↔ any other section morphs all at once so nothing hangs on the old shape.
    const staggered = globePair || skyPair && (currentState === 'journey' || nextState === 'journey')
    direction = !reduced && staggered ? ['journey', 'skills', 'projects'].includes(nextState) ? 1 : -1 : 0
    // Journey → Skills tilts the view down to the horizon; Skills → Journey looks back up.
    descentSign = reduced ? 0 : currentState === 'journey' && nextState === 'skills' ? 1 : currentState === 'skills' && nextState === 'journey' ? -1 : 0
    if (nextState === 'skills') placeSkills()
    if (!descentSign && SKY_STATES.includes(nextState)) sky.setDescent(nextState === 'skills' ? 1 : 0)
    material.uniforms.uSourceLift.value = 0
    material.uniforms.uTargetLift.value = 0
    if (nextState === 'journey') { sky.resize(); sky.project(targets.journey.positions, targets.journey.style) }
    targetSize.fill(1)
    if (nextState === 'skills') targetSize.set(targets.skills.sizes)
    if (nextState === 'journey') sky.project(targets.journey.positions, targets.journey.style, targetSize)
    target.set(targets[nextState].positions)
    targetStyle.set(targets[nextState].style)
    for (let i = 0; i < count; i++) {
      targetDepth[i * 2] = nextState === 'home' ? 1 : 0
      targetDepth[i * 2 + 1] = nextState === 'projects' ? 1 : 0
    }
    for (const name of ['aSourceSize', 'aTargetSize', 'position', 'aTarget', 'aSourceStyle', 'aTargetStyle', 'aSourceDepth', 'aTargetDepth']) geometry.attributes[name].needsUpdate = true
    sourceProject = projectWeight
    targetProject = nextState === 'projects' ? 1 : 0
    sourceSkills = skillsWeight
    targetSkills = nextState === 'skills' ? 1 : 0
    sourceRotation = Math.atan2(Math.sin(uniforms.uRotation.value), Math.cos(uniforms.uRotation.value))
    uniforms.uRotation.value = sourceRotation
    if (currentState === 'home' && !transitioning) lastGlobeRotation = sourceRotation
    const destinationRotation = nextState === 'home' ? lastGlobeRotation : nextState === 'projects' ? 0.35 : 0
    targetRotation = sourceRotation + Math.atan2(Math.sin(destinationRotation - sourceRotation), Math.cos(destinationRotation - sourceRotation))
    uniforms.uDirection.value = direction
    uniforms.uMorph.value = 0
    previousState = currentState
    currentState = nextState
    elapsed = 0
    placementProgressBase = 0
    projectIdleElapsed = 0
    transitionDuration = reduced && globePair ? 220 : durationOverride ?? ((globePair || skyPair) ? mobile ? 1200 : 2000 : duration)
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
    if (paused || reduced) { sky.setView(journeyView, true); updateSkyTarget() }
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
    sky.destroy()
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

  return { setJourneyView, setSection, setMotionPreferences, setFlame, destroy, getRenderSize: () => renderSize }
}
