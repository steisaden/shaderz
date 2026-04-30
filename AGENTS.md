# Shaderz Operating Doctrine

This document is the standing guide for Hermes and future AI agents working in this repository.

Shaderz is not a random shader playground. It is a marketable shader preset library.
Every preset should feel like a product: desirable, controllable, premium, screenshot-worthy, performant, and safe to ship.

If you are an agent working in this repo, read this document before designing, researching, auditing, implementing, or approving any shader preset.

---

## 1) Purpose of the Shader Library

Shaderz exists to ship a curated collection of visually premium, market-ready shader presets for:

- websites
- landing pages
- music artists
- album rollouts
- SaaS hero sections
- portfolios
- digital products
- creative agencies
- e-commerce
- brand systems
- motion backgrounds
- UI effects
- transitions
- product demos

This project is not trying to be:

- a tutorial dump
- a random noise toybox
- a development sandbox with no product standards
- a copy of Shadertoy, Paper Design, or Shaders.com
- a pile of technically correct but visually forgettable effects

A shader can only be considered successful if it is both technically sound and visually marketable.

---

## 2) Current Repo Architecture Summary

As of this guide, the repo is structured around a central preset registry and a React/WebGL runtime.

### Runtime shell
- `src/App.tsx`
  - main studio shell
  - preset library browsing
  - control panel rendering
  - mobile sheet behavior
  - URL sync
  - localStorage persistence
  - share/export actions
  - inspector visibility

### Preset source of truth
- `src/components/presets/PresetRegistry.tsx`
  - single source of truth for preset IDs
  - names
  - descriptions
  - categories
  - default props
  - controls
  - component bindings

### Shared preset types
- `src/components/presets/types.ts`
  - control metadata
  - preset definition types
  - typed control groups and formats
  - color control support

### Shader components
- `src/components/presets/*/*.component.tsx`
  - self-contained WebGL2 presets
  - one preset or family per component
  - React-managed lifecycle

### Shared shader components
- `src/components/PaperShader.tsx`
- `src/components/RetroGridShader.tsx`
- `src/components/NorthernLightsBackground.tsx`
- other shared background or FX components as needed

### Supporting UI
- preset inspector
- error boundary
- style/theme layers
- export/share UI inside the studio shell

### Current category structure
- Cosmic
- Abstract
- Grid
- Aurora
- Paper

### Current preset inventory at time of writing
- Galaxy Swirl
- Galaxy Orb
- Drifting Contours
- Neon Fog Grid
- Nebular Grid
- Cubed Smoke
- Retro Synth Grid
- Northern Lights
- Northern Lights Prism
- Midnight Rice Paper
- Gold Foil Parchment
- Wet Ink Bloom
- Xerox Ghost
- Neon Risograph
- Burnt Edge Manuscript
- Holographic Poster Paper
- Torn Blueprint Paper

---

## 3) How to Think About Shader Quality

Do not judge a shader by whether it renders.
Judge it by whether it is:

- visually desirable
- unique
- controllable
- marketable
- screenshot-worthy
- brand-adaptable
- performance-safe
- mobile-safe
- readable in a product context
- easy for a designer or marketer to understand

A good preset should feel like a premium visual asset, not a math demo.

---

## 4) Core Shader Design Principles

These principles are grounded in classic shader learning resources and must be applied intentionally.

### 4.1 Use uniforms intentionally
Uniforms are not just knobs.
They define the shader’s design surface.
Every uniform should have a reason to exist.
Every control should visibly affect the output.

### 4.2 Use shaping functions for controlled transitions
Prefer `smoothstep`, easing curves, and carefully shaped falloffs over harsh thresholds.
Use soft transitions to build premium motion and better anti-aliasing.

### 4.3 Use color ramps instead of random colors
A shader should have a palette strategy.
Use color relationships that support the mood:
- complementary
- analogous
- split-complementary
- monochrome with accents
- cinematic dusk/dawn palettes
- editorial neutrals
- print-inspired CMYK or duotone structures

### 4.4 Create rhythm and hierarchy in patterns
Good shaders have structure:
- focal point
- foreground/midground/background layers
- repeating rhythm
- controlled asymmetry
- intentional density changes

### 4.5 Use noise as structure, not decoration
Noise should do work:
- form edges
- distort fields
- drive variation
- simulate material
- create organic breakup
- guide motion

Noise with no job is slop.

