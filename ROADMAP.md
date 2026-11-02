# Pitch Scroll Feature Roadmap

This document outlines planned improvements, community contribution tracks, and future architectural expansions for Pitch Scroll.

---

## Phase 1: Polish & Open Source Foundation (Current)
- [x] **177+ Curated Real-World Case Studies**: Covering AI/ML, Developer Tools, Enterprise SaaS, Fintech, Energy, Defense, Robotics, and Consumer Tech.
- [x] **Zero-Telemetry Local-First Engine**: Complete local state preservation with Zod schema verification and backup import/export.
- [x] **Procedural Web Audio Engine**: Synthesizes timing chimes and transition warnings without external audio assets.
- [x] **Teleprompter Font Scaling**: High-visibility notes scaling (1x, 1.5x, 2x) for seamless pitch delivery while recording video.
- [x] **Markdown Study Sheet Generation**: Generates comprehensive technical post-mortems and synthesis notes for engineering portfolios.
- [x] **Full Keyboard Accessibility**: Comprehensive hotkey navigation (`Space`, `R`, `Shift+F`, `M`, `Esc`).

---

## Phase 2: Media & Offline Speech Capabilities
- [ ] **Local Browser Audio Recorder**:
  - Optional in-browser microphone capture using the Web MediaStream Recording API.
  - Generates an offline `.webm` / `.wav` recording saved directly to disk.
  - Zero server upload; all audio remains 100% on the user's computer.
- [ ] **Client-Side Speech-to-Text via WebAssembly**:
  - Integration with lightweight offline Whisper models running directly in WebAssembly / WebGPU.
  - Automatic pacing metrics (words per minute, filler words counter: "um", "ah", "like").
- [ ] **Procedural Sound Pack Customizer**:
  - Ability to choose synthesizer wave types (warm vintage synth, gentle bamboo, mechanical clock ticks).

---

## Phase 3: Community Catalog Expansion & Packs
- [ ] **Modular Expansion Packs**:
  - Downloadable category packs (e.g., *Deep Biotech & Synthetic Bio*, *Semiconductor Fabrication & Chip Design*, *Aerospace & Defense Protocols*).
  - One-click import via standard JSON schema without touching existing user streaks.
- [ ] **Interactive Community Challenge Submissions**:
  - GitHub action pipeline to validate user-submitted case studies against `challengeSchema`.
  - Guidelines for community contributors to write high-signal research prompts and curated source links.

---

## Phase 4: Long-Term Delivery Analytics & Cohorts
- [ ] **Scorecard Dimension Radar Charts**:
  - Interactive SVG/Canvas radar visualization tracking improvement across the 8 assessment dimensions over time.
- [ ] **Team & Classroom Mode**:
  - Export anonymized cohort results for engineering bootcamps, executive pitch clubs, and venture hackathons.
  - Peer review rubrics based on the 7-beat pitch methodology.

---

## How to Propose New Features
Feature requests and architectural improvements can be submitted via GitHub Issues or Pull Requests. Please review [ARCHITECTURE.md](ARCHITECTURE.md) and ensure that proposed additions maintain the project's zero-telemetry, local-first principles.
