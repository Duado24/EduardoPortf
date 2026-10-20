# Persistent particle portfolio

All six sections use one shared point interface: geographic globe on Home/About,
volumetric aerostatic globe on Projects, a distributed southern sky on Journey,
a knight keeping watch by a campfire on Skills, and an envelope on Contact. Journey's full sky,
landscape, and selectable milestone anchors are SVG and semantic HTML over
that same renderer; there is no second WebGL context or continuous scene loop.
Its visual coordinates stay separate from the factual milestone data. Normal
WebGL frames change uniforms, not React state or every vertex. Navigation uploads
targets once; interrupted transitions snapshot current rendered positions.

WebGL begins with 5,600 desktop / 1,800 smaller-screen dots and capped DPR.
Ordinary desktop morphs last 1,000ms; smaller-screen morphs last 450ms. World ↔
Projects transitions last 2,000ms desktop / 1,200ms mobile, with feature delays,
latitude/azimuth correspondence, and a curved placement path. Envelope particles
resolve before the ropes and architecture. Rendering aims for 30FPS, pauses when
hidden/off-screen, and stops when a nonmoving inner state settles. Projects uses
restrained float, pitch, and roll, with front/back opacity in both renderers.
Capability hints no longer force static graphics. Supported software WebGL is
allowed; GPU failures/context loss fall back to animated Canvas2D.

Canvas2D uses 1,800 desktop / 1,200 mobile dots (900 for capability/data-saving
hints), DPR1, shared target/morph logic, and at most20 bucketed fills per frame.
Slow rendering reduces count/rate. Both engines reuse arrays and clean up their
observers/listeners/resources. Only one engine draws; the other canvas is hidden.
Reduced motion stops idle animation and uses a simple 220ms Canvas interpolation
for world ↔ Projects; other states settle immediately. Explicit Enable motion
opts in for this visit. Manual Pause stops rotation and makes navigation instant.

## Aerostatic target

`balloon-samples.json` is generated from the approved detailed HTML prototype in
`references/claude/aerostatic_globe_detailed.html`. Run
`node scripts/generate-balloon-targets.mjs` to regenerate it without a browser or
additional dependencies. Its original surface-of-revolution profile and detailed
architecture are resampled into exactly 5,600 points. Every fallback prefix retains
all 14 feature groups; the envelope receives 67.1% of the population. Shell sampling
uses surface area, and line sampling retains negative space. No particles are
spawned for atmospheric extras.

Inspect the paused completed object at `?debug=balloon`. To inspect the transition,
open `#about`, select Projects, and reverse using About or Home. Geometry, style,
depth, and placement snapshot the rendered state when navigation is interrupted.
Canvas backing size stays fixed while the object follows its path, then resizes
once at arrival. Content fades are coordinated with that same transition clock;
hidden content is inert until it becomes visible.

## Geography and attribution

`globe-samples.json` is baked from the public-domain **Natural Earth 1:110m Admin 0
countries** dataset. Land and Peru classifications use the actual polygon rings,
including holes, rather than invented continent approximations. It is a visual
representation at that dataset's scale, not a boundary reference map. The globe
initially faces longitude 65°W so Peru is visible. The sample file records its
source URL and SHA-256; no geographic request is made at runtime.

- Dataset: https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/
- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Public-domain terms: https://www.naturalearthdata.com/about/terms-of-use/

To reproduce the asset, download that GeoJSON, verify its hash against the sample
metadata, then run `node src/particles/generate-globe.mjs /path/to/file.geojson`.
The preparation script is not part of the browser bundle.

Run target and transition invariants with `npm test`.
Actual browser/device measurements remain necessary to tune dot size, count,
geographic readability, and transition duration after this prototype review.

## Journey recovery and reference fidelity

The supplied `references/claude/journeyConstellations.*` reference is the source
for the 5,044 Hipparcos catalog stars, 88 constellation line sets, stereographic
projection, great-circle camera flights, Milky Way distribution, and stylized
llama outlines. `JourneyScene.js` adapts its math and drawing code; it owns no RAF,
observers, pointer handlers, or timers. Each active particle renderer drives it
from its existing animation clock and stops requesting frames when the camera
settles. Pause and reduced motion settle camera selections immediately.

`journeyConstellations.js` maps the six verified portfolio IDs, in the requested
order, to Crux, Libra, Gemini, Orion, Cygnus, and Ursa Major. Cards read the existing
portfolio data. Constellation associations are personal metaphors; no chronology,
completion claims, or historical meaning is inferred from a constellation.

The primary particles really morph between the globe, balloon, sky, and other
shapes. Their Journey target is the current spherical camera projection, using
fixed, brightest-first catalog identities. Geometry, brightness, size, depth,
rotation, and placement snapshot on interruption. Balloon samples and feature
delays are unchanged. Renderer budgets remain 5,600/1,800 WebGL and
1,800/1,200/900 Canvas. A lightweight detail canvas adds the reference Milky Way,
constellation strokes, labels, llama outlines, and catalog stars beyond the
primary budget. That layer fades in during arrival; it is not the morph target
and does not run an independent animation loop. It redraws only on view changes,
camera flight, or resize. A static SVG chart and all HTML controls remain usable
if both canvas backends fail.

The six destinations use cataloged equatorial coordinates, not a planar CSS pan.
Flights snapshot the current spherical camera before retargeting. Milky Way
points and llama boundaries remain artistic; this is a celestial-sphere tour,
not a simulation of the sky visible from Peru at one date and time.
The full Ursa Major constellation is labeled the Great Bear, not the Big Dipper.
The llama and baby llama are identified as stylized Yacana and Uñallamacha.

Attribution: d3-celestial, BSD-3-Clause, `public/licenses/d3-celestial.txt`.
Cultural context: https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx
Additional primary source: https://adsabs.harvard.edu/pdf/2020JAHH...23..390G

Run `npm test`, `npm run lint`, and `npm run build`. With a server running, run
`npm run test:journey:browser`; `PORTFOLIO_URL` defaults to
`http://localhost:5174/EduardoPortf/`. `JOURNEY_SCREENSHOTS` sets the output folder.
The browser checks all routes, interruptions, resize/history, all six camera
selections, keyboard/touch, names, reveal, pause/reduced motion, Canvas fallback,
and complete canvas failure. Headless software WebGL checks do not replace
physical mobile/GPU profiling.

## Skills: The Last Watch

`watch-samples.json` is baked from the approved
`references/claude/the_last_watch_tweak_claude_5600 (1).html`: its own scene
builder and 5,600-particle tuning run once in Node via
`node scripts/generate-watch-targets.mjs`. Samples are ordered per kind by
radical inverse, so the 1,800 / 1,400 / 900 budgets are prefixes that keep the
knight, cloak, logs, embers, stones, flame, sparks, smoke and dust.

`watchTarget.js` views the scene from one fixed camera, mirrored so the knight
sits left of the fire, and places it per viewport inside the full-screen sky
region Skills shares with Journey. Arriving from Journey, the sky tilts down to
the horizon. Fire lighting, flame, sparks, smoke and dust animate in the vertex
shader (and `watchShade()` for Canvas2D); the selected skill category tints the
flame and its light, and stokes the fire.