### 4.6 Use FBM for organic complexity
FBM is good when it adds layered texture or field modulation.
Do not stack FBM everywhere just because it looks technical.
Use it where complexity improves the visual read.

### 4.7 Use matrices and coordinate transforms for motion and variation
Transforms create composition:
- scale
- rotation
- skew
- polar conversion
- radial repetition
- domain rotation
- time-offset layers

### 4.8 Use SDFs for clean controllable shapes
SDFs are ideal when you need:
- precise boundaries
- soft glows
- layered masks
- animated shape logic
- easy control ranges

### 4.9 Use polar coordinates for orbit-like forms
Polar coordinates are useful for:
- orbs
- galaxies
- rings
- vortexes
- ripples
- circular halos
- aurora-like radial sweeps

### 4.10 Use domain warping for liquid and organic distortion
Domain warping is ideal for:
- smoke
- fog
- liquid
- paper bleed
- aurora curtains
- cloud forms
- fabric-like flow

### 4.11 Use `smoothstep` and `fwidth` for clean edges
Whenever a shader uses lines, SDFs, or procedural boundaries, consider anti-aliased edges.
Avoid jagged, pixelated, or stair-stepped results unless the preset intentionally targets retro aesthetics.

### 4.12 Use falloff and vignette with purpose
Composition matters.
Use falloff to guide attention and frame the subject.
Do not apply heavy vignette by default if it makes the shader look generic or crushed.

### 4.13 Use post-processing ideas carefully
Bloom, chromatic shift, grain, blur, scanlines, and glow are tools, not defaults.
Add them to support the effect, not to mask weak art direction.

### 4.14 Use transition thinking for progress-based effects
When designing wipes, reveals, dissolves, and image-to-image effects, think in terms of progress, direction, masking, distortion, and smooth control.

---

## 5) Marketable Shader Categories

Categories are product families, not technical bins.
They should help users browse by visual intent and use case.

### 5.1 Cosmic / Galaxy
Visual identity:
- stellar fields
- spiral arms
- nebula glow
- orb cores
- deep-space color gradients

Techniques:
- polar coordinates
- FBM dust
- starfield hashes
- radial falloff
- glow layering
- orbit-based motion

Good controls:
- swirl strength
- core size
- star density
- dust amount
- color intensity
- glow strength
- rotation speed

Common mistakes:
- muddy star noise
- overcomplex swirl math with no focus
- too many bright speckles
- fake depth without hierarchy

Marketable use cases:
- music visuals
- SaaS launch pages
- sci-fi brand backgrounds
- event hero sections
- album art motion

Example preset ideas:
- Galaxy Orb
- Celestial Drift
- Deep Signal
- Spiral Halo

### 5.2 Aurora / Light Curtains
Visual identity:
- flowing ribbons
- layered light veils
- cinematic sky glow
- soft motion
- spectral color separation

Techniques:
- warped vertical fields
- smooth band masks
- low-frequency noise
- layered gradients
- soft edge shaping
- subtle star or atmosphere support

Good controls:
- curtain length
- width
- speed
- color intensity
- palette shift
- softening

Common mistakes:
- shard-like or crystalline breakup
- pixelated edges
- over-sharpened bands
- fake glass texture
- too much texture at the cost of flow

Marketable use cases:
- luxury brand headers
- atmospheric storytelling
- music rollouts
- editorial motion backgrounds

Example preset ideas:
- Northern Lights
- Prism Veil
- Polar Ribbon
- Sky Current

### 5.3 Neon Grid
Visual identity:
- perspective grids
- retro-future horizons
- glowing lines
- foggy depth
- synthwave energy

Techniques:
- perspective transforms
- line anti-aliasing
- horizon fog
- glow falloff
- color grading

Good controls:
- density
- perspective
- line width
- glow
- fog intensity
- speed

Common mistakes:
- flat neon lines with no depth
- unreadable horizon treatment
- harsh aliasing
- generic synthwave coloring

Marketable use cases:
- event pages
- tech brands
- music visuals
- retro product launches

Example preset ideas:
- Neon Fog Grid
- Retro Horizon
- Synthetic Dawn
- Pulse Corridor

### 5.4 Paper Texture
Visual identity:
- fibers
- deckle edges
- tactile sheets
- premium paper stock
- printed warmth

Techniques:
- paper fiber fields
- grain
- edge wear
- paper warp
- subtle color drift
- soft shadowing

