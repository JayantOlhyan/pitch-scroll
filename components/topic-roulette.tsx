'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppRouter } from '@/hooks/use-location';
import { useApp } from '@/hooks/use-app';
import { Challenge, challengeTypes, difficulties } from '@/types';
import { choose, dailyChallenge, dateKey } from '@/lib/engine';
import { number, SourceList } from './ui';
import {
  Shuffle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Zap,
  Terminal,
  Server,
  Code2,
  Cpu,
  Shield,
  AlertTriangle,
  Layers,
  Building2,
  Compass,
  Radio,
  Trash2,
} from 'lucide-react';

interface TopicRouletteProps {
  initialCategory?: string;
  initialDifficulty?: string;
  initialType?: string;
  isDaily?: boolean;
  onClose?: () => void;
}

const ITEM_HEIGHT = 132; // Height in pixels for each topic card in the reel (prominent & readable)
const VISIBLE_COUNT = 5; // Number of items visible in viewport
const VIEWPORT_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT; // 660px
const TOTAL_SLOTS = 52; // Number of slots in the reel before landing on target (keeps slot 49 as winner for tests)
const SPIN_DURATION_MS = 4800; // Duration of full dramatic spin

// Semantic category colors for tags and glowing accents
export const categoryColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  AI: { bg: '#081a33', text: '#38bdf8', border: '#1d4ed8', glow: 'rgba(56, 189, 248, 0.45)' },
  'Developer Tools': { bg: '#180d2e', text: '#c084fc', border: '#6b21a8', glow: 'rgba(192, 132, 252, 0.45)' },
  Infrastructure: { bg: '#041f24', text: '#22d3ee', border: '#0e7490', glow: 'rgba(34, 211, 238, 0.45)' },
  'Open Source': { bg: '#042214', text: '#34d399', border: '#047857', glow: 'rgba(52, 211, 153, 0.45)' },
  'Consumer Tech': { bg: '#25071e', text: '#f472b6', border: '#9d174d', glow: 'rgba(244, 114, 182, 0.45)' },
  'Indian Tech': { bg: '#291204', text: '#fb923c', border: '#c2410c', glow: 'rgba(251, 146, 60, 0.45)' },
  'Engineering Systems': { bg: '#0d1033', text: '#818cf8', border: '#3730a3', glow: 'rgba(129, 140, 248, 0.45)' },
  Cybersecurity: { bg: '#03201e', text: '#2dd4bf', border: '#0f766e', glow: 'rgba(45, 212, 191, 0.45)' },
  'Failure Cases': { bg: '#270a0a', text: '#f87171', border: '#991b1b', glow: 'rgba(248, 113, 113, 0.45)' },
  Technology: { bg: '#041f24', text: '#22d3ee', border: '#0e7490', glow: 'rgba(34, 211, 238, 0.45)' },
  'Business Models': { bg: '#241a02', text: '#facc15', border: '#854d0e', glow: 'rgba(250, 204, 21, 0.45)' },
};

export function getCategoryStyle(cat: string) {
  return categoryColors[cat] || { bg: '#1f1b13', text: '#ff642c', border: '#7c2d12', glow: 'rgba(255, 100, 44, 0.35)' };
}

export function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'AI':
      return <Zap size={15} />;
    case 'Developer Tools':
      return <Terminal size={15} />;
    case 'Infrastructure':
      return <Server size={15} />;
    case 'Open Source':
      return <Code2 size={15} />;
    case 'Engineering Systems':
      return <Cpu size={15} />;
    case 'Cybersecurity':
      return <Shield size={15} />;
    case 'Failure Cases':
      return <AlertTriangle size={15} />;
    case 'Business Models':
      return <Layers size={15} />;
    case 'Indian Tech':
      return <Building2 size={15} />;
    default:
      return <Compass size={15} />;
  }
}

