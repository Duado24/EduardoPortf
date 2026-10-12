> **Current direction:** Use [the active portfolio brief](../PORTFOLIO_BRIEF.md) for composition and implementation scope. This context bundle supplies factual content; its earlier camera, scrolling, and prototype approval directions are superseded by the later user instructions. All six sections are now authorized.

# AGENTS.md

## Project
Professional portfolio redesign for Eduardo Villanueva.

## Primary Goal
Build a polished software engineering portfolio that presents Eduardo as a practical builder with experience in front-end development, automation, LMS/education technology, accessibility, Linux/system administration, and cybersecurity.

The portfolio should feel like:
- Software Engineer
- Product Builder
- Technical Professional

It should not feel like:
- A class assignment
- A generic student portfolio
- A template-heavy personal site

---

## Existing Technical Base

The current portfolio is built with:
- React
- Vite
- Tailwind CSS
- Three.js
- GitHub Pages

Treat the old portfolio as a technical foundation only.

Potentially reusable:
- React/Vite project structure
- GitHub Pages deployment
- Component-based sections
- Mobile navigation concept
- Existing scroll reveal patterns, if cleaned up
- Three.js dependency, only if it is genuinely useful

Replace or remove:
- Placeholder/fake projects
- Placeholder/fake skills
- Generic “full stack developer” positioning
- Blue/purple gradient-heavy styling
- Generic centered hero
- Old About copy
- Old education/project cards
- Any leftover starter CSS
- Any inaccessible or incorrect markup/attributes

Do not preserve old content simply because it already exists.

---

## Core Interaction Concept

The portfolio should use a central interactive “world” or planet-like object as the primary navigation metaphor.

### Default State
- The world is centered in the viewport.
- Main destinations appear around it:
  - About
  - Projects
  - Journey
  - Skills
  - Contact
- The page should feel immersive and viewport-based on desktop.

### Section Navigation
Instead of traditional full-page vertical scrolling on desktop:
- Clicking a destination moves the camera/world toward that section.
- The world can translate, rotate, and zoom.
- The selected section becomes the active composition.
- The world should remain visible as part of the layout rather than disappearing.

Examples:
- Projects: world shifts left and partially leaves the viewport while project content appears on the right.
- Journey: world rotates/moves to another visual state while the timeline appears.
- Skills: world moves to another state while skills content becomes visible.
- Contact: another camera/world state with contact content.

Treat each section as a camera/layout state:
- HOME
- ABOUT
- PROJECTS
- JOURNEY
- SKILLS
- CONTACT

Transitions should be smooth but restrained.

### URL / Navigation Behavior
Use hash-based section states where practical:
- /#about
- /#projects
- /#journey
- /#skills
- /#contact

Browser Back/Forward should work correctly.

### Mobile
Do not force the desktop fixed-viewport interaction model onto mobile.

On mobile:
- Preserve the world transition concept.
- Allow section content to scroll vertically when needed.
- Prioritize accessibility and usability over visual novelty.

---

## Visual Direction

### Overall
- Near-black / charcoal background
- Off-white text
- Muted green accent
- Minimal borders
- Strong spacing
- Clean technical/product-interface feel
- Modern, restrained, professional

### Green Usage
Use green sparingly.

Good uses:
- Interactive states
- Status indicators
- Active navigation
- Small labels
- Selected controls
- Subtle highlights

Avoid:
- Making every heading green
- Green borders everywhere
- Green used decoratively without meaning

### Typography
Primary:
- Clean sans-serif such as Inter, Geist, or similar

Secondary:
- Monospace such as JetBrains Mono or Geist Mono

Use monospace for:
- Dates
- Labels
- Tech stacks
- Status
- Small technical metadata

Do not overuse monospace for long body text.

---

## Background Animation

Use a subtle procedural WebGL shader as atmospheric texture.

Conceptual references:
- https://p5aholic.me/
- https://thebookofshaders.com/

Do not copy those sites.

### Preferred Shader Direction
- Soft procedural noise
- Domain-warped fBm style movement
- Very low contrast
- Near-black tones
- Extremely subtle green presence
- Slow organic movement
- Should feel like texture, not content

### Performance Requirements
Prefer raw WebGL for the shader unless Three.js is clearly justified elsewhere.

Target:
- One fullscreen triangle
- Single fragment shader
- No heavy 3D geometry for the background
- DPR capped at about 1
- Rendering resolution can be reduced and CSS-upscaled
- 3–4 fBm octaves maximum
- Approx. 30 FPS
- Pause on `visibilitychange`
- Stop or reduce animation when not visible
- Respect `prefers-reduced-motion`
- CSS fallback if WebGL fails
- Avoid shader complexity that raises laptop/GPU load unnecessarily