Good controls:
- fiber strength
- grain amount
- paper warp
- edge darkness
- torn edge amount
- contrast
- brightness

Common mistakes:
- dull beige fill
- over-vignetted stock look
- generic parchment copy
- visible shader math instead of material feel

Marketable use cases:
- editorial systems
- art direction tools
- fashion/creative sites
- premium document hero sections

Example preset ideas:
- Midnight Rice Paper
- Ivory Fold
- Archive Sheet
- Gallery Stock

### 5.5 Halftone / Print
Visual identity:
- printed dots
- misregistration
- risograph energy
- editorial texture
- ink realism

Techniques:
- halftone patterns
- CMYK offsets
- print grain
- dot modulation
- paper bleed
- color separation

Good controls:
- dot scale
- print density
- ink bleed
- misregistration
- contrast
- color separation

Common mistakes:
- flat dot grids with no print logic
- obvious repeating artifacts
- fake scanline noise that reads as random

Marketable use cases:
- poster systems
- album artwork
- zine aesthetics
- creator brand pages

Example preset ideas:
- Neon Risograph
- CMYK Bloom
- Print Ghost
- Halftone Drift

### 5.6 Dither / Retro
Visual identity:
- quantized color
- nostalgic pixels
- posterized gradients
- 8-bit to 16-bit mood

Techniques:
- ordered dithering
- palette quantization
- scanlines
- pixel scaling
- CRT-style adjustments

Good controls:
- dither amount
- palette levels
- scanline strength
- glow
- contrast

Common mistakes:
- ugly aliasing without intent
- flat retro filters with no character
- overdone scanlines

Marketable use cases:
- nostalgia packs
- gaming pages
- music throwback visuals

Example preset ideas:
- Analog Bloom
- Pixel Memory
- VHS Dawn
- Bitwave Veil

### 5.7 Liquid / Chrome
Visual identity:
- flowing reflective surfaces
- viscous motion
- metallic highlights
- luxury sheen

Techniques:
- domain warping
- normal approximation
- specular shaping
- layered reflections
- field-based highlights

Good controls:
- flow strength
- highlight sharpness
- reflectivity
- distortion
- color bias

Common mistakes:
- muddy silver soup
- overbright speculars
- noisy goo with no shape discipline

Marketable use cases:
- luxury product hero sections
- fashion branding
- music art systems

Example preset ideas:
- Liquid Chrome
- Mercury Veil
- Satin Flow
- Mirror Drift

### 5.8 Glass / Holographic
Visual identity:
- prismatic highlights
- translucent refraction feel
- spectral splitting
- polished, synthetic luxury

Techniques:
- Fresnel-inspired falloffs
- chromatic shifts
- banded reflections
- refraction-like distortion
- gradient sheen

Good controls:
- prism amount
- translucency
- edge highlight
- spectral separation
- smoothness

Common mistakes:
- brittle shard visuals
- fake crystalline breakup when smooth glass is intended
- over-saturated rainbow noise

Marketable use cases:
- premium apps
- futuristic product reveals
- creator branding

Example preset ideas:
- Prism Veil
- Holo Glass
- Spectrum Sheet
- Glass Current

### 5.9 Smoke / Fog
Visual identity:
- drifting volume
- atmospheric softness
- depth and diffusion

Techniques:
- noise fields
- flow warping
- layered alpha fields
- soft thresholding
- light scattering simulation cues

Good controls:
- opacity
- drift speed
- density
- turbulence
- glow

Common mistakes:
- over-noised clouds
- muddy low-contrast fog
- no focal structure

Marketable use cases:
- ambient backgrounds
- haunting or dreamy hero sections
- music and event visuals

Example preset ideas:
- Cubed Smoke
- Velvet Fog
- Drift Veil
- Cloud Signal

### 5.10 Noise / Gradient
Visual identity:
- elegant gradient fields
- controlled turbulence
- atmospheric motion

Techniques:
- smooth gradient composition
- subtle warp
- low-frequency FBM
- palette drift

Good controls:
- warp amount
- color intensity
- motion
- gradient balance

Common mistakes:
- flat color wash with random noise
- gradient with no composition

Marketable use cases:
- modern web backgrounds
- tech brands
- subtle ambient motion

Example preset ideas:
- Deep Gradient
- Signal Drift
- Haze Field

### 5.11 SDF Pattern
Visual identity:
- geometric clarity
- precise motifs
- elegant repeat systems

