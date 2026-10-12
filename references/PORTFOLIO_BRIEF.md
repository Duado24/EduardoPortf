# Eduardo Villanueva — active portfolio brief

This is the current implementation brief. It supersedes the earlier circuit
board and solid-world descriptions. The accompanying context bundle remains a
factual source; the user's later instructions control composition and scope.
The user has authorized completion of all sections and the Chrome animation fix.

## Composition

A near-black, restrained technical presentation built around one particle
sculpture. Home keeps the large geographic globe centered, with About, Projects,
Journey, Skills, and Contact arranged around it. Peru receives a subtle accent.
Identity supports the sculpture. Ordinary navigation is always available.

Selecting a section physically morphs the same dots into an original related
shape. The interface reorganizes around it; no permanent split-column template.
Home → globe; About → profile; Projects → open terminal frame around authentic
media; Journey → path/compass; Skills → connected chip; Contact → envelope.

The currently authorized desktop model is a fixed `100vw × 100vh` composition:
no document, section, or Journey scrolling. Reduce and recompose content to fit.
Small touch devices can use document scrolling. A later pasted critique proposes
scrollable desktop inner pages and a project grid; that conflicts with the fixed
requirement and needs the user's layout choice before replacing this model.

## Content

- About: a short introduction connecting Peru, Salt Lake City, software studies,
  and practical education workflows; Ensign work and bilingual interpreting.
- Projects: AutoCanv selected by default, compact selector, one active project.
  Explain problem, implementation, core technology, evidence, and honest status.
- Journey: five selectable nodes, one concise detail area; include work,
  CyberForce preparation, education, volunteer service, and Lima coursework.
- Skills: five readable groups; at extreme zoom, a category selector and a
  concise selection replace the full list.
- Contact: email, GitHub, LinkedIn, and a verified one-page résumé download.

AutoCanv is the flagship personal project/prototype. Ensign template work is
Professional Work. CyberForce is In Progress. Do not invent metrics, experience,
technologies, achievements, certifications, dates, or competition results.

## Visual system

Warm charcoal `#130f10`, ivory `#f3ebe1`, muted stone `#c2b2a9`, restrained
crimson `#dc8079`, and small copper signals `#d7ae79`. This Peruvian-inspired
palette uses warm red and ivory without turning the interface into a literal flag.
Shared tokens live in the Tailwind `@theme` block in `src/index.css`.
System sans typography (Inter when installed, then Segoe UI/Arial); system
monospace for metadata. No remote font request. Body text should be readable;
smaller compositions shorten content before reducing type excessively.
No separate animated background, marquee, parallax, or competing effects.

## Evidence and privacy

Use the most authentic safe evidence available. AutoCanv and HTML Generator
images capture the real supplied interfaces. AutoCanv uses clearly labeled
synthetic offline data. The template visual demonstrates real formatter source
with sample content; it is not a captured institutional course. CyberForce uses
an explicitly conceptual responsibility diagram without invented topology.
Keep credentials, private backups, reports, and course data out of public assets.

## Interaction and performance

All six hashes are active. Genuine links preserve browser semantics. Back/Forward
restore state and focus; Escape returns Home unless a dialog/menu owns the key.
Project and Journey selections are compact local controls, not additional routes.
Navigation and content remain independent of the rendering engine.

Use one persistent point scene with precomputed targets and GPU interpolation.
About and other states stop rendering after their transitions; Home rotates
slowly. Target about 30 FPS, cap DPR, pause when hidden, and reduce quality when
rendering is slow. Canvas2D must retain animated morphing when WebGL is unavailable.
Reduced motion is respected by default, with an explicit per-visit motion opt-in.

## Accessibility

Semantic landmarks and headings, a skip link, keyboard controls, visible focus,
adequate contrast, meaningful image alternatives, real dialog behavior, and
correctly labeled selects. No hover-only action or graphics-only navigation.
Do not claim full conformance or a Lighthouse score without the corresponding
measurement. Physical device and actual assistive-technology sessions still
require verification beyond automated Chromium checks.
