'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, Command, Volume2, VolumeX, X, Zap, Cpu, Server, Terminal, Shield, AlertTriangle, Layers, Building2, Code2, RotateCcw } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { Challenge, Session } from '@/types';
import { formatTime, remaining, statusFor } from '@/lib/engine';
import { unlockAudio } from '@/lib/sound';
import { ReactNode, useEffect, useRef } from 'react';
import { getCategoryStyle } from './topic-roulette';

export const number = (n: number) => String(n).padStart(3, '0');

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="30 Minute home">
      <span className="logo-mark">
        <i />
        <i />
        <i />
      </span>
      <strong>
        30<span>MINUTE</span>
      </strong>
    </Link>
  );
}

export function Badge({
  children,
  category,
}: {
  children: ReactNode;
  category?: string;
}) {
  if (category) {
    const style = getCategoryStyle(category);
    return (
      <span
        className="badge category-badge"
        style={{
          backgroundColor: style.bg,
          color: style.text,
          borderColor: style.border,
        }}
      >
        {children}
      </span>
    );
  }
  return <span className="badge">{children}</span>;
}

export function SoundControls() {
  const { state, update, play } = useApp();
  const p = state.preferences;
  return (
    <div className="sound-controls">
      <button
        className="quiet sound-btn"
        onClick={() => {
          unlockAudio();
          update((s) => ({
            ...s,
            preferences: { ...s.preferences, sound: !p.sound },
          }));
          play('click');
        }}
        aria-label={p.sound ? 'Mute sound' : 'Enable sound'}
        title="Toggle procedural audio (Hotkey: M)"
      >
        {p.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span>Sound {p.sound ? 'on' : 'off'}</span>
      </button>
      <label className="volume" title="Master volume">
        <span className="sr-only">Master volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step=".05"
          value={p.volume}
          onChange={(e) =>
            update((s) => ({
              ...s,
              preferences: { ...s.preferences, volume: Number(e.target.value) },
            }))
          }
        />
      </label>
    </div>
  );
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'AI':
      return <Zap size={18} />;
    case 'Developer Tools':
      return <Terminal size={18} />;
    case 'Infrastructure':
      return <Server size={18} />;
    case 'Open Source':
      return <Code2 size={18} />;
    case 'Engineering Systems':
      return <Cpu size={18} />;
    case 'Cybersecurity':
      return <Shield size={18} />;
    case 'Failure Cases':
      return <AlertTriangle size={18} />;
    case 'Business Models':
      return <Layers size={18} />;
    case 'Indian Tech':
      return <Building2 size={18} />;
    default:
      return <Command size={18} />;
  }
}

export function ChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const { state } = useApp();
  const status = statusFor(c, state);
  const catStyle = getCategoryStyle(c.category);

  return (
    <Link href={`/challenges/${c.slug}`} className="challenge-card">
      <div className="row between card-top">
        <span className="mono muted">CASE / #{number(c.number)}</span>
        <div className="card-top-right">
          {c.featured && <span className="featured-pill mono">FEATURED</span>}
          <ArrowUpRight size={17} className="card-arrow" />
        </div>
      </div>

      <div
        className="topic-symbol"
        aria-hidden="true"
        style={{
          borderColor: catStyle.border,
          color: catStyle.text,
          background: catStyle.bg,
        }}
      >
        {c.title === 'Perplexity' ? (
          <Command />
        ) : c.title === 'Docker' ? (
          <span>▤</span>
        ) : c.title === 'Netflix' ? (
          <b>N</b>
        ) : (
          getCategoryIcon(c.category)
        )}
      </div>

      <h3>{c.title}</h3>
      <p className="card-category" style={{ color: catStyle.text }}>
        {c.category} · {c.type}
      </p>
      <p className="card-description">{c.description}</p>

      <div className="row between card-bottom">
        <Badge>{c.difficulty}</Badge>
        <span className={`mono status ${status.toLowerCase().replace(/\s+/g, '-')}`}>
          {status === 'Untouched' ? c.type : status}
        </span>
      </div>
    </Link>
  );
}

export function SourceList({ challenge }: { challenge: Challenge }) {
  return (
    <div className="source-list">
      {challenge.sources.length ? (
        challenge.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
            <div>
              <strong>{s.label}</strong>
              <span>{new URL(s.url).hostname}</span>
            </div>
            <ArrowUpRight size={18} />
          </a>
        ))
      ) : (
        <p className="muted">No sources added. Start with the subject’s official website.</p>
      )}
      <p className="hint">
        Verified starting points for your research. Check the date, follow the evidence, form your own view.
      </p>
    </div>
  );
}

export function Timer({
  session,
  large = false,
  onReset,
}: {
  session: Session;
  large?: boolean;
  onReset?: () => void;
}) {
  const { now } = useApp();
  const seconds = remaining(session, now);
  const duration = session.phase === 'research' ? 1800 : 300;

  // Determine semantic color state from remaining seconds
  // 30:00 - 10:01: normal orange
  // 10:00 - 05:01: warning amber (warn-10)
  // 05:00 - 01:01: stronger warning orange-red (warn-5)
  // 01:00 - 00:31: urgent red-orange (warn-1)
  // 00:30 - 00:00: critical red pulse (critical)
  const timerStage =
    seconds <= 30
      ? 'critical'
      : seconds <= 60
      ? 'warn-1'
      : seconds <= 300
      ? 'warn-5'
      : seconds <= 600
      ? 'warn-10'
      : 'normal';

  return (
    <div className={`timer-block stage-${timerStage} ${large ? 'large' : ''} ${seconds <= 60 ? 'urgent' : ''}`}>
      <div className="row between mono">
        <span>{session.phase === 'research' ? 'Research time (30:00)' : 'Pitch time (05:00)'}</span>
        <span className="timer-state">
          {session.pausedAt ? (
            'Paused'
          ) : (
            <>
              <i className={`live-dot ${timerStage === 'critical' ? 'critical-dot' : ''}`} /> In progress
            </>
          )}
          {onReset && (
            <button
              type="button"
              className="timer-reset-btn"
              onClick={onReset}
              title={session.phase === 'pitch' ? 'Reset pitch timer to 05:00' : 'Reset timer'}
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
        </span>
      </div>

      <div className={`timer timer-${timerStage}`} role="timer" aria-label={`${formatTime(seconds)} remaining`}>
        {formatTime(seconds)}
      </div>

      <progress
        value={seconds}
        max={duration}
        className={`timer-progress progress-${timerStage}`}
        aria-label="Time remaining"
      />

      <div className="row between timer-caption">
        <span>{session.practice ? 'Practice session' : 'The clock is running.'}</span>
        <span>
          {timerStage === 'critical'
            ? 'FINAL SECONDS'
            : timerStage === 'warn-1'
            ? '1 MINUTE WARNING'
            : timerStage === 'warn-5'
            ? '5 MINUTE WARNING'
            : timerStage === 'warn-10'
            ? '10 MINUTE WARNING'
            : session.phase === 'research'
            ? '30 minutes. One subject.'
            : 'Make every word count.'}
        </span>
      </div>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const el = ref.current;
    return () => el?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="row between dialog-header">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <Clock3 size={36} />
      <h2>{title}</h2>
      <p>{children}</p>
      <Link className="button primary" href="/challenge">
        Start a challenge
      </Link>
    </div>
  );
}

export function SectionTitle({
  label,
  title,
  children,
}: {
  label?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {label && <p className="eyebrow">{label}</p>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