Techniques:
- SDF primitives
- repetition
- masking
- anti-aliased boundaries
- layering

Good controls:
- scale
- repetition count
- rotation
- thickness
- softness

Common mistakes:
- obvious shape spam
- overly dense patterns that lose identity

Marketable use cases:
- brand motifs
- system backgrounds
- luxury graphic surfaces

Example preset ideas:
- Orbit Tiles
- Polygon Veil
- Motif Grid

### 5.12 Dot Grid / Motif
Visual identity:
- measured rhythm
- texture grids
- modular systems

Techniques:
- dot repetition
- phase offsets
- perspective treatment
- modulation by field values

Good controls:
- dot size
- spacing
- density
- falloff

Common mistakes:
- stiff pattern with no life
- random dot scatter with no hierarchy

Marketable use cases:
- design systems
- UI backdrops
- editorial motifs

Example preset ideas:
- Dot Lattice
- Signal Mesh
- Halo Dots

### 5.13 CRT / Analog
Visual identity:
- scanlines
- phosphor glow
- imperfect display charm

Techniques:
- scanline modulation
- RGB offsets
- barrel distortion
- subtle noise
- phosphor bloom

Good controls:
- scanline strength
- curvature
- glow
- chromatic shift

Common mistakes:
- over-applied distortion
- gimmick CRT with no tasteful restraint

Marketable use cases:
- nostalgia campaigns
- music visuals
- retro game themes

Example preset ideas:
- Analog Bloom
- Neon Tube
- Raster Memory

### 5.14 Game FX
Visual identity:
- usable in games and stylized interfaces
- outlines, glows, dissolves, water, sparks, fields

Techniques:
- outlines
- dissolves
- distortion
- impact glows
- toon gradients

Good controls:
- edge softness
- intensity
- dissolve progress
- outline width

Common mistakes:
- overcomplicated effects with no gameplay clarity

Marketable use cases:
- indie game sites
- launch trailers
- stylized product interactions

Example preset ideas:
- Impact Bloom
- Arc Dissolve
- Outline Pulse

### 5.15 Image Filter
Visual identity:
- transform input imagery into a premium visual treatment

Techniques:
- color grading
- halftone
- posterize
- distort
- edge treatment

Good controls:
- strength
- color separation
- grain
- contrast

Common mistakes:
- generic filter pack behavior
- destructive processing that kills the image

Marketable use cases:
- album art tools
- marketing workflows
- social content visuals

Example preset ideas:
- Poster Drift
- Film Grain Veil
- Color Split

### 5.16 Transition Shader
Visual identity:
- sophisticated reveal, dissolve, and swap effects

Techniques:
- progress-driven masking
- directionality
- warping
- noise dissolve
- geometric wipe

Good controls:
- progress
- smoothness
- direction
- distortion
- edge softness

Common mistakes:
- linear wipe with no artistic texture
- transition that ignores composition

Marketable use cases:
- motion systems
- art direction tools
- product demos

Example preset ideas:
- Liquid Reveal
- Tear Passage
- Signal Sweep

### 5.17 Logo Animation
Visual identity:
- brand reveal
- elegant logo motion
- premium intro/ending treatment

Techniques:
- masking
- glow passes
- edge tracing
- reveal progress

Good controls:
- reveal speed
- glow
- stroke softness
- distortion

Common mistakes:
- gimmicky logo effects
- motion that competes with the logo

Marketable use cases:
- branding packages
- music intros
- agency demo reels

### 5.18 Interactive Hero
Visual identity:
- designed for homepage hero sections
- must support text and CTAs

Techniques:
- restrained motion
- safe contrast
- clear composition
- responsive behavior

Good controls:
- intensity
- motion
- color palette
- background balance

Common mistakes:
- hero background that destroys readability
- too much motion behind text

### 5.19 Album Cover / Music Visual
Visual identity:
- moody, branded, expressive, screenshot-worthy

Techniques:
- cinematic lighting
- color identity
- atmosphere
- layered depth

Good controls:
- palette
- glow
- motion pacing
- texture amount

### 5.20 Luxury Product Background
Visual identity:
- premium, restrained, polished

Techniques:
- soft gradients
- glass/chrome/sheen
- directional lighting cues
- elegant falloff

Common mistakes:
- loud effects
- cheap neon oversaturation

### 5.21 Experimental
Visual identity:
- only for genuinely novel ideas
- must still be controlled and intentional

