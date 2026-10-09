# GLM Hyper Character Studio

> **Interactive Morphometric, Biometric & Prompt Matrix Web Studio**  
> Standalone zero-dependency Web application for designing, visualizing, and compiling production-grade characters for Webtoon / Manhwa / Anime / Seinen and Generative AI models (Midjourney v6, SDXL, Flux.1).

---

## 1. Overview & Architecture

The **GLM Character Studio** is located in `tools/character_studio/`. It is a zero-dependency, standalone application engineered in standard HTML5, CSS3, and vanilla ES Modules JavaScript.

It requires **no build step, no bundlers, and no compilation**:
- You can open `index.html` directly in any modern browser (`file:///.../index.html`).
- Or serve it via any lightweight local server (e.g. `npx serve`, `python -m http.server 8080`, or VS Code Live Server).

```
tools/character_studio/
├── index.html                  # Cyber-webtoon responsive dark UI
├── css/
│   └── styles.css              # Glassmorphism, cyber neon accents, responsive grid
├── js/
│   ├── app.js                  # Main controller, event bindings, toast manager
│   ├── state.js                # Central reactive state store (Pub/Sub)
│   ├── presets.js              # Iconic preloaded presets (Hunter, Streetwear, etc.)
│   ├── biometrics.js           # Biometric formulas, Phi/Golden ratio, WHR, V-Taper, Gonial angle
│   ├── anatomy_renderer.js     # Parametric SVG Mannequin (front & profile) & Face Wireframe
│   ├── prompt_generator.js     # Multi-engine compiler for Midjourney v6.1, SDXL, Flux.1
│   └── exporter.js             # JSON blueprint & Markdown model sheet exporter / importer
├── tests/
│   └── studio.test.js          # Automated verification test suite (Node.js native test runner)
└── README.md                   # Complete documentation and quickstart guide
```

---

## 2. Key Features

### A. Live Interactive Anatomy & Morphology Sliders
- **Height**: 150 cm to 210 cm (dynamically calculates head-to-body proportion: 7.6 to 8.6 heads).
- **Waist-to-Hip Ratio (WHR)**: Continuous scale from 0.60 to 0.95 with Devendra Singh gynoid optimum and android athletic interpretations.
- **V-Taper (Shoulder-to-Hip Ratio)**: Continuous scale from 1.00 to 1.75 with clavicle flare and latissimus dorsi expansion.
- **Muscle Definition**: 0% to 100% (Soft Toned, Athletic, Ripped 8-Pack & Serratus Anterior, Shredded Demon Back).
- **Galbe (Pelvic Curvature)**: 0% to 100% controlling sagittal gluteal shelf projection and lordosis curve.
- **Vascularity**: Forearm cephalic vein grid and shoulder vascularity with glowing accents.
- **Bust / Chest Volume**: Natural downward gravitational teardrop drape modeling.

### B. Facial Architecture Canons
- **Canthal Tilt**: -5.0° to +10.0° (Soft Melancholic to Sharp Feline / Hunter Gaze).
- **Mandibular Gonial Angle**: 105° to 135° (Square masculine chiseled jaw to Korean manhwa delicate V-Line).
- **Facial Symmetry**: 80% to 100% neoclassical bilateral balance.
- **Cheekbones (Malar Prominence)**: 0% to 100% high-fashion light reflection catches.

### C. Style & Wardrobe Selectors
- **Art Styles**:
  - `webtoon_action`: High-octane Korean webtoon manhwa (Solo Leveling style, rim light, aura).
  - `modern_anime`: Crisp cel-shading, vibrant key visual aesthetic.
  - `detailed_seinen`: Intricate cross-hatching, heavy ink contrasts, gritty chiaroscuro.
  - `semi_realistic`: Digital concept art with subsurface scattering skin glow.
- **Wardrobes**:
  - `techwear`: Waterproof shells, Fidlock buckles, utility straps.
  - `k_streetwear`: Oversized hoodies, baggy cargos, chunky sneakers, silver chains.
  - `martial`: Cultivator linen robes, wrapped forearms, combat sash.
  - `classic_tailoring`: Double-breasted bespoke suits, silk lapels, oxford leather.
- **Mode Toggle**: Duty (Tactical / Uniform) vs Private (Casual / Off-Duty Lounge).

### D. Real-Time Parametric SVG Visualizers
- **Dynamic Body Mannequin**: Real-time vector SVG figure reacting to height, V-taper, waist, hips, abs, deltoids, quadriceps, and vascularity.
- **Sagittal Profile View**: Visualizes spine curvature, posture, chest projection, and galbe shelf.
- **Facial Architecture Diagram**: Shows facial thirds horizontal guides (Trichion, Glabella, Subnasale, Menton), gonial angle arcs, and canthal tilt vectors.
- **Biometrics Radar Chart**: High-tech 6-axis polygon radar chart with live scores.

### E. Prompt Matrix with 1-Click Copy
- Generates live prompts for:
  - **Midjourney v6.1**: With master tokens, anatomy callouts, and exact flags (`--ar 9:16 --v 6.1 --stylize 250`).
  - **SDXL**: Positive prompt with weighted tokens and comprehensive negative prompt.
  - **Flux.1**: Natural narrative paragraph prompt optimized for Flow Matching DiT.
- Supports 3 composition modes: **Model Sheet Turnaround**, **Hero Portrait**, and **Action Keyframe**.
- 1-click copy buttons with animated toast notification.

### F. Iconic Preset Library
1. **Kang Jin-Hyuk** (Hunter Protagonist) — Solo Leveling shadow monarch aesthetic.
2. **Min Sora** (K-Streetwear Heroine) — Urban traceur in oversized lavender hoodie.
3. **Alexei Vance** (Techwear Operative) — Tactical recon specialist with Fidlock gear.
4. **Li Wei** (Martial Artist) — Inner-gate ascetic duelist with wiry shredded striations.
5. **Dr. Elena Rostova** (Matron Scientist) — Voluptuous hourglass biometric geneticist.

### G. Export & Import
- **Export JSON**: Complete structured JSON blueprint conforming to `CharacterDesignBlueprint`.
- **Export Markdown**: Full executive character model sheet formatted for wikis, docs, and AI prompts.
- **Import JSON**: Load and restore any exported character blueprint instantly.

---

## 3. Running the Verification Tests

To run the automated test suite verifying biometrics, presets, prompt generation, exporters, and SVG rendering:

```bash
node --test tools/character_studio/tests/studio.test.js
```

All 6 test suites execute in ~250ms and pass at 100%.

---

## 4. How to Launch the Web Studio

### Option 1: Direct File Opening
Double click `tools/character_studio/index.html` or open `file:///C:/Users/laqui/Documents/glm/tools/character_studio/index.html` in Chrome, Firefox, Edge, or Safari.

### Option 2: Lightweight Static Server
```bash
# Using Python
cd tools/character_studio
python -m http.server 8080

# Or using Node.js
npx serve tools/character_studio
```
Then navigate to `http://localhost:8080`.
