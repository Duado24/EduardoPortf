> **Current direction:** Use [the active portfolio brief](../PORTFOLIO_BRIEF.md) for composition and implementation scope. This context bundle supplies factual content; its earlier camera, scrolling, and prototype approval directions are superseded by the later user instructions. All six sections are now authorized.

# Eduardo Villanueva — Portfolio Codex Context Bundle

This bundle contains the source material and instructions for rebuilding Eduardo's professional portfolio.

## Start Here

1. Read `AGENTS.md` completely.
2. Inspect the real supporting files under `references/`.
3. Audit the existing portfolio repository before modifying it.
4. Do not invent metrics, technologies, experience, project outcomes, certifications, or competition results.

## Included Files

### `AGENTS.md`
The main source of truth for:
- portfolio content
- interaction model
- world/planet navigation concept
- visual direction
- shader/background requirements
- accessibility rules
- performance requirements
- project descriptions
- journey/experience content
- implementation phases

### `references/AutoCanv2.zip`
The real AutoCanv project. This is the flagship portfolio project and should be inspected for accurate technical details and authentic visuals.

### `references/appsscript.zip`
The real Canvas HTML Generator / Google Apps Script project. Inspect it rather than relying only on the summary in AGENTS.md.

### `references/Resume_Eduardo_Villanueva_Front_End_Developer_2026-08.pdf`
Eduardo's resume. Use it to verify professional experience, education, skills, and wording.

### `references/OldPort.zip`
The old portfolio source. It was originally created for coursework. Reuse only useful technical infrastructure; do not preserve fake/placeholder content.

### `references/mcdonalds_layout_reference.png`
Visual reference that inspired the newest navigation idea: a small central world with destinations/sections around it. The new portfolio should NOT copy McDonald's branding or artwork. Use the interaction idea only.

## Current Design Concept

The latest direction is an interactive "world" portfolio:

- A stylized technical world/planet sits near the center in the default state.
- About, Projects, Journey, Skills, and Contact are destinations around it.
- On desktop, users navigate primarily by clicking a destination rather than scrolling through a conventional long page.
- Selecting a section moves/rotates/zooms the world into a new camera/layout state.
- The world remains partially visible and becomes part of each section composition.
- Example: Projects can push/zoom the world toward the left so project content opens on the right.
- Mobile should preserve the concept but allow normal vertical scrolling inside content for usability and accessibility.
- Standard navigation must remain available; the world must not be the only navigation mechanism.
- Hash states should support direct links and browser Back/Forward when practical.

## Project Presentation

Do not showcase projects as image-only cards.

Each project should communicate:
- what problem it addresses
- what Eduardo built
- authentic visual evidence
- core technologies
- honest status
- repository/demo link when available

Use the most authentic visual for each project:
- UI screenshots
- short WebM/MP4 loops
- terminal captures
- architecture diagrams
- before/after examples

Prefer optimized 3–6 second WebM/MP4 loops over GIFs.

AutoCanv should be visually dominant.

## Motion Budget

Main visual moments:
1. world/camera navigation
2. subtle shader background

Optional:
3. restrained skills marquee

Project demo loops should only become active inside the Projects state and should pause when not visible.

Avoid combining many competing animations.

## UX/UI Notes Adopted

- Projects should receive higher priority than Journey.
- Hero/content should be left-aligned where appropriate.
- Muted green should be used as a signal, not everywhere.
- Sans-serif for main typography; monospace for technical metadata.
- Skills should remain directly scannable; a marquee can be decorative, not the only way to see skills.
- Journey should use a simple left-aligned vertical timeline.
- Real AutoCanv visuals are more important than decorative effects.
- Accessibility should be visibly demonstrated by the portfolio itself.
- Do not claim a Lighthouse score unless actually measured.
- Keep the shader low-contrast and computationally inexpensive.

## First Instruction to Codex

Read `AGENTS.md` and inspect every file under `references/`.

Then audit the existing portfolio repository and return:
1. current architecture
2. files/components worth keeping
3. files/components to remove or rewrite
4. proposed component architecture
5. world/camera state model
6. navigation and URL-state approach
7. accessibility strategy
8. performance strategy
9. implementation phases
10. technical risks

Do not modify the repository until the audit and plan are complete.