Rules:
- experimental does not mean sloppy
- experimental still needs a use case and a visual hypothesis

---

## 6) The Marketability Test

Every shader must be scored from 1 to 10.
A preset should not be treated as market-ready unless it scores at least 7/10.

Score each preset on:

- first impression
- visual uniqueness
- use-case clarity
- screenshot value
- motion quality
- color polish
- control usefulness
- brand adaptability
- performance
- mobile safety
- naming and copy quality
- product fit

### Scoring guidance
- 1–3: broken, generic, or unusable
- 4–6: technically valid but not ready
- 7: acceptable / ship candidate with review
- 8: strong product-quality preset
- 9: excellent premium preset
- 10: rare flagship-quality effect

If a shader cannot pass the marketability test, do not call it finished.

---

## 7) The No-Slop Rules

These rules exist to prevent AI-generated shader mediocrity.

### Never do these:
- do not ship a flat gradient with random noise and call it a preset
- do not use harsh colors without a palette strategy
- do not add motion just because motion is possible
- do not create foreground objects when the user asked for shader layers
- do not add DOM overlays to fake shader work
- do not hardcode values that should be uniforms
- do not create controls that do not visibly affect the shader
- do not overexpose the scene so text becomes unreadable
- do not use noisy FBM everywhere without composition
- do not create duplicate canvases
- do not break existing presets
- do not ignore reduced motion
- do not claim success without visual verification
- do not copy paid or proprietary code
- do not ignore source licenses
- do not call a tutorial look “premium” just because it compiles
- do not hide weak visuals behind extra effects
- do not let technical complexity substitute for taste

### If a preset feels generic, ask:
- What is the focal point?
- What is the palette strategy?
- What is the motion idea?
- What is the material or environment?
- Why would someone buy or use this?
- What does it look like in a screenshot?

---

## 8) Shader Layer System

Premium shaders should be designed as layers.
Before coding, define the layers.

A strong preset usually has some combination of:

1. base color layer
2. radial or gradient falloff layer
3. procedural pattern layer
4. noise / detail layer
5. glow / bloom simulation layer
6. motion / distortion layer
7. composition / vignette layer
8. interaction layer
9. grain / texture layer
10. transition / progress layer
11. post-processing layer
12. fallback layer

### Layer rules
- Every layer must have a job.
- Layers should not fight each other.
- A layer can be subtle, but it should still exist for a reason.
- Build the visual read from broad to fine.
- Avoid putting all energy in one noisy middle layer.
- A shader should remain strong when one layer is dialed down.

### Typical layer ordering
- composition first
- large shapes or fields second
- motion/distortion third
- fine detail fourth
- glow and color treatment fifth
- grain / finish last

---

## 9) Control Design Rules

Controls must improve the shader as a product.

### Good controls
- affect the actual shader
- have clear labels
- have safe ranges
- have sensible defaults
- update in real time
- are grouped logically
- are useful to designers
- are not overwhelming
- preserve visual quality across ranges

### Common control ideas
- intensity
- scale
- speed
- color A / B / C
- opacity
- glow
- noise amount
- pattern size
- distortion
- center / position
- vignette
- density
- rotation
- progress
- direction
- smoothness
- grain
- contrast
- chromatic shift

### Control rules
- Do not add a control unless it visibly improves usability or marketability.
- If a control exists, it must matter.
- If a control can break the image, constrain it.
- Keep defaults strong and conservative.
- Make controls feel designer-friendly, not engineering-friendly.
- Use grouped controls where possible.
- Prefer a few great controls over a panel full of weak ones.
- Color controls should be first-class controls, not hacks.

### Control QA questions
- Does the control visibly affect the output?
- Does the full range remain aesthetically valid?
- Does the default look premium?
- Does it help a buyer tune the preset for a real use case?

---

## 10) Preset Naming and Copywriting Rules

Names are part of the product.
A good preset name should be memorable, visual, premium, and category-aware.

### Good name traits
- short
- evocative
- readable
- emotionally or visually descriptive
- fits the category

### Bad names
- Cool Shader
- Purple Noise
- Test Effect
- Animated Background
- Shader 1
- BG v2

### Better examples
- Velvet Noise
- Aurora Glass
- Liquid Chrome
- Neon Rain Grid
- Celestial Dust
- Paper Ink Bloom
- Solar Silk
- Deep Signal
- Prism Fog
- Galaxy Orb
- Smoke Halo
- Analog Bloom
- Chrome Veil
- Dither Garden
- Glass Current