Optional optimization:
- Skip WebGL on very low-end devices or when data-saving mode is active.

### Readability
Text must never depend on the animated background for contrast.

Use:
- Solid or semi-opaque section surfaces
- Vignette where appropriate
- Subtle borders
- Controlled luminance range

If the background is noticeable while reading, it is too strong.

---

## Main Page Order

Recommended recruiter-first order:

1. Hero / About
2. Featured Projects
3. Journey
4. Skills
5. Contact

Even though the interface is world-based rather than scroll-based, this is the content priority.

---

## Hero / About

### Identity
Name:
Eduardo Villanueva

Supporting role line:
Software Engineering Student · Front-End Developer · Automation & Systems

### Messaging
The hero should explain what Eduardo builds, not just what he is.

Suggested direction:
“I build practical tools that automate and improve digital workflows, with accessibility and usability built in.”

Keep the exact final copy concise.

### Current Context
Possible compact status strip:
- Instructional Design Assistant @ Ensign College
- Preparing for DOE CyberForce
- Open to software engineering / front-end / automation internship opportunities

Only include an “Open to…” line if it is accurate at implementation time.

### Hero Layout
- Left aligned
- Strong hierarchy
- Avoid centered generic portfolio layout
- Primary CTA: View Projects
- Secondary CTA: Download Resume
- No third primary button

### Hero Visual
Use a real artifact when possible:
- AutoCanv interface crop
- Findings panel
- Workflow visual

Do not use fake dashboard data.

---

## About Content

Eduardo Villanueva is a Software Engineering student and front-end developer based in Salt Lake City.

His interests and experience include:
- Front-end development
- Automation
- LMS / education technology
- Accessibility
- UX
- Linux / system administration
- Cybersecurity

Professional positioning:
He builds practical tools that improve usability, accessibility, and efficiency.

Do not exaggerate seniority or claim expertise beyond the real work described here.

---

## Projects

Projects are the strongest evidence on the site.

### Project 1 — AutoCanv
This is the flagship / featured project.

Title:
AutoCanv

Positioning:
Canvas Course QA & Automation Platform

Description:
A Canvas LMS QA and automation platform that reviews courses for functionality, accessibility, and formatting issues.

Core workflow:
Scan → Findings → Preview → Apply → Verify

Capabilities:
- Reviews Canvas courses
- Detects functionality issues
- Detects accessibility issues
- Detects formatting problems
- Produces structured findings
- Previews corrections
- Applies approved fixes
- Uses backups
- Verifies changes

Tech:
- Python
- React
- Vite
- Canvas API
- REST APIs
- HTML/CSS
- Automated testing

Presentation:
- Largest project panel
- Real screenshot or short muted demo loop
- Explain problem → solution → implementation
- Show the pipeline visually
- Use real metrics only if they are verifiable
- Never invent usage numbers, test counts, adoption claims, or performance metrics

Preferred media:
- WebM or MP4 over GIF
- 3–6 second loop
- Muted
- Autoplay only when appropriate
- Pause when off-screen
- Reduced-motion fallback

If the repository is private:
- Label it honestly
- Use screenshots or a demo video instead

---

### Project 2 — Canvas HTML Generator

Positioning:
Canvas Component Design Tool

Description:
A Google Apps Script web application for generating reusable Canvas LMS components.

Features:
- Custom layouts
- Color customization
- Tabs
- Accordion/details components
- Accessibility-focused presets
- Live preview
- Generated Canvas-compatible HTML

Tech:
- Google Apps Script
- JavaScript
- HTML
- CSS
- Responsive Design

Presentation:
- Secondary project card/panel
- Use a short interaction loop or before/after example if useful

---

### Project 3 — Ensign Canvas Template System

Positioning:
Professional Work

Description:
Reusable Canvas course templates and components created as part of Eduardo’s Instructional Design Assistant role.

Focus:
- Accessibility
- Responsiveness
- Consistency
- Visual hierarchy
- Course instructions
- Activities
- Callouts
- Code blocks
- Tabs
- LMS content patterns

Tech:
- HTML
- CSS
- Canvas LMS
- Accessibility
- Responsive Design
- UX

Presentation:
- Clearly label as “Professional Work”
- Use real template screenshots if allowed
- Remove or obscure sensitive/internal course content

---

### Project 4 — DOE CyberForce Infrastructure

Positioning:
In Progress

Description:
Preparation and administration of infrastructure for the DOE CyberForce Competition.

