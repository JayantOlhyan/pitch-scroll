'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppRouter } from '@/hooks/use-location';
import { useApp } from '@/hooks/use-app';
import { Challenge, challengeTypes, difficulties } from '@/types';
import { choose, dailyChallenge, dateKey } from '@/lib/engine';
import { number, SourceList } from './ui';
import { Shuffle, ArrowRight, RotateCcw, Sparkles, SlidersHorizontal } from 'lucide-react';

interface TopicRouletteProps {
  initialCategory?: string;
  initialDifficulty?: string;
  initialType?: string;
  isDaily?: boolean;
  onClose?: () => void;
}

const ITEM_HEIGHT = 120; // Height in pixels for each topic card in the reel (prominent & readable for reels)
const VISIBLE_COUNT = 5; // Number of items visible in viewport
const VIEWPORT_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT; // 600px
const TOTAL_SLOTS = 52; // Number of slots in the reel before landing on target
const SPIN_DURATION_MS = 4800; // Duration of full dramatic spin

// Semantic category colors for tags and glowing accents
export const categoryColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  AI: { bg: '#0b1d3a', text: '#38bdf8', border: '#1e3a8a', glow: 'rgba(56, 189, 248, 0.4)' },
  'Developer Tools': { bg: '#1e1138', text: '#a78bfa', border: '#4c1d95', glow: 'rgba(167, 139, 250, 0.4)' },
  Infrastructure: { bg: '#08252a', text: '#22d3ee', border: '#155e75', glow: 'rgba(34, 211, 238, 0.4)' },
  'Open Source': { bg: '#062817', text: '#34d399', border: '#065f46', glow: 'rgba(52, 211, 153, 0.4)' },
  'Consumer Tech': { bg: '#2b0922', text: '#f472b6', border: '#831843', glow: 'rgba(244, 114, 182, 0.4)' },
  'Indian Tech': { bg: '#2f1505', text: '#fb923c', border: '#9a3412', glow: 'rgba(251, 146, 60, 0.4)' },
  'Engineering Systems': { bg: '#101438', text: '#818cf8', border: '#312e81', glow: 'rgba(129, 140, 248, 0.4)' },
  Cybersecurity: { bg: '#062624', text: '#2dd4bf', border: '#115e59', glow: 'rgba(45, 212, 191, 0.4)' },
  'Failure Cases': { bg: '#2f0d0d', text: '#f87171', border: '#7f1d1d', glow: 'rgba(248, 113, 113, 0.4)' },
  Technology: { bg: '#08252a', text: '#22d3ee', border: '#0e7490', glow: 'rgba(34, 211, 238, 0.4)' },
  'Business Models': { bg: '#2a2003', text: '#facc15', border: '#713f12', glow: 'rgba(250, 204, 21, 0.4)' },
};

export function getCategoryStyle(cat: string) {
  return categoryColors[cat] || { bg: '#1f1b13', text: '#ff642c', border: '#7c2d12', glow: 'rgba(255, 100, 44, 0.35)' };
}