export function TopicRoulette({
  initialCategory = '',
  initialDifficulty = '',
  initialType = '',
  isDaily = false,
}: TopicRouletteProps) {
  const { state, update, start, deleteSession, discardAndStart, rouletteTick, rouletteHit, play } = useApp();
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
  const [confirmAction, setConfirmAction] = useState<'discard-and-start' | 'delete-only' | null>(null);

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
   * Pads with varied challenges, placing targetChallenge at slot index TOTAL_SLOTS - 3 (index 49)
   */
  const buildReel = useCallback(
    (targetChallenge: Challenge, pool: Challenge[]) => {
      const items: Challenge[] = [];
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        if (i === TOTAL_SLOTS - 3) {
          items.push(targetChallenge);
        } else {
          const randomIdx = Math.floor(Math.random() * pool.length);
          items.push(pool[randomIdx]);
        }
      }
      return items;
    },
    []
  );

  /**
   * Custom easing function for the roulette:
   * 1. Gentle launch (0 - 0.15)
   * 2. High-speed spinning (0.15 - 0.45)
   * 3. Gradual deceleration (0.45 - 0.85)
   * 4. Heavy deliberate near-stops (0.85 - 0.97)
   * 5. Final settle snap (0.97 - 1.0)
   */
  const getProgress = (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    // Phase 1: Ramp up
    if (t < 0.15) {
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
    setConfirmAction(null);

    // Target scroll lands the winning item in the center window
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
        update((s) => ({ ...s, seen: [...s.seen.filter((id) => id !== selected.id), selected.id] }));
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
      if (
        !isDaily &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey &&
        !e.repeat &&
        !spinningRef.current &&
        !revealed &&
        candidatePool.length > 0 &&
        (e.code === 'Space' || e.code === 'Enter')
      ) {
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

  // Discard previous active session and start this new challenge immediately
  const handleDiscardAndStartNew = () => {
    if (!winner || !activeSession) return;
    const sessionId = discardAndStart(activeSession.id, winner);
    router.push(`/research/${sessionId}`);
  };

  // Delete previous active session only (clears active session so user can re-spin or choose freely)
  const handleDeletePreviousOnly = () => {
    if (!activeSession) return;
    deleteSession(activeSession.id);
    setConfirmAction(null);
  };

  const centerItemIndex = Math.floor((scrollY + ITEM_HEIGHT / 2) / ITEM_HEIGHT);

  const categories = useMemo(
    () => [...new Set(state.challenges.map((c) => c.category))],
    [state.challenges]
  );

  return (
    <div className="topic-roulette-container">
      {/* Ambient background glow ring */}
      <div className="roulette-ambient-halo" aria-hidden="true" />

      {/* Top Header / Mode Banner */}
      <div className="roulette-header">
        <div className="roulette-eyebrow">
          <span className="live-pulse" />
          <span className="mono">
            {isDaily ? `DAILY CHALLENGE · ${dateKey()}` : '30 MINUTE · WHAT WILL YOU STUDY'}
          </span>
          <span className="hud-sep">·</span>
          <span className="mono pool-pill">
            <Radio size={12} className="pulse-icon" />
            {candidatePool.length} {candidatePool.length === 1 ? 'TOPIC' : 'TOPICS'} ACTIVE
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
          {/* Quick Category Chips */}
          <div className="quick-category-chips" role="tablist" aria-label="Quick category selector">
            <button
              className={`chip ${!category ? 'active' : ''}`}
              onClick={() => setCategory('')}
              type="button"
            >
              <span>All Topics</span>
              <span className="chip-count mono">{state.challenges.length}</span>
            </button>
            {categories.slice(0, 7).map((cat) => {
              const catCount = state.challenges.filter((c) => c.category === cat).length;
              const isSelected = category === cat;
              const style = getCategoryStyle(cat);
              return (
                <button
                  key={cat}
                  className={`chip ${isSelected ? 'active' : ''}`}
                  onClick={() => setCategory(isSelected ? '' : cat)}
                  type="button"
                  style={
                    isSelected
                      ? {
                        borderColor: style.border,
                        backgroundColor: style.bg,
                        color: style.text,
                        boxShadow: `0 0 16px ${style.glow}`,
                      }
                      : undefined
                  }
                >
                  <span className="chip-icon">{getCategoryIcon(cat)}</span>
                  <span>{cat}</span>
                  <span className="chip-count mono">{catCount}</span>
                </button>
              );
            })}
          </div>

          <div className="filter-actions-row">
            <button
              className={`button quiet filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle roulette filters"
              type="button"
            >
              <SlidersHorizontal size={15} />
              <span>Fine-Tune Filters {category || difficulty || type ? '(Active)' : ''}</span>
            </button>

            {(category || difficulty || type) && (
              <button
                className="button quiet reset-btn"
                onClick={() => {
                  setCategory('');
                  setDifficulty('');
                  setType('');
                }}
                type="button"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="roulette-filter-row">
              <label>
                <span>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All Categories ({state.challenges.length})</option>
                  {categories.map((cat) => (
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
            </div>
          )}
        </div>
      )}

      {!isDaily && !revealed && candidatePool.length === 0 && (
        <p role="status" className="notice">
          No topics match these filters. Change or clear your filters to spin.
        </p>
      )}

      {/* Main Roulette Mechanism / Viewport */}
      {!revealed && (
        <div className="roulette-machine-box">
          {/* Machine Header Telemetry Strip */}
          <div className="roulette-hud-strip">
            <div className="hud-left mono">
              <span className="hud-led-green" />
              <span>ROULETTE CORE // ACTIVE</span>
            </div>
            <div className="hud-center mono">
              <span className="muted">ROTATION:</span> 4.8S DUAL-CURVE · <span className="muted">SLOTS:</span> 52 NODES
            </div>
            <div className="hud-right mono">
              <span className="muted">TARGET POOL:</span> <strong className="orange">{candidatePool.length}</strong>
            </div>
          </div>

          {/* Corner Tech Marks */}
          <span className="hud-corner top-left" aria-hidden="true" />
          <span className="hud-corner top-right" aria-hidden="true" />
          <span className="hud-corner bottom-left" aria-hidden="true" />
          <span className="hud-corner bottom-right" aria-hidden="true" />

          {/* Mechanical Wheel Housing Frame */}
          <div className="roulette-reel-viewport" style={{ height: `${VIEWPORT_HEIGHT}px` }}>
            {/* Top & Bottom Vignette / Shadow Overlay */}
            <div className="reel-fade top" />
            <div className="reel-fade bottom" />

            {/* Central Target Window Brackets */}
            <div className={`selection-window ${isSpinning ? 'spinning' : ''} ${justLocked ? 'locked' : ''}`}>
              <div className="bracket bracket-left">
                <span className="bracket-notch top" />
                <span className="bracket-notch bottom" />
              </div>
              <div className="bracket bracket-right">
                <span className="bracket-notch top" />
                <span className="bracket-notch bottom" />
              </div>
              <div className="laser-guideline" />
              <div className="center-tag mono">
                <span className="tag-indicator" />
                <span>
                  {isSpinning
                    ? 'SCANNING CANDIDATES…'
                    : justLocked
                      ? 'STUDY TOPIC LOCKED'
                      : 'TOPIC TO STUDY'}
                </span>
              </div>
            </div>

            {/* Scrolling Topic Reel Content */}
            <div
              className="reel-track"
              style={{
                transform: `translate3d(0, -${scrollY - (VIEWPORT_HEIGHT - ITEM_HEIGHT) / 2}px, 0)`,
                transition: isSpinning ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {(reelItems.length > 0 ? reelItems : state.challenges.slice(0, 15)).map((topic, idx) => {
                const diff = idx - centerItemIndex;
                const distance = Math.abs(diff);
                const isCentered = distance === 0;
                const style = getCategoryStyle(topic.category);

                // 3D Cylinder Curvature Transform
                const rotateX = isCentered ? 0 : diff < 0 ? Math.min(22, distance * 11) : -Math.min(22, distance * 11);
                const translateZ = isCentered ? 36 : -distance * 22;
                const scale = isCentered ? 1.04 : Math.max(0.86, 1 - distance * 0.05);
                const opacity = isCentered ? 1 : Math.max(0.18, 1 - distance * 0.28);
                const blur = isCentered ? 0 : Math.min(2.5, distance * 0.75);

                return (
                  <div
                    key={`${topic.id}-${idx}`}
                    className={`reel-card ${isCentered ? 'active' : ''}`}
                    style={{
                      height: `${ITEM_HEIGHT}px`,
                      opacity,
                      transform: `perspective(1200px) rotateX(${rotateX}deg) translateZ(${translateZ}px) scale(${scale})`,
                      filter: blur > 0 ? `blur(${blur}px)` : undefined,
                    }}
                  >
                    <div
                      className="reel-card-inner"
                      style={
                        isCentered
                          ? {
                            borderColor: style.border,
                            boxShadow: `0 14px 45px rgba(0, 0, 0, 0.9), 0 0 35px ${style.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                          }
                          : undefined
                      }
                    >
                      <div className="reel-meta">
                        <span className="reel-num mono">#{number(topic.number)}</span>
                        <span
                          className="reel-cat-badge"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            borderColor: style.border,
                            boxShadow: isCentered ? `0 0 14px ${style.glow}` : undefined,
                          }}
                        >
                          {getCategoryIcon(topic.category)}
                          <span>{topic.category}</span>
                        </span>
                        <span className={`reel-diff mono diff-${topic.difficulty.toLowerCase()}`}>
                          {topic.difficulty}
                        </span>
                      </div>

                      <div className="reel-title" title={topic.title}>
                        {topic.title}
                      </div>

                      <div className="reel-type mono">
                        <span className="type-badge">{topic.type}</span>
                      </div>
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
                type="button"
              >
                <span className="btn-glow-aura" />
                <Shuffle size={22} className="spin-icon" />
                <span className="spin-btn-label">SPIN TOPIC ROULETTE</span>
                <span className="shortcut mono">Space</span>
              </button>
              <div className="spin-keycap-hint mono">
                <span>PRESS <kbd>SPACE</kbd> OR <kbd>ENTER</kbd> TO SPIN</span>
              </div>
            </div>
          )}

          {isSpinning && (
            <div className="roulette-status-indicator mono">
              <span className="ticking-indicator" />
              <span>HIGH SPEED SELECTOR DECELERATING…</span>
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
                boxShadow: `0 0 20px ${getCategoryStyle(winner.category).glow}`,
              }}
            >
              {getCategoryIcon(winner.category)}
              <span>{winner.category}</span>
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
              <Sparkles size={16} className="orange" />
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
              <div className="active-session-header">
                <AlertTriangle size={20} className="warning-icon orange" />
                <p>
                  <strong>Unfinished Session in Progress:</strong> You have an active{' '}
                  <span className="active-session-title">{activeSession.challenge.title}</span> challenge.
                  Resume it, or start over fresh with a new session.
                </p>
              </div>

              {confirmAction === null && (
                <div className="active-session-actions">
                  <button
                    className="button primary active-session-resume-btn"
                    onClick={() =>
                      router.push(
                        `/${activeSession.phase === 'research' ? 'research' : activeSession.phase === 'pitch' ? 'pitch' : 'result'}/${activeSession.id}`
                      )
                    }
                    type="button"
                  >
                    <ArrowRight size={17} />
                    <span>Resume Active Session</span>
                  </button>

                  <button
                    className="button danger-outline active-session-discard-start-btn"
                    onClick={() => setConfirmAction('discard-and-start')}
                    type="button"
                  >
                    <Trash2 size={16} />
                    <span>Start Over & Delete Previous</span>
                  </button>

                  <button
                    className="button quiet text-danger active-session-delete-only-btn"
                    onClick={() => setConfirmAction('delete-only')}
                    type="button"
                  >
                    <span>Delete Previous Session</span>
                  </button>
                </div>
              )}

              {confirmAction === 'discard-and-start' && (
                <div className="active-session-confirm-box">
                  <div className="confirm-text">
                    <p>
                      <strong>Start over with a new study?</strong> This will permanently delete your unfinished session and notes for{' '}
                      <strong>{activeSession.challenge.title}</strong> and start a new 30:00 study on <strong>{winner.title}</strong>.
                    </p>
                  </div>
                  <div className="confirm-actions">
                    <button
                      className="button danger-solid"
                      onClick={handleDiscardAndStartNew}
                      type="button"
                    >
                      <Trash2 size={15} />
                      <span>Yes, Delete & Start New (30:00)</span>
                    </button>
                    <button
                      className="button quiet"
                      onClick={() => setConfirmAction(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {confirmAction === 'delete-only' && (
                <div className="active-session-confirm-box">
                  <div className="confirm-text">
                    <p>
                      <strong>Delete unfinished session?</strong> This will permanently delete{' '}
                      <strong>{activeSession.challenge.title}</strong> from this device so you can start or spin freely.
                    </p>
                  </div>
                  <div className="confirm-actions">
                    <button
                      className="button danger-solid"
                      onClick={handleDeletePreviousOnly}
                      type="button"
                    >
                      <Trash2 size={15} />
                      <span>Yes, Delete Session</span>
                    </button>
                    <button
                      className="button quiet"
                      onClick={() => setConfirmAction(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="reveal-cta-bar">
              <button className="button primary big start-30-btn" onClick={handleStartSession} type="button">
                <span>START 30:00 STUDY</span>
                <ArrowRight size={22} />
              </button>
              {!isDaily && (
                <button className="button quiet re-spin-btn" onClick={spinRoulette} type="button">
                  <RotateCcw size={16} />
                  <span>Spin Again</span>
                </button>
              )}
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