Responsibilities:
- Database systems
- Web/NFS infrastructure
- Linux administration
- Service baselining
- Networking
- Access controls
- Troubleshooting
- System hardening

Tech:
- Linux
- Nginx
- NFS
- Networking
- System Administration
- Cybersecurity

Presentation:
- Clearly label “In Progress”
- Do not imply the competition has already been completed
- Use terminal captures, architecture diagrams, or service visuals instead of forcing a web-app screenshot

---

## Project Media Rules

Do not use photos or screenshots just for decoration.

Use the most authentic artifact for each project:
- UI screenshot
- Short product loop
- Terminal capture
- Architecture diagram
- Before/after comparison
- Real workflow

Avoid motion overload.

The portfolio already includes:
- World/camera transitions
- Shader background
- Possible skills marquee

Project animation should only appear inside the Projects section and remain controlled.

Prefer MP4/WebM over GIF for efficiency.

---

## Journey / Experience

Use a left-aligned vertical timeline.

Do not alternate entries left/right.

Order:
Most recent first.

Use monospace for dates.

Keep entries concise.

### Ensign College — Instructional Design Assistant
Current role.

Responsibilities:
- Build and update Canvas LMS course modules
- HTML/CSS customization
- Accessibility improvements
- UX/usability reviews
- Improve consistency and navigation
- Create reusable Canvas templates/components

Resume-supported details include:
- Collaborate with instructional designers
- Develop 10+ Canvas LMS course modules
- Build and maintain Canvas content using HTML and accessibility best practices
- Conduct UX usability reviews
- Improve layouts/navigation
- Organize review feedback

Do not invent metrics beyond those supported by the resume.

### DOE CyberForce
Current preparation.

Role context:
Administrator responsible for database and Web/NFS infrastructure.

Keep this distinct from completed professional employment.

### No More A Stranger Foundation
Volunteer interpreter / translator.

Main contribution:
Help Spanish-speaking immigrants who cannot speak English communicate through translation and interpretation.

Treat this as meaningful experience, not a footnote.

It demonstrates:
- Bilingual communication
- Service
- Cross-cultural communication
- Real-world accessibility and inclusion

Do not overstate the legal scope of the role.

### Ensign College
Bachelor of Applied Science, Software Engineering
Expected completion: 2029

Relevant areas:
- Software Development
- Algorithms
- Data Analysis

### Lima University — Peru
Foundational coursework in International Business before transitioning toward software engineering.

This is part of Eduardo’s story and should not be hidden.

---

## Skills

Do not use a pure carousel that hides skills and forces users to wait.

Use a hybrid approach.

### Primary Layer
All skill categories should be directly visible and scannable.

#### Front-End Development
- React
- JavaScript
- HTML
- CSS
- Tailwind CSS
- Responsive Design

#### Software & Automation
- Python
- Google Apps Script
- REST APIs
- Canvas API
- Automation Tools

#### UX & Accessibility
- Accessible Web Design
- Semantic HTML
- Responsive Layouts
- Usability Review
- Canvas LMS Design

#### Systems & Cybersecurity
- Linux
- Nginx
- NFS
- Networking
- System Administration
- Security Fundamentals

#### Tools
- Git
- GitHub
- Vite
- VS Code
- Microsoft Office
- Canvas LMS

### Motion Layer
Optional slow marquee of tool names/icons.

Rules:
- Pause on hover
- Pause on keyboard focus
- Stop under `prefers-reduced-motion`
- Use duplicated decorative content with `aria-hidden="true"`
- Never make the marquee the only place where skills are visible

---

## Contact

Include:
- Email
- GitHub
- LinkedIn
- Resume download

Current contact details:
- Email: edjvc24@gmail.com
- GitHub: https://github.com/Duado24
- LinkedIn: https://linkedin.com/in/edvico24/

Keep the contact section simple.

Do not add an unnecessary contact form unless there is a clear reason.

---

## Certifications

Skip certifications for now.

Do not add placeholder certificates.

They may be added later once verified.

LinkedIn can carry the broader certificate history.

---

## Navigation

Use a slim navigation system that supports the world interaction.

Requirements:
- Keyboard accessible
- Visible focus state
- Active section state
- Hash routing / URL state
- Back/Forward support
- Simple accessible mobile navigation

Desktop navigation can work together with labels around the world.

Do not make the visual world the only navigation method.

---

## Accessibility

Accessibility is a first-class requirement.

The portfolio itself should demonstrate Eduardo’s accessibility focus.

