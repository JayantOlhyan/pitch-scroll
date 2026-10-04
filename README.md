# 30 MINUTE

> **30 minutes to understand it. 5 minutes to pitch it.**

A personal technology-learning and content-creation platform. The creator receives an unfamiliar technology, company, product, architecture, or engineering case study and gets **exactly 30 minutes** to research it under pressure. When the clock hits zero, research stops, and the creator gets **exactly 5 minutes** to pitch what they learned in their own words.

---

## ⚡ Core Concept

1. **Step 1 — Reveal:** Draw an unfamiliar subject (e.g. *Perplexity*, *Zerodha*, *Docker*, *Log4Shell*).
2. **Step 2 — 30-Minute Research:** A running clock, structured note-taking sections, research questions, starting sources, and checklist.
3. **Step 3 — Transition:** Clock reaches zero → audio cue & instant shift into Pitch Mode.
4. **Step 4 — 5-Minute Pitch:** Explain the problem, solution, technology, business, competition, and core insight before the time expires.
5. **Step 5 — Self Assessment:** Score understanding across 8 dimensions (1–10) and capture 4 honest reflections.
6. **Step 6 — Scorecard & Content:** Export high-resolution PNG scorecard (1080 × 1350) and tailored hooks for YouTube, Instagram Reels, and LinkedIn.

---

## 🛠 Features

- **130+ Curated Challenges:** Spanning AI, Developer Tools, Consumer Tech, Infrastructure, Open Source, Indian Tech, System Architecture, Dead Products, and Cybersecurity.
- **Fail-Safe Timer:** Timestamp-based timer that survives page reloads, tab switches, and mobile backgrounding without losing synchronization.
- **Cinematic & Recording Modes:**
  - **Cinematic Mode (`F`):** Fullscreen distraction-free workstation with enlarged timer and high-contrast typography.
  - **Recording Mode (16:9 Desktop & 9:16 Vertical):** Tailored layouts engineered specifically for filming YouTube videos and vertical Instagram Reels / YouTube Shorts.
- **Procedural Sound Engine:** Minimal, cinematic Web Audio API sound cues for phase starts, 10m/5m/1m/30s warnings, phase transitions, and completions.
- **Keyboard Shortcuts:**
  - <kbd>Space</kbd>: Pause / resume session (marks attempt as practice)
  - <kbd>R</kbd>: Reset timer back to 05:00 pitch or 30:00 research
  - <kbd>M</kbd>: Mute / unmute procedural sound
  - <kbd>F</kbd>: Toggle Cinematic mode
  - <kbd>N</kbd>: Draw new challenge
  - <kbd>Esc</kbd>: Exit Cinematic / Recording mode
- **100% Client-Side Privacy:** All sessions, notes, checklists, and scores persist locally via `localStorage`. Full JSON export and backup restoration included.
- **Content Creator Toolkit:** Automatically generates YouTube titles, hooks, Reel openers, and LinkedIn post drafts from session takeaways.

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
# Run unit tests
npm test

# Check TypeScript types
npm run typecheck

# Run linter
npm run lint

# Production build
npm run build
```

---

## 🌐 Netlify Deployment

This project includes zero-config Netlify compatibility:
- `.nvmrc` pins Node.js 22.
- `netlify.toml` preconfigures the build command (`npm run build`) and publishing directory.
- `package-lock.json` is synced for error-free `npm ci`.

Simply connect the repository on [Netlify](https://www.netlify.com/) and deploy!