### Descriptions should explain
- what it looks like
- where it works best
- what makes it unique
- what mood it creates
- what controls matter most

### Copy rules
- Keep descriptions specific.
- Avoid hype words without evidence.
- Mention the actual use case.
- Speak like a product, not a lab note.

---

## 11) Research Workflow for Agents

Before creating a shader, follow this workflow.

1. Identify the target category
2. Study at least two approved sources relevant to that category
3. Identify the techniques being used
4. Define the shader layer system
5. Define the market use case
6. Define the controls
7. Define performance risks
8. Draft the implementation plan
9. Implement using repo conventions
10. Verify visually and technically

### Approved source priorities
Use the repo’s source list and public inspiration sources:
- The Book of Shaders
- shader-school
- Graphics Workshop
- paper-design/shaders
- shaders.paper.design
- Shaders.com public preset pages
- Shadertoy public examples
- glslViewer
- GL Transitions
- Godot shader demos
- libretro GLSL shaders
- Apple Metal docs at a conceptual level

### Research rules
- Research principles, not code.
- Respect licenses.
- Do not copy proprietary shader source.
- Summarize what was learned.
- Turn inspiration into an original implementation.
- Prefer publicly visible inspiration and public documentation.

### Browser-harness usage
Use browser-harness when visual verification matters.
Use it to:
- inspect public inspiration sources
- inspect local shaderz output
- verify preset switching
- verify controls and layout
- check console errors
- compare against reference visuals

When you use browser-harness for inspiration, record:
- source URL
- what visual idea was learned
- what shader technique is implied
- why the idea is marketable
- how to implement an original version in shaderz

Do not use browser-harness to copy protected source.

---

## 12) Implementation Rules for This Repo

These rules are specific to shaderz.

### Registry rules
- Preserve the registry as the single source of truth.
- Never blindly overwrite `PresetRegistry.tsx`.
- Keep preset IDs unique and stable.
- Do not change IDs casually.
- Keep dropdown/menu and renderer aligned to the same preset source.
- Preserve working presets unless explicitly asked to change them.

### Runtime rules
- Clean up `requestAnimationFrame` loops.
- Clean up `ResizeObserver` instances.
- Clean up WebGL resources.
- Clamp DPR to a reasonable max.
- Support reduced-motion preferences.
- Provide graceful fallbacks.
- Avoid duplicate canvases.
- Avoid unnecessary dependencies.
- Keep the mobile UI safe and readable.
- Preserve URL sync and localStorage behavior.

### Quality rules
- Run lint and build after changes.
- Use browser-harness for visual QA when relevant.
- Check console errors.
- Verify the preset appears in the menu.
- Verify the controls actually affect the shader.
- Verify the default state is premium.

### Architecture preservation rules
- Respect the existing React + TypeScript + WebGL2 architecture.
- Keep shader components self-contained.
- Keep registry data centralized.
- Avoid side-channel state that duplicates preset truth.
- Do not introduce architecture drift for convenience.

### Cleanup rules
- Remove generated clutter when it is clearly disposable.
- Preserve source, data, assets, and configuration.
- Do not widen scope unnecessarily.
- Do not rename or move files unless the change materially improves the architecture.

---

## 13) Shader Quality Checklist

Every new or modified shader must pass this checklist.

### Concept and market fit
- clear visual concept
- strong default state
- premium first impression within 2 seconds
- useful real-world use case
- good name and description
- fits a marketable category

### Visual quality
- unique enough to justify existence
- color palette feels intentional
- motion feels designed, not random
- hierarchy and focal point are clear
- readable foreground content remains possible
- no ugly aliasing or faceting unless retro is intentional
- controlled noise only
- compositional falloff is deliberate

### Control quality
- controls are useful
- each control visibly works
- ranges are safe and sensible
- defaults are strong
- control groups are logical

### Technical quality
- no duplicate canvases
- WebGL resources cleaned up
- resize handled properly
- DPR clamped
- reduced-motion supported
- fallback supported
- builds successfully
- passes lint
- browser-verified visually

### Product quality
- screenshot-worthy
- usable in a real hero or background context
- marketable enough to belong in a library
- not a tutorial artifact

If any major item fails, the shader is not done.

---

## 14) Common Shader Recipes

These are reusable recipe patterns, not copy-paste templates.
Use them as conceptual starting points.

