# Architecture & Design Specification

Pitch Scroll is a local-first, distraction-free technical communication training environment. It enforces a strict 30-minute rapid research phase followed by a 5-minute unscripted pitch delivery and structured multi-dimensional self-evaluation.

This document describes the core architectural principles, runtime guarantees, state reconciliation pipelines, and audio/canvas subsystems.

---

## 1. Architectural Principles

1. **Zero-Telemetry, Local-First Storage**: User notes, research findings, and assessment scores are stored exclusively in the browser (`localStorage`). No user data leaves the client machine unless explicitly exported by the user.
2. **Determinism & Monotonic Clocks**: Timer logic relies entirely on wall-clock timestamps (`targetEpochMs`) rather than ticking intervals (`setInterval`). If the browser tab is suspended or the laptop lid closed, phase transitions compute the exact elapsed interval upon wakeup.
3. **Graceful Schema Evolution**: Upgrades between catalog revisions and user backups guarantee that in-progress sessions, custom challenges, and past notes are never overwritten or orphaned.
4. **Zero External Media Runtime Dependencies**: Sound effects (cues, transitions, warnings) are procedurally synthesized on-the-fly via the Web Audio API without fetching MP3/WAV assets. Visual scorecard previews render via standard HTML5 Canvas without server-side rendering workers.

---

## 2. System Overview & Core State Loop

```
┌─────────────────────────────────────────────────────────────┐
│                      User Action / Input                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     App Context & Hooks                     │
│                (use-app.ts / storage.ts)                    │
│   - localStorage read/write with Zod validation             │
│   - Version normalization & slug-based identity preserve    │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│       Timer Subsystem        │ │       Audio Synthesizer      │
│   (use-session-timer.ts)     │ │          (audio.ts)          │
│ - Monotonic timestamp engine │ │ - Pure Web Audio API         │
│ - Tab background recovery    │ │ - Sine / Triangle bleeps     │
│ - Practice / pause flags     │ │ - Zero audio asset downloads │
└──────────────┬───────────────┘ └──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                       View Layer                            │
│  - Home / Roulette (Deterministic / Unseen priority)        │
│  - Workspace (Dual-phase notes & Teleprompter controls)     │
│  - Results & Analytics (Streak tracking & Study Sheet export│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Storage & State Normalization (`lib/storage.ts`)

All application state is captured under the `STORAGE_KEY` (`"30-minute-sprint"`):

- **Challenges**: The library of 177+ structured topics across 9 industries, each with 10 guided research questions and curated primary sources.
- **Sessions**: The user's active sprint and historical runs (`phase`, `deadline`, `paused`, `notes`, `scores`, `isPractice`).
- **Preferences**: Theme selection, procedural sound toggle, voice prompt pacing, and teleprompter configurations.

### Schema Validation & Backward Compatibility
When state loads from storage or a backup file, `normalizeState` passes the raw payload through `stateSchema` (defined with Zod). If legacy fields or missing challenge slugs are detected:
- Unique challenge identities derive deterministically from kebab-cased slugs rather than numerical array indexes.
- In-progress sessions preserve their exact remaining deadline window.
- Custom user-created topics are preserved when built-in challenge catalogs upgrade.

---

## 4. Timer Subsystem (`hooks/use-session-timer.ts`)

Timing accuracy is essential for enforcing the 30-minute research and 5-minute pitch windows. Rather than decrementing a counter every 1000ms:

1. When a session starts or transitions to pitch, `deadline` is persisted as an absolute ISO 8601 epoch timestamp.
2. The UI runs a lightweight render loop requesting `requestAnimationFrame` / short interval that computes:
   $$\text{remainingMs} = \max(0, \text{deadlineMs} - \text{currentEpochMs})$$
3. When the tab goes inactive (backgrounded tab or device sleep):
   - Upon page visibility change, the exact elapsed delta is calculated.
   - If the research deadline has expired while asleep, the session automatically transitions to the pitch phase, crediting any time already elapsed.
   - If both deadlines have passed, the session advances to the assessment phase.
4. Any explicit pause marks the session as `isPractice = true` to preserve the integrity of competitive / unassisted speed statistics.

---

## 5. Procedural Web Audio Engine (`lib/audio.ts`)

To avoid network latency, missing asset errors, or audio codec licensing constraints, all audible cues are synthesized in real-time via the browser's `AudioContext`:

- **Phase Transitions**: Rising arpeggio chords synthesized with soft sine wave envelopes.
- **Countdown Ticks**: Minimalist low-gain woodblock clicks triggered at 3-second, 2-second, and 1-second warning intervals.
- **Completion Bell**: Two-tone resonant chime signaling timer expiration.

Sound can be muted at any moment via workspace toolbar controls or keyboard shortcut `M`.

---

## 6. Export & Canvas Engine (`lib/sharing.ts` & `components/results.tsx`)

Completed runs generate multi-format outputs:
- **Unicode Scorecards**: Compact, emoji-free formatted text summaries suitable for terminal sharing or team chat.
- **Markdown Study Sheets**: Structured technical study sheets combining problem synthesis, architectural breakdown, business risks, and delivery evaluation.
- **Canvas Infographics**: Client-side canvas rendering generates 1200x630px PNG summary cards with dynamic typography, contrast ratios, and category badges for social or portfolio embeds.
