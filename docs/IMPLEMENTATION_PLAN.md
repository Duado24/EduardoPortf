# Complete particle portfolio architecture

The user has authorized all six sections. The Home/About stopping gate is no
longer active. [The active brief](../references/PORTFOLIO_BRIEF.md) controls
composition, content integrity, and the current fixed desktop layout.

## Components

```text
App
├── Header (ordinary navigation + compact disclosure)
├── Main
│   ├── ParticleStage (persistent across routes)
│   │   ├── WebGL ParticleRenderer
│   │   ├── Animated CanvasParticleRenderer
│   │   └── StaticFallback (reduced motion / no drawing API)
│   └── One active semantic section
│       ├── Home (globe + spatial navigation)
│       ├── About (profile + concise story)
│       ├── Projects (selector + authentic evidence + summary + media dialog)
│       ├── Journey (five nodes + one detail)
│       ├── Skills (five groups / compact category selection)
│       └── Contact (three contacts + résumé)
└── Footer (location + actual motion controls)
```

`useSectionRoute` owns canonical hashes, history entry keys, link interception,
and focus restoration. Scroll management is disabled on desktop. Touch phones
can restore their document position. Unknown fragments resolve to Home; all
six actual section hashes remain enabled. Project/Journey selections do not
create new browser history entries.

## Renderer

Six deterministic targets share position/style array interfaces. WebGL uses one
Points geometry with four persistent attributes; frames change only uniforms.
Navigation snapshots current displayed points once for smooth interruption.
The Canvas2D fallback shares this model, buckets drawing into at most twenty
fills, and uses fewer particles/DPR1. Capability hints choose lighter animation
instead of silently disabling motion. Context or shader failure falls back to
Canvas2D. Slow rendering reduces quality/rate before changing rendering engines.

The stage keeps an inactive canvas per engine because a WebGL canvas cannot
later become a 2D canvas. Only one engine draws. Both are disposed correctly,
pause in hidden tabs, and stop on settled inner states. Reduced motion is static
by default; Enable motion is an explicit user choice for this visit.

## Content and artifacts

All four projects have evidence with provenance. AutoCanv is default/featured.
No invented live deployments or public repository URLs are supplied. The media
dialog provides a larger view and native focus/close behavior. The downloadable
one-page résumé and accessible HTML counterpart use only verified sources.
The supplied credential/course archives are never public assets or runtime input.

## Layout

The current build retains the fixed desktop requirement and different spatial
compositions. Narrow and short desktop layouts recompose and abbreviate content;
extreme zoom uses native selectors. Touch-phone inner sections use document flow.
The newer suggestion for scrollable desktop inner pages/project cards is a
pending user choice, not an implicit change to the earlier hard requirement.

## Remaining verification boundaries

Automated checks cannot establish actual screen-reader usability, device battery
cost, or sustained hardware GPU performance. No publishing is authorized as
part of the local completion request. Follow the existing Pages workflow when
publication is explicitly requested.
