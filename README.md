# 30 MINUTE

<p align="left">
  <a href="https://github.com/JayantOlhyan/pitch-scroll/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-orange.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-16.3-black.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tests-33%20Passing-brightgreen.svg" alt="Tests" />
  <img src="https://img.shields.io/badge/Storage-100%25%20Local--First-teal.svg" alt="Local-First" />
</p>

> **30 minutes to understand it. 5 minutes to pitch it.**

A personal technology-learning, content-creation, and research workstation. You draw an unfamiliar technology, company, product, architecture, or engineering case study and receive **exactly 30 minutes** to build a coherent architectural mental model from primary documentation under pressure. When the clock hits zero, research stops, and you receive **exactly 5 minutes** to pitch what you learned in your own words on camera.

---

## ⚡ The Challenge Loop

1. **Step 1 — Topic Roulette:** Spin the high-speed 3D drum reel. Unseen topics and edge-case engineering systems take priority.
2. **Step 2 — 30-Minute Research Phase:** A running countdown clock, 10 structured note sections, progressive research prompts, primary sources, and a comprehension checklist.
3. **Step 3 — Hard Transition:** When the countdown reaches zero, research tabs close immediately, triggering audio chimes and transitioning into Pitch Mode.
4. **Step 4 — 5-Minute Pitch Phase:** Pitch the problem, user workflow, architecture, business model, moat, and verdict on video before the timer expires.
5. **Step 5 — Honest Self-Assessment:** Rate your understanding across 8 dimensions (1–10) using our standardized rubric and record 4 takeaways.
6. **Step 6 — Scorecard & Content:** Export a high-resolution PNG scorecard (1080 × 1350) and auto-generated hooks for YouTube, Instagram Reels, and LinkedIn.

---

## 🛠 Features

- **177 Curated Technical Case Studies:** Spanning Artificial Intelligence, Developer Tools, Distributed Systems, Cloud Infrastructure, Open Source, Indian Tech, System Architecture, Dead Products, and Cybersecurity.
- **Fail-Safe Timer Engine:** Timestamp-anchored timer that survives page reloads, tab switches, and mobile backgrounding without losing synchronization.
- **Distraction-Free Cinematic & Recording Modes:**
  - **Cinematic Mode (<kbd>F</kbd>):** Fullscreen distraction-free workstation with enlarged timer and high-contrast typography.
  - **16:9 Landscape Mode:** Tailored for desktop webcams, YouTube videos, and screen recordings.
  - **9:16 Vertical Mode:** Custom composition engineered specifically for filming vertical Instagram Reels and YouTube Shorts.
- **Procedural Web Audio Sound Engine:** Cinematic synthesizer pulses marking countdown starts, 10m/5m/1m/30s warnings, phase transitions, and completions.
- **100% Client-Side Privacy:** All sessions, notes, checklists, and scores persist locally via `localStorage`. Full JSON export and backup restoration included.
- **Content Creator Toolkit:** Automatically formats YouTube titles, video hooks, Reel openers, and LinkedIn post drafts from session takeaways.

---

## ⌨️ Keyboard Shortcuts Legend

| Key | Description |
| --- | ----------- |
| <kbd>Space</kbd> | Pause or resume session countdown (marks attempt as practice) |
| <kbd>R</kbd> | Reset countdown timer back to 30:00 (Research) or 05:00 (Pitch) |
| <kbd>F</kbd> | Toggle distraction-free cinematic mode |
| <kbd>Shift</kbd> + <kbd>F</kbd> | Toggle native fullscreen browser window |
| <kbd>M</kbd> | Mute or unmute procedural Web Audio sound cues |
| <kbd>N</kbd> | Draw a new topic challenge from library |
| <kbd>?</kbd> | Open the keyboard shortcuts legend dialog |
| <kbd>Esc</kbd> | Exit cinematic mode, recording mode, or dismiss dialogs |

---

## 🏗 Architecture & Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9 (Strict mode)
- **Styling**: Tailwind CSS + Custom CSS Design Tokens
- **Icons**: Lucide Icons
- **Storage**: Client-side `localStorage` with Zod validation schemas
- **Audio**: Web Audio API Procedural Synthesizer
- **Testing**: Node.js Native Test Runner (`node:test`) + Playwright E2E

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=20.0.0`
- npm `>=10.0.0`

### Installation

```bash
# Clone the repository
git clone https://github.com/JayantOlhyan/pitch-scroll.git
cd pitch-scroll

# Install dependencies cleanly
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Testing & Verification

```bash
# Run unit and user journey tests
npm test

# Check TypeScript types
npm run typecheck

# Run linter
npm run lint

# Production build
npm run build
```

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting issues or pull requests.

To propose a new case study, open a [Challenge Suggestion](https://github.com/JayantOlhyan/pitch-scroll/issues/new?template=challenge_suggestion.yml) issue with your 10 research questions and primary sources.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE) © 2026 Jayant Olhyan.
