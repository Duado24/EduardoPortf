# Eduardo Villanueva portfolio

A complete React/Vite portfolio organized around a persistent particle sculpture.
Home, About, Projects, Journey, Skills, and Contact are all active, with distinct
particle targets and accessible HTML navigation. AutoCanv is the default featured
project. Project visuals come from the supplied source and are labeled honestly.

## Develop locally

Use Node 24 (`nvm use`), then:

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/EduardoPortf/` (or the URL printed by Vite). Destinations
around the globe and the ordinary navigation both work. Each section supports a
direct hash such as `#projects`; browser Back/Forward and Escape work too.
Projects show one selected project. Click its visual to inspect it at larger size.
Journey presents six verified experiences as an interactive constellation, with
keyboard and touch selection. Its Peru-inspired southern sky is an artistic scene,
not a date-, time-, or location-specific star chart; the existing particle
renderer remains the shared transition layer. Static SVG provides the sky and
Andean horizon; semantic HTML buttons provide the milestone controls, so the
scene adds no second renderer or continuous animation. Star coordinates are
separate from the factual milestone data. Contact includes a source-verified résumé
PDF.

```sh
npm test
npm run lint
npm run build
npm run preview
```

## Layout and animation

The current desktop layout follows the user's fixed-viewport requirement: no
document or internal scrolling. Short and zoomed windows use reduced content
and compact selectors. Touch phones use document scrolling for inner content.
The suggestion to replace desktop states with scrollable inner pages is a
separate design decision; it has not silently replaced the fixed requirement.

WebGL is preferred; an animated Canvas2D renderer handles unavailable GPUs,
context loss, low capability hints, and data saving. Both renderers rotate Home
and physically morph between targets, pause in hidden tabs, and reuse point
arrays. Reduced motion defaults to static shapes. The user can explicitly
choose Enable motion for the current visit. Pause motion remains available.

See [the active brief](references/PORTFOLIO_BRIEF.md),
[architecture](docs/IMPLEMENTATION_PLAN.md), and
[verification](docs/PROTOTYPE_REVIEW.md).

## Factual content and media

AutoCanv is a personal project/prototype. Ensign templates are Professional Work;
CyberForce is In Progress. No project adoption, achievements, certifications,
competition results, or metrics are invented. Offline demonstration content is
identified in the actual AutoCanv capture. The generator shows its built-in
sample. The template image is a supplied formatter pattern preview rather than
a live professional course. The CyberForce diagram is a conceptual responsibility
map, not an asserted deployment topology.

Private reference archives and credentials remain excluded from public files,
bundles, and deployment artifacts. No live Canvas operations are required.

## Hosting

The retained GitHub Pages base is `/EduardoPortf/`. Pull requests validate the
build; Pages deploys pushes to `main`. This work changes the local repository;
no commit, push, or deployment was performed.
