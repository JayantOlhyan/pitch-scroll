'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Copy, Download, Shuffle } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { Session, scoreLabels, reflectionLabels } from '@/types';
import { formatTime, score } from '@/lib/engine';
import { contentAssets, renderResult, shareToken } from '@/lib/sharing';
import { Badge, number, SourceList, Modal } from './ui';
import { getCategoryStyle } from './topic-roulette';

export function Assessment({ session: s }: { session: Session }) {
  const { editSession, play } = useApp();

  return (
    <div className="page assessment">
      <div className="page-title">
        <div>
          <p className="eyebrow">Challenge complete / test #{number(s.number)}</p>
          <h1>What actually stuck?</h1>
          <p>{s.challenge.title} · An honest score is more useful than a perfect one.</p>
        </div>
        <span className="completion-mark">
          <Check size={28} />
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          editSession(s.id, (x) => ({
            ...x,
            phase: 'complete',
            completedAt: Date.now(),
          }));
          play('complete');
        }}
      >
        <div className="assessment-grid">
          <div className="panel">
            <h2>Assess your understanding</h2>
            <p className="muted">1 = unclear · 5 = working model · 10 = can teach it</p>
            {scoreLabels.map((label, i) => (
              <label className="score-input" key={label}>
                <span>
                  {label}
                  <strong>
                    {s.scores[i]}
                    <small>/10</small>
                  </strong>
                </span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={s.scores[i]}
                  onChange={(e) =>
                    editSession(s.id, (x) => ({
                      ...x,
                      scores: x.scores.map((v, j) => (i === j ? Number(e.target.value) : v)),
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <div className="reflection-form">
            {reflectionLabels.map((label, i) => (
              <label key={label}>
                <span className="mono orange">0{i + 1}</span>
                {label}
                <textarea
                  required={i === 3}
                  maxLength={3000}
                  value={s.reflections[i]}
                  placeholder={i === 3 ? 'The single most important takeaway to share…' : 'Write your reflection…'}
                  onChange={(e) =>
                    editSession(s.id, (x) => ({
                      ...x,
                      reflections: x.reflections.map((v, j) => (i === j ? e.target.value : v)),
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="assessment-submit">
          <span>Saved on this device as you write.</span>
          <button className="button primary big" type="submit">
            Create my scorecard
          </button>
        </div>
      </form>
    </div>
  );
}

export function ResultCard({ session: s }: { session: Session }) {
  const catStyle = getCategoryStyle(s.challenge.category);

  return (
    <div
      className="result-card"
      style={{
        borderTopColor: catStyle.text,
      }}
    >
      <div className="row between">
        <span className="result-brand">
          <b>30</b> MINUTE
        </span>
        <span className="mono muted">TEST #{number(s.number)}</span>
      </div>

      <div className="result-topic">
        <p className="eyebrow">{s.practice ? 'Practice completed' : 'Challenge completed'}</p>
        <h1>{s.challenge.title}</h1>
        <div className="row">
          <span
            className="badge category-badge"
            style={{
              backgroundColor: catStyle.bg,
              color: catStyle.text,
              borderColor: catStyle.border,
            }}
          >
            {s.challenge.category}
          </span>
          <Badge>{s.challenge.difficulty}</Badge>
          <span className="mono muted">{s.challenge.type}</span>
        </div>
      </div>

      <div className="result-metrics">
        <div>
          <span>Research</span>
          <strong>{formatTime(s.researchSeconds)}</strong>
        </div>
        <div>
          <span>Pitch</span>
          <strong>{formatTime(s.pitchSeconds)}</strong>
        </div>
        <div>
          <span>Self score</span>
          <strong className="orange">
            {score(s).toFixed(1)}
            <small>/10</small>
          </strong>
        </div>
      </div>

      <div className="result-scores">
        {scoreLabels.map((label, i) => (
          <div key={label}>
            <span>{label}</span>
            <div className="score-track">
              <i
                style={{
                  width: `${s.scores[i] * 10}%`,
                  backgroundColor: s.scores[i] >= 8 ? '#ff642c' : s.scores[i] >= 6 ? '#f59e0b' : catStyle.text,
                }}
              />
            </div>
            <strong>
              {s.scores[i]}
              <small>/10</small>
            </strong>
          </div>
        ))}
      </div>

      <div className="takeaway">
        <p className="eyebrow">The key takeaway</p>
        <blockquote>{s.reflections[3] || 'No takeaway recorded.'}</blockquote>
      </div>

      <div className="result-signoff mono">30 MINUTES TO UNDERSTAND. 5 MINUTES TO PITCH.</div>
    </div>
  );
}

export function Results({ session: s, shared = false }: { session: Session; shared?: boolean }) {
  const [message, setMessage] = useState('');
  const [copyText, setCopyText] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  async function copy(text: string, label: string) {
    setCopyText(text);
    setMessage('Text ready. If clipboard access is unavailable, copy it from the field below.');
    try {
      await navigator.clipboard.writeText(text);
      setMessage(label);
    } catch {
      setMessage('Clipboard unavailable. Select and copy the text below.');
    }
  }

  return (
    <div className="page results">
      {preview && (
        <Modal title="Your result card (1080 × 1350)" onClose={() => setPreview('')}>
          <img
            src={preview}
            alt={`30 MINUTE result card for ${s.challenge.title}`}
            style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain', marginBottom: 20 }}
          />
          <div className="actions">
            <a
              className="button primary"
              href={preview}
              download={`30-minute-${s.challenge.slug}-${s.number}.png`}
            >
              <Download size={16} /> Save PNG (1080 × 1350)
            </a>
            <button className="button" onClick={() => setPreview('')}>
              Close
            </button>
          </div>
          <p className="hint">High-resolution PNG optimized for Instagram, Twitter/X, and LinkedIn posts.</p>
        </Modal>
      )}

      <div className="result-layout">
        <div>
          <ResultCard session={s} />

          <div className="actions result-actions">
            <button
              className="button primary"
              onClick={() =>
                renderResult(s)
                  .then((blob) => setPreview(URL.createObjectURL(blob)))
                  .catch((e) => setMessage(String(e.message)))
              }
            >
              <Download size={16} /> Download result card
            </button>

            <button
              className="button"
              onClick={() =>
                copy(
                  `${location.origin}/result/shared#${shareToken(s)}`,
                  'Share link copied. It includes your score and key takeaway.'
                )
              }
            >
              <Copy size={16} /> Copy share link
            </button>
          </div>

          <p className="hint">
            PNG export · 1080 × 1350 · Share link includes scorecard and key takeaway without private workspace notes.
          </p>
          {message && <p role="status" className="orange notice-toast">{message}</p>}

          {copyText && (
            <label className="copy-fallback">
              Copy text
              <textarea readOnly value={copyText} onFocus={(e) => e.target.select()} />
            </label>
          )}

          <div className="next-challenge-row">
            <Link href="/challenge" className="button primary">
              <Shuffle size={16} /> Start Next Challenge
            </Link>
          </div>
        </div>

        <aside className="creator-tools">
          <p className="eyebrow">CONTENT CREATOR MODE</p>
          <h2>Make it an episode.</h2>
          <p className="muted">
            Tested titles, hooks, and caption angles generated for your episode.
          </p>

          {contentAssets(s).map(([label, text]) => (
            <div className="content-asset" key={label}>
              <div className="row between">
                <h3>{label}</h3>
                <button
                  className="icon-button"
                  aria-label={`Copy ${label}`}
                  onClick={() => copy(text, `${label} copied.`)}
                >
                  <Copy size={15} />
                </button>
              </div>
              <p>{text}</p>
            </div>
          ))}
        </aside>
      </div>

      {!shared && (
        <section className="section">
          <h2>Your field notes</h2>
          <div className="field-notes">
            {s.reflections.slice(0, 3).map((r, i) => (
              <div key={i}>
                <h3>{reflectionLabels[i]}</h3>
                <p>{r || 'No reflection recorded.'}</p>
              </div>
            ))}
          </div>

          <details>
            <summary>Open full research notes and starting sources</summary>
            {Object.entries(s.notes)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div className="read-note" key={k}>
                  <h3>{k}</h3>
                  <p>{v}</p>
                </div>
              ))}
            <SourceList challenge={s.challenge} />
          </details>
        </section>
      )}
    </div>
  );
}
