# Persistent particle portfolio

All six routes use one shared point interface: geographic globe on Home/About,
volumetric aerostatic globe on Projects, route/compass, connected chip, and envelope.
Normal WebGL frames change uniforms, not React state or every vertex. Navigation
uploads targets once; interrupted transitions snapshot current rendered positions.

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