### 14.1 Soft radial glow
Visual goal:
- elegant center glow with soft edges

Math:
- distance fields
- radial falloff
- smoothstep

Uniforms:
- intensity
- radius
- color
- softness

Mistakes:
- hard circles
- overexposed core
- flat background

Use cases:
- hero lighting
- orb highlights
- ambient background

### 14.2 Neon grid
Visual goal:
- retro-future perspective grid with atmospheric depth

Math:
- perspective transforms
- line SDFs
- fog falloff

Uniforms:
- density
- perspective
- line width
- glow
- fog

Mistakes:
- flat lines
- no horizon logic
- aliasing

Use cases:
- synthwave
- tech branding
- music rollouts

### 14.3 Aurora curtains
Visual goal:
- flowing, layered light ribbons

Math:
- warped vertical fields
- layered masks
- banded gradients
- soft noise

Uniforms:
- speed
- width
- length
- color intensity
- palette shift

Mistakes:
- shard-like breakup
- harsh bands
- pixelated edges

Use cases:
- cinematic backgrounds
- luxury headers
- editorial motion

### 14.4 Galaxy swirl / orb
Visual goal:
- cosmic center with spiral arms and stellar depth

Math:
- polar coordinates
- swirl equations
- FBM dust
- star hashing

Uniforms:
- swirl strength
- core size
- arm count
- dust amount
- star density

Mistakes:
- random star noise
- no focal center
- muddy arms

Use cases:
- music visuals
- sci-fi landing pages

### 14.5 Smoke / fog
Visual goal:
- soft atmospheric drift

Math:
- noise fields
- warping
- alpha layering

Uniforms:
- density
- turbulence
- drift speed
- opacity

Mistakes:
- muddy cloud soup
- no depth separation

Use cases:
- ambient hero backgrounds
- moody event pages

### 14.6 Paper grain
Visual goal:
- tactile sheet surface

Math:
- fiber field
- grain noise
- soft warp
- edge shaping

Uniforms:
- fiber strength
- grain amount
- warp
- edge darkness

Mistakes:
- flat beige surface
- overdone vignette

Use cases:
- editorial UI
- art direction systems

### 14.7 Paper fibers
Visual goal:
- visible but refined papermaking texture

Math:
- directional noise
- micro-line modulation
- soft tonal variation

Mistakes:
- repeating line artifacts
- obvious procedural stripes

### 14.8 Halftone dots
Visual goal:
- print texture with controlled dot geometry

Math:
- grid repeat
- thresholded circles
- density modulation

Uniforms:
- dot scale
- intensity
- register shift

Mistakes:
- mechanical sameness with no artistic modulation

Use cases:
- posters
- risograph systems

### 14.9 CMYK halftone
Visual goal:
- print-authentic separation and overlap

Math:
- channel offsets
- dot screens
- color separation

Mistakes:
- garish color overload
- no print logic

### 14.10 Dithering
Visual goal:
- controlled quantized texture

Math:
- ordered patterns
- palette mapping

Mistakes:
- noisy garbage without palette discipline

### 14.11 Liquid metal / chrome
Visual goal:
- reflective flowing surface

Math:
- warping
- highlight shaping
- Fresnel-like falloff cues

Uniforms:
- reflectivity
- flow
- highlight sharpness

Mistakes:
- muddy chrome
- overblown speculars

### 14.12 Glass / holographic
Visual goal:
- premium translucent spectral surface

Math:
- edge highlights
- chromatic separation
- gradient sheen

Mistakes:
- brittle shard effect when smooth glass is intended

### 14.13 SDF polygon pattern
Visual goal:
- precise geometric motif

Math:
- SDF primitives
- repetition
- rotation
- anti-aliasing

Mistakes:
- pattern spam with no hierarchy

### 14.14 Dot grid
Visual goal:
- measured modular texture

Math:
- repeated cell sampling
- radius modulation
- perspective or field distortion

### 14.15 God rays
Visual goal:
- directional light shafts

Math:
- radial masking
- noise breakup
- blur-like light shaping cues

### 14.16 Mesh gradient
Visual goal:
- soft modern color field with structure

Math:
- gradient interpolation
- warp
- falloff

### 14.17 Voronoi / cellular field
Visual goal:
- organic cells or panels

Math:
- cell distance
- nearest point logic
- smooth blending

### 14.18 Metaballs
Visual goal:
- merged organic forms

Math:
- distance aggregation
- thresholding
- smoothing

