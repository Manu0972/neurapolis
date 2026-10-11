# Hyper Character Designer & Biometric Engineering Suite

> **Autonomous deterministic character generation engine & multi-model prompt compiler with native local Ollama integration.**
> Designed for high-tier Korean Webtoons (Solo Leveling / Redice aesthetic), Seinen Manga, Modern Anime, and Semi-Realistic Concept Art.

---

## 1. Overview & Architecture

The **Character Designer Engine** is an offline-first, zero-mandatory-dependency TypeScript suite for character generation, scientific biometric evaluation, and diffusion prompt engineering.

### Key Capabilities:
1. **Granular Anatomical Sliders**: Full parametric control over facial neoclassical canons (canthal tilt, mandibular angle, facial symmetry) and body morphometrics (height, somatotype, WHR, SHR, V-taper, vascularity, uncensored natural curves).
2. **100% Deterministic Procedural Compiler**: Standalone PRNG guarantees exact reproducibility when given a seed or deterministic inputs without requiring an active network or AI daemon.
3. **Native Local Ollama Adapter (Option B)**: Connects directly to `http://localhost:11434` (`mistral-nemo`, `mistral`, `llama3.2`, `qwen2.5`) to enrich character backstories and psychological depth with strict timeout handling and **automatic graceful fallback** to the deterministic engine when offline.
4. **Multi-Model Prompt Matrices**: Synthesizes optimized prompts for:
   - **Midjourney v6.1**: Parameterized tokens, `--ar 16:9`, `--style raw`, `--v 6.0/6.1`.
   - **Stable Diffusion XL (SDXL)**: Positive quality anchors, trigger tokens, and negative prompt matrix.
   - **FLUX.1 (Dev / Schnell)**: Natural language descriptive prose paragraphs tailored for Flux's T5-XXL text encoder.
   - Master 5-view turnaround sheets, 12-expression grids, dynamic action poses, and macro detail callouts.
5. **Dual Export Formats**: Complete JSON blueprints and GitHub-flavored Markdown dossiers.

---

## 2. Directory Structure

```
tools/character_designer/
├── bin/
│   └── cli.js                     # Executable CLI launcher (zero dependencies)
├── core/
│   ├── types.ts                   # Core TypeScript definitions
│   ├── scientific-anatomy.ts      # Neoclassical & evolutionary evaluators
│   ├── granular-controls.ts       # Facial, morphometric, and wardrobe builders
│   └── procedural-engine.ts       # Procedural deterministic engine
├── providers/
│   └── ollama.ts                  # Native Ollama HTTP adapter with fallback
├── src/                           # Pure modular source tree
│   ├── index.ts                   # Main API entry
│   ├── types.ts                   # Granular type schemas
│   ├── anatomy/                   # Facial, body, and scientific evaluation
│   ├── compiler/                  # PRNG, procedural compiler, and prompt matrices
│   ├── ollama/                    # HTTP client and adapter
│   └── styles/                    # Style presets, wardrobes, and lighting
├── dist/                          # Compiled runtime modules
├── examples/                      # Curated demonstration character sheets
│   ├── sung_kang.json / .md       # Solo Leveling Hunter male
│   ├── aurelia_vance.json / .md   # Voluptuous Korean Hanbok female
│   ├── malik_thorne.json / .md    # Tactical Techwear powerhouse male
│   ├── elysia_frost.json / .md    # Nordic Elegant Duchess female
│   └── kaelen_zephyr.json / .md   # Neon Cyber Infiltrator androgynous
├── tests/                         # Node test runner suite (18/18 passing)
│   ├── deterministic.test.js      # Seed reproducibility tests
│   ├── schema.test.js             # Granular schema coverage tests
│   ├── biometrics.test.js         # Scientific evaluation & canons tests
│   ├── ollama-fallback.test.js    # Timeout & offline resilience tests
│   └── engine.test.js             # End-to-end integration tests
├── package.json
└── tsconfig.json
```

---

## 3. CLI Usage

### Basic Syntax
```bash
node bin/cli.js <command> [options]
```

### Available Commands
- `generate`: Generates a character blueprint and prompt matrix.
- `demo`: Compiles all 5 demonstration characters into `examples/`.
- `presets`: Displays available wardrobes and ethnicity presets.
- `test-ollama`: Checks local Ollama liveness on `http://localhost:11434` and lists models.
- `help`: Displays the help menu.

### Example Commands
```bash
# Generate a reproducible character with deterministic seed
node bin/cli.js generate --seed "hunter-42" --name "Kang Jin-Woo" --gender male --style korean_webtoon_cinematic --muscle 0.88 --whr 0.84

# Generate with local Ollama AI enhancement (gracefully falls back if offline)
node bin/cli.js generate --name "Elena Rostova" --gender female --style anime_cel_shaded_premium --ollama

# Generate all 5 master demonstration sheets into examples/
node bin/cli.js demo

# Test Ollama connection
node bin/cli.js test-ollama
```

---

## 4. Granular Parameters Reference

| Parameter | CLI Flag | Range / Options | Significance |
|---|---|---|---|
| **Canthal Tilt** | `--canthal` | `-5°` to `+10°` | Positive (+3° to +6°) creates the signature sharp, alert, magnetic manhwa protagonist gaze. |
| **Gonial Angle** | `--mandibular` | `105°` to `135°` | Male athletic jawline: 110°-120°. Feminine V-line taper: 125°-134°. |
| **Waist-to-Hip** | `--whr` | `0.58` to `1.00` | Feminine gynoid optimum (Devendra Singh): 0.67-0.70. Male V-taper: 0.82-0.88. |
| **Muscle Definition**| `--muscle` | `0.0` to `1.0` | Soft (0.2), Toned (0.4), Athletic (0.6), Ripped (0.8), Shredded Demon Back (0.95+). |
| **Bust Gravity** | `--bust` | `0.0` to `1.0` | Natural teardrop gravitational drape modeling without rigid spherical artifacts. |
| **Gluteal Galbe** | `--galbe` | `0.0` to `1.0` | Continuous sagittal gluteal shelf and lordosis contour. |
| **Art Styles** | `--style` | 7 presets | `korean_webtoon_cinematic`, `modern_webtoon_romance`, `tactical_semi_realistic`, `painterly_digital_manhwa`, `anime_cel_shaded_premium`, `stylized_3d_render`, `retro_pixel_concept`. |
| **Wardrobes** | `--wardrobe` | 5 presets | `streetwear` (K-Streetwear), `techwear`, `modern_hanbok_kimono`, `light_armor`, `elegant` (Savile Row tailoring). |

---

## 5. Running Tests

The test suite runs with Node.js's built-in test runner (`node:test`) with zero external dependencies:

```bash
# Run all 18 automated unit tests
npm test
# or directly:
node --test tests/*.test.js
```

### Verified Test Assertions (18/18 Passing):
- Deterministic PRNG reproducibility: identical seed yields identical biometrics and prompts across runs.
- Seed variance: distinct seeds yield varied procedural traits.
- Granular slider overrides: user inputs strictly preserved.
- Scientific facial evaluation: Neoclassical thirds, bilateral symmetry, and gonial angle dimorphism.
- Evolutionary gynoid curve: WHR and gravitational teardrop breast modeling.
- Wardrobe & ethnicity preset integrity.
- Multi-model prompt compilation (Midjourney, SDXL, Flux.1, negative prompts).
- Ollama provider health, mock-daemon enrichment, and offline timeout fallback resilience.