Required:
- Semantic landmarks
- Correct heading hierarchy
- Skip link
- Keyboard-accessible navigation
- Visible focus rings
- Sufficient color contrast
- Alt text for meaningful screenshots
- Decorative visuals hidden from assistive technology
- `prefers-reduced-motion`
- No interaction available only on hover
- Accessible media behavior
- Screen-reader-friendly project structure
- Mobile usability

If Lighthouse accessibility reaches 100, it may be mentioned only after it is actually measured.

Do not pre-claim a score.

---

## Animation Rules

Primary visual moments:
1. World/camera transitions
2. Shader background

Optional:
3. Skills marquee

Everything else should remain subtle.

Scroll/section reveals:
- Small fade
- Around 12px translate
- 150–250ms transitions where appropriate
- Ease-out
- Disabled/reduced under reduced motion

Avoid:
- Large parallax
- Constant card movement
- Excessive spring effects
- Decorative animation on every element
- Motion that competes with content

---

## Project Cards / Panels

Featured project:
- AutoCanv
- Large panel
- Real visual
- Problem
- Outcome
- Tech
- Workflow
- GitHub/demo/status

Secondary projects:
- Canvas HTML Generator
- Ensign Template System
- CyberForce Infrastructure

Each secondary project should have:
- Title
- One-line outcome
- 3–4 key tech tags
- One link or honest status label
- Real supporting visual if useful

---

## Footer

Keep it quiet.

Possible line:
Built with React, Vite, Tailwind, and WebGL.

Only include technologies actually used in the final implementation.

---

## Performance

Prioritize performance.

Goals:
- Fast first paint
- Avoid unnecessary libraries
- Lazy-load project media
- Pause hidden animation
- Optimize screenshots/video
- Avoid oversized assets
- Keep shader inexpensive
- Avoid loading all heavy media immediately
- Respect low-power / reduced-motion scenarios

Do not add libraries simply for one minor effect if CSS/native browser APIs are enough.

---

## Honesty / Content Integrity Rules

Never invent:
- Project metrics
- Users
- Adoption
- Revenue
- Test counts
- Performance improvements
- Competition results
- Employment responsibilities
- Technologies not actually used
- Certifications
- Awards

If a project is incomplete:
Label it “In Progress”.

If work is professional:
Label it “Professional Work”.

If a repo is private:
Say so.

If a metric is unknown:
Omit it.

---

## Initial Implementation Process

Do not immediately rewrite the entire project.

### Phase 1 — Audit
Inspect the repository and report:
1. Current architecture
2. Files/components worth keeping
3. Files/components that should be removed or rewritten
4. Existing deployment setup
5. Existing dependencies
6. Accessibility issues
7. Performance issues
8. Any broken or unused code

Do not modify files during this phase.

### Phase 2 — Architecture Plan
Propose:
- New component tree
- Section state model
- World/camera state model
- Navigation approach
- Shader architecture
- Responsive/mobile strategy
- Media strategy
- Accessibility strategy

Wait for approval before major implementation.

### Phase 3 — Structural Rebuild
Implement:
- App shell
- Routing/hash state
- Navigation
- Section containers
- Responsive architecture
- Placeholder world states
- Core accessibility

Do not focus on visual polish yet.

### Phase 4 — World Interaction
Implement:
- World component
- Section positions
- Camera/world transitions
- Reduced-motion behavior
- Mobile behavior

### Phase 5 — Content
Add:
- About
- Projects
- Journey
- Skills
- Contact

Use only verified content from this file and supplied assets.

### Phase 6 — Project Media
Add optimized:
- Screenshots
- WebM/MP4 loops
- Terminal captures
- Diagrams

### Phase 7 — Shader
Add lightweight shader only after the core experience is stable.

### Phase 8 — Polish
Refine:
- Typography
- Spacing
- Borders
- Hover/focus states
- Animation timing
- Responsive behavior
- Accessibility
- Performance

### Phase 9 — QA
Verify:
- Keyboard navigation
- Reduced motion
- Color contrast
- Responsive behavior
- Mobile scrolling
- Browser Back/Forward
- Direct section hashes
- GitHub Pages deployment
- Broken links
- Media fallback
- Lighthouse / performance checks

---

## First Codex Task

Before making changes:

1. Inspect the entire repository.
2. Summarize the current architecture.
3. Identify what should be retained.
4. Identify what should be removed or rewritten.
5. Propose the new component architecture.
6. Propose the world/camera state model.
7. Propose an accessibility-safe navigation model.
8. Propose the implementation phases.
9. Flag technical risks.

Do not edit files until the audit and plan are complete.