### 14.19 CRT / scanline
Visual goal:
- nostalgic display character

Math:
- scanline masks
- distortion
- RGB separation
- phosphor cues

### 14.20 Analog bloom
Visual goal:
- soft photographic glow

Math:
- tonal falloff
- highlight shaping

### 14.21 Image distortion
Visual goal:
- premium displacement of source imagery

Math:
- sampling offsets
- warp fields
- smooth masking

### 14.22 Transition dissolve
Visual goal:
- elegant reveal or disappearance

Math:
- progress mask
- noise threshold
- softness shaping

### 14.23 Displacement transition
Visual goal:
- motion with physical distortion during transition

Math:
- progress
- offset fields
- directional control

### 14.24 Water / caustics
Visual goal:
- fluid light patterns

Math:
- wave equations
- warped normals or projected ripples

### 14.25 Logo animation shader
Visual goal:
- premium branded reveal

Math:
- masked progression
- glow shaping
- edge tracing

### 14.26 Game FX dissolve / outline / glow
Visual goal:
- stylized game-ready effect

Math:
- edge masks
- thresholding
- glow falloff

For every recipe, define:
- visual goal
- required math
- useful uniforms
- common mistakes
- marketable use case
- performance notes

---

## 15) Agent Behavior Rules

These are the behavioral standards for Hermes and future agents.

- Plan before implementation.
- Audit existing code first.
- Research before inventing.
- Use approved public sources.
- Reuse project patterns.
- Respect licenses.
- Do not copy proprietary code.
- Do not break working presets.
- Do not overbuild.
- Do not claim success without verification.
- Judge marketability, not just functionality.
- Document what changed.
- Run available checks.
- Use browser-harness when visual verification matters.
- Stay within project scope unless asked to expand.
- Preserve favored presets unless a change is explicitly intended.
- If a shader looks technically correct but visually weak, keep iterating.

### Why AI shaders often look bad
Common failure modes to actively avoid:
- too much random noise
- no visual hierarchy
- no focal point
- no composition
- weak color palette
- generic motion
- poor defaults
- controls that do not matter
- poor anti-aliasing
- no use case
- overcomplicated math with ugly output
- technical success but visual failure
- copied tutorial look with no product adaptation
- ignoring performance
- ignoring mobile
- ignoring readability

The fix is not more code.
The fix is better art direction, better structure, and better verification.

---

## 16) Final Output Standard

When you finish a shader task, report:

- files changed
- preset added or modified
- visual concept
- research sources used
- shader techniques used
- controls added
- marketability score
- performance considerations
- browser-harness checks performed
- verification commands run
- remaining risks
- suggested next improvement

If you cannot provide this report, you are not done.

---

## 17) Source Links and Reference Map

Use these public resources for learning and inspiration.
Do not copy code blindly.
Extract principles, patterns, and design ideas.

### Core shader learning
- The Book of Shaders: https://thebookofshaders.com/
- shader-school: https://github.com/stackgl/shader-school
- Graphics Workshop: https://github.com/ekzhang/graphics-workshop

### Paper / design-friendly shaders
- paper-design/shaders: https://github.com/paper-design/shaders
- shaders.paper.design: https://shaders.paper.design/

### Preset library inspiration
- Shaders.com presets: https://shaders.com/presets
- Shadertoy: https://www.shadertoy.com/

### Workflow / transition / FX references
- glslViewer: https://github.com/patriciogonzalezvivo/glslViewer
- GL Transitions: https://gl-transitions.com/
- Godot shader demos: https://github.com/gdquest-demos/godot-shaders
- libretro GLSL shaders: https://github.com/libretro/glsl-shaders
- Apple Metal: https://developer.apple.com/metal/

---

## 18) Practical Repo Rules for Future Work

Before any shader task:

1. identify the preset family
2. read the current implementation
3. inspect the registry and controls
4. note the current category and product role
5. research at least two approved sources
6. define the shader layers
7. define the controls and defaults
8. define the market use case
9. implement the smallest correct change
10. verify with lint/build/browser checks

Never skip visual QA when the task is about visual quality.
Never skip architecture checks when the task touches the registry or runtime shell.

---

## 19) Bottom Line

Shaderz should feel like a premium preset library, not a random shader sandbox.
Every preset should be designed, not merely generated.
Every effect should have a reason to exist.
Every control should matter.
Every shader should be visually strong enough to sell.