export function TopicRoulette({
  initialCategory = '',
  initialDifficulty = '',
  initialType = '',
  isDaily = false,
}: TopicRouletteProps) {
  const { state, update, start, rouletteTick, rouletteHit, play } = useApp();
  const router = useAppRouter();

  // Filters
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [type, setType] = useState(initialType);
  const [showFilters, setShowFilters] = useState(false);

  // Filtered candidate pool
  const candidatePool = useMemo(() => {
    return state.challenges.filter(
      (c) =>
        (!category || c.category === category) &&
        (!difficulty || c.difficulty === difficulty) &&
        (!type || c.type === type)
    );
  }, [state.challenges, category, difficulty, type]);

  // Roulette animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Challenge | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reelItems, setReelItems] = useState<Challenge[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [justLocked, setJustLocked] = useState(false);

  const animRef = useRef<number | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinningRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const finishSpinRef = useRef<((immediate: boolean) => void) | null>(null);

  const cancelPending = useCallback(() => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    if (revealTimerRef.current !== null) clearTimeout(revealTimerRef.current);
    animRef.current = null;
    revealTimerRef.current = null;
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => {
      reducedMotionRef.current = media.matches;
      if (media.matches && spinningRef.current) finishSpinRef.current?.(true);
    };
    changed();
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  const lastIndexRef = useRef<number>(-1);
  const startTimeRef = useRef<number>(0);
  const targetScrollRef = useRef<number>(0);

  // If daily challenge mode
  useEffect(() => {
    if (isDaily && state.challenges.length > 0) {
      const daily = dailyChallenge(state.challenges);
      setWinner(daily);
      setRevealed(true);
    }
  }, [isDaily, state.challenges]);

  /**
   * Constructs the reel sequence:
   * Pads with random challenges, placing the chosen targetChallenge at slot index `targetIndex`
   */
  const buildReel = useCallback(
    (targetChallenge: Challenge, pool: Challenge[]) => {
      const items: Challenge[] = [];
      const safePool = pool;

      for (let i = 0; i < TOTAL_SLOTS; i++) {
        if (i === TOTAL_SLOTS - 3) {
          // The winning challenge lands 3 items from the end
          items.push(targetChallenge);
        } else {
          // Pick varied items from the pool
          const randomIdx = Math.floor(Math.random() * safePool.length);
          items.push(safePool[randomIdx]);
        }
      }
      return items;
    },
    []
  );

  /**
   * Custom easing function for the roulette:
   * 1. Gentle launch (0 - 0.12)
   * 2. High-speed spinning (0.12 - 0.45)
   * 3. Gradual deceleration (0.45 - 0.85)
   * 4. Heavy deliberate near-stops (0.85 - 0.97)
   * 5. Final settle snap (0.97 - 1.0)
   */
  const getProgress = (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    // Phase 1: Ramp up
    if (t < 0.15) {
      // Ease in cubic
      const p = t / 0.15;
      return 0.12 * Math.pow(p, 2.5);
    }

    // Phase 2: High speed spinning
    if (t < 0.45) {
      const p = (t - 0.15) / 0.3;
      return 0.12 + p * 0.46; // goes from 0.12 to 0.58
    }

    // Phase 3 & 4: Deceleration (quartic ease-out)
    const p = (t - 0.45) / 0.55;
    const remainingDistance = 1 - 0.58;
    // Cubic/quartic ease out
    const easeOut = 1 - Math.pow(1 - p, 3.2);
    return 0.58 + remainingDistance * easeOut;
  };

  /**
   * Triggers the topic roulette spin
   */
  const spinRoulette = useCallback(() => {
    if (isDaily || spinningRef.current) return;
    const pool = candidatePool;
    if (pool.length === 0) return;

    // Pick target topic deterministically before the animation
    const selected = choose(pool, state.seen, state.sessions);
    if (!selected) return;

    cancelPending();
    spinningRef.current = true;
    const reel = reducedMotionRef.current ? [] : buildReel(selected, pool);
    setReelItems(reel);
    setWinner(selected);
    setRevealed(false);
    setIsSpinning(true);
    setJustLocked(false);

    // Target scroll lands the winning item in the center window
    // Winning item is at index `TOTAL_SLOTS - 3`
    const targetIndex = TOTAL_SLOTS - 3;
    const targetY = targetIndex * ITEM_HEIGHT;
    targetScrollRef.current = targetY;

    startTimeRef.current = performance.now();
    lastIndexRef.current = -1;

    let recorded = false;
    const reveal = () => {
      revealTimerRef.current = null;
      spinningRef.current = false;
      finishSpinRef.current = null;
      setIsSpinning(false);
      setRevealed(true);
    };
    const finish = (immediate: boolean) => {
      cancelPending();
      setScrollY(targetY);
      setJustLocked(true);
      if (!recorded) {
        recorded = true;
        if (!immediate) rouletteHit();
        play('reveal');
        update(s => ({...s, seen: [...s.seen.filter(id => id !== selected.id), selected.id]}));
      }
      if (immediate) reveal();
      else revealTimerRef.current = setTimeout(reveal, 650);
    };
    finishSpinRef.current = finish;
    if (reducedMotionRef.current) {
      finish(true);
      return;
    }

    const step = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / SPIN_DURATION_MS);
      const progress = getProgress(t);
      const currentY = progress * targetY;

      setScrollY(currentY);

      // Track index passing the center line
      const currentIndex = Math.floor((currentY + ITEM_HEIGHT / 2) / ITEM_HEIGHT);

      if (currentIndex !== lastIndexRef.current && currentIndex >= 0 && currentIndex < reel.length) {
        lastIndexRef.current = currentIndex;

        // Calculate speed ratio
        const speedRatio = t < 0.5 ? Math.min(1, t / 0.25) : Math.max(0.1, 1 - (t - 0.5) / 0.5);
        const isNearStop = targetIndex - currentIndex <= 4 && targetIndex - currentIndex >= 0;

        rouletteTick(speedRatio, isNearStop);
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        finish(false);
      }
    };

    animRef.current = requestAnimationFrame(step);
  }, [isDaily, cancelPending, candidatePool, state.seen, state.sessions, buildReel, rouletteTick, rouletteHit, play, update]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      cancelPending();
      spinningRef.current = false;
      finishSpinRef.current = null;
    };
  }, [cancelPending]);

  // Keyboard shortcut: Space or Enter to spin if not spinning
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable],button,a,[role=button]')) return;
      if (!isDaily && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.repeat && !spinningRef.current && !revealed && candidatePool.length > 0 && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        spinRoulette();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDaily, candidatePool.length, revealed, spinRoulette]);

  // Active session check
  const activeSession = state.sessions.find((s) => s.id === state.activeId && s.phase !== 'complete');

  // Start the 30-minute research session
  const handleStartSession = () => {
    if (!winner) return;
    const sessionId = start(winner);
    router.push(`/research/${sessionId}`);
  };

  const centerItemIndex = Math.floor((scrollY + ITEM_HEIGHT / 2) / ITEM_HEIGHT);

  return (
    <div className="topic-roulette-container">
      {/* Top Header / Mode Banner */}
      <div className="roulette-header">
        <div className="roulette-eyebrow">
          <span className="live-pulse" />
          <span className="mono">
            {isDaily ? `DAILY CHALLENGE · ${dateKey()}` : '30 MINUTE · WHAT WILL YOU STUDY'}
          </span>
        </div>
        <h1 className="roulette-title">
          {revealed
            ? 'WHAT YOU WILL STUDY'
            : isSpinning
            ? 'SELECTING TOPIC…'
            : 'WHAT WILL YOU STUDY?'}
        </h1>
        <p className="roulette-subtitle">
          {revealed
            ? 'Your 30-minute deep-dive study challenge. Connect the dots and form your mental model.'
            : '30 minutes to study, understand, and break down a real-world system.'}
        </p>
      </div>

      {/* Filter Toolbar (Visible when not spinning and not revealed) */}
      {!isSpinning && !revealed && !isDaily && (
        <div className="roulette-controls-bar">
          <button
            className={`button quiet filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle roulette filters"
          >
            <SlidersHorizontal size={15} />
            <span>Filters {category || difficulty || type ? '(Active)' : ''}</span>
          </button>

          {showFilters && (
            <div className="roulette-filter-row">
              <label>
                <span>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All Categories ({state.challenges.length})</option>
                  {[...new Set(state.challenges.map((c) => c.category))].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({state.challenges.filter((c) => c.category === cat).length})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Difficulty</span>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="">All Difficulties</option>
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">All Types</option>
                  {challengeTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              {(category || difficulty || type) && (
                <button
                  className="button quiet reset-btn"
                  onClick={() => {
                    setCategory('');
                    setDifficulty('');
                    setType('');
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="pool-counter mono muted">
            {candidatePool.length} {candidatePool.length === 1 ? 'topic' : 'topics'} in pool
          </div>
        </div>
      )}

      {!isDaily && !revealed && candidatePool.length === 0 && (
        <p role="status" className="notice">No topics match these filters. Change or clear your filters to spin.</p>
      )}

      {/* Main Roulette Mechanism / Viewport */}
      {!revealed && (
        <div className="roulette-machine-box">
          {/* Mechanical Wheel Housing Frame */}
          <div className="roulette-reel-viewport" style={{ height: `${VIEWPORT_HEIGHT}px` }}>
            {/* Top & Bottom Vignette / Shadow Overlay */}
            <div className="reel-fade top" />
            <div className="reel-fade bottom" />

            {/* Central Target Window Brackets */}
            <div className={`selection-window ${isSpinning ? 'spinning' : ''} ${justLocked ? 'locked' : ''}`}>
              <div className="bracket bracket-left" />
              <div className="bracket bracket-right" />
              <div className="center-reticle" />
              <div className="center-tag mono">
                {isSpinning ? 'SPINNING…' : justLocked ? 'STUDY TOPIC LOCKED' : 'TOPIC TO STUDY'}
              </div>
            </div>

            {/* Scrolling Topic Reel Content */}
            <div
              className="reel-track"
              style={{
                transform: `translate3d(0, -${scrollY - (VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2}px, 0)`,
                transition: isSpinning ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              {(reelItems.length > 0 ? reelItems : state.challenges.slice(0, 15)).map((topic, idx) => {
                const isCentered = idx === centerItemIndex;
                const distance = Math.abs(idx - centerItemIndex);
                const style = getCategoryStyle(topic.category);

                return (
                  <div
                    key={`${topic.id}-${idx}`}
                    className={`reel-card ${isCentered ? 'active' : ''}`}
                    style={{
                      height: `${ITEM_HEIGHT}px`,
                      opacity: isCentered ? 1 : Math.max(0.2, 1 - distance * 0.28),
                      transform: isCentered ? 'scale(1.03)' : `scale(${Math.max(0.85, 1 - distance * 0.05)})`,
                    }}
                  >
                    <div className="reel-card-inner">
                      <div className="reel-meta">
                        <span className="reel-num mono">#{number(topic.number)}</span>
                        <span
                          className="reel-cat-badge"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            borderColor: style.border,
                          }}
                        >
                          {topic.category}
                        </span>
                        <span className="reel-diff mono muted">{topic.difficulty}</span>
                      </div>
                      <div className="reel-title">{topic.title}</div>
                      <div className="reel-type mono muted">{topic.type}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spin Control Button */}
          {!isSpinning && (
            <div className="roulette-actions">
              <button
                className="button primary big spin-btn"
                onClick={spinRoulette}
                disabled={candidatePool.length === 0}
              >
                <Shuffle size={20} className="spin-icon" />
                <span>SPIN TOPIC ROULETTE</span>
                <span className="shortcut mono">Space</span>
              </button>
            </div>
          )}

          {isSpinning && (
            <div className="roulette-status-indicator mono">
              <span className="ticking-indicator" />
              <span>DECELERATING SELECTOR…</span>
            </div>
          )}
        </div>
      )}

      {/* Cinematic Final Reveal Card (Appears after roulette lands) */}
      {revealed && winner && (
        <div className="cinematic-reveal-panel">
          <div className="reveal-badge-strip">
            <span className="mono orange">30 MINUTE TEST #{number(winner.number)}</span>
            <span className="reveal-divider">/</span>
            <span
              className="badge category-badge"
              style={{
                backgroundColor: getCategoryStyle(winner.category).bg,
                color: getCategoryStyle(winner.category).text,
                borderColor: getCategoryStyle(winner.category).border,
              }}
            >
              {winner.category}
            </span>
            <span className="badge difficulty-badge">{winner.difficulty}</span>
            <span className="mono muted">{winner.type}</span>
          </div>

          <div className="reveal-topic-hero">
            <p className="reveal-tagline mono orange">WHAT YOU WILL STUDY</p>
            <h2 className="reveal-topic-title">{winner.title}</h2>
            <p className="reveal-description">{winner.description}</p>
          </div>

          <div className="reveal-mission-box">
            <div className="mission-label mono">
              <Sparkles size={14} className="orange" />
              <span>THE 30-MINUTE STUDY MISSION</span>
            </div>
            <p className="mission-text">{winner.mission}</p>
          </div>

          <div className="reveal-specs-grid">
            <div className="spec-card">
              <span className="spec-label mono">STUDY CLOCK</span>
              <strong className="spec-val orange">30:00</strong>
              <span className="spec-sub">Deep research & mental model</span>
            </div>
            <div className="spec-card">
              <span className="spec-label mono">EXPLANATION CLOCK</span>
              <strong className="spec-val">05:00</strong>
              <span className="spec-sub">Explain what you learned</span>
            </div>
            <div className="spec-card">
              <span className="spec-label mono">COMPLEXITY</span>
              <strong className="spec-val complexity-val">{winner.difficulty}</strong>
              <span className="spec-sub">{winner.industry}</span>
            </div>
          </div>

          {activeSession ? (
            <div className="active-session-warning notice">
              <p>
                <strong>Unfinished Session in Progress:</strong> You have an active {activeSession.challenge.title} challenge. Finish or end it before starting another timed run.
              </p>
              <button
                className="button primary"
                onClick={() =>
                  router.push(
                    `/${activeSession.phase === 'research' ? 'research' : activeSession.phase === 'pitch' ? 'pitch' : 'result'}/${activeSession.id}`
                  )
                }
              >
                Resume Active Session
              </button>
            </div>
          ) : (
            <div className="reveal-cta-bar">
              <button className="button primary big start-30-btn" onClick={handleStartSession}>
                <span>START 30:00 STUDY</span>
                <ArrowRight size={20} />
              </button>
              {!isDaily && <button className="button quiet re-spin-btn" onClick={spinRoulette}>
                <RotateCcw size={16} />
                <span>Spin Again</span>
              </button>}
            </div>
          )}

          <div className="reveal-sources-box">
            <h3>Verified Starting Sources</h3>
            <SourceList challenge={winner} />
          </div>

          <div className="reveal-research-brief">
            <p className="eyebrow">RESEARCH OBJECTIVES</p>
            <ol className="brief-questions">
              {winner.researchQuestions.slice(0, 5).map((q, idx) => (
                <li key={idx}>
                  <span className="mono orange">0{idx + 1}</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
