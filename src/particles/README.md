# Persistent particle portfolio

All six routes have original targets in one shared point interface: geographic
globe, profile, open terminal frame, route/compass, connected chip, and envelope.
Normal WebGL frames change uniforms, not React state or every vertex. Navigation
uploads targets once; interrupted transitions snapshot current rendered positions.

WebGL begins with 5,600 desktop / 1,800 smaller-screen dots and capped DPR.
Desktop morphs last 1,000ms; smaller-screen morphs last450ms. Rendering aims for
30FPS, pauses when hidden/off-screen, and stops when an inner state settles.
Capability hints no longer force static graphics. Supported software WebGL is
allowed; GPU failures/context loss fall back to animated Canvas2D.

Canvas2D uses 1,800 desktop / 1,200 mobile dots (900 for capability/data-saving
hints), DPR1, shared target/morph logic, and at most20 bucketed fills per frame.
Slow rendering reduces count/rate. Both engines reuse arrays and clean up their
observers/listeners/resources. Only one engine draws; the other canvas is hidden.
Reduced motion defaults to static SVG targets; explicit Enable motion opts in
for this visit. Manual Pause stops rotation and makes navigation instant.

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

Run numeric invariants with `node --test src/particles/shapeTargets.test.js`.
Actual browser/device measurements remain necessary to tune dot size, count,
geographic readability, and transition duration after this prototype review.
