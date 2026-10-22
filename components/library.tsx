'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Plus, Shuffle, ArrowRight, AlertTriangle, Trash2 } from 'lucide-react';
import { useAppRouter } from '@/hooks/use-location';
import { useApp } from '@/hooks/use-app';
import { Challenge, challengeTypes, difficulties } from '@/types';
import { dateKey, statusFor } from '@/lib/engine';
import { Badge, ChallengeCard, SourceList, number } from './ui';
import { TopicRoulette, getCategoryStyle } from './topic-roulette';

export function Library({ initialCategory = '' }: { initialCategory?: string }) {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState('');

  const list = state.challenges.filter(
    (c) =>
      (!category || c.category === category) &&
      (!difficulty || c.difficulty === difficulty) &&
      (!type || c.type === type) &&
      (!industry || c.industry === industry) &&
      (!status || statusFor(c, state) === status) &&
      `${c.title} ${c.category} ${c.type} ${c.industry} ${c.difficulty} ${c.keywords.join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="page library-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">A field guide for the curious</p>
          <h1>
            Challenge library
            <span className="count">{state.challenges.length}</span>
          </h1>
          <p>Real companies. Complex systems. Thirty minutes to connect the dots.</p>
        </div>
        <div className="actions">
          <Link href="/challenge" className="button primary">
            <Shuffle size={16} /> Spin Roulette
          </Link>
          <Link href="/admin?new=1" className="button">
            <Plus size={16} /> Custom challenge
          </Link>
        </div>
      </div>

      <div className="library-layout">
        <aside className="filters">
          <div className="row">
            <SlidersHorizontal size={16} />
            <h3>Filters</h3>
          </div>

          {[
            ['Category', category, setCategory, [...new Set(state.challenges.map((c) => c.category))]],
            ['Difficulty', difficulty, setDifficulty, difficulties],
            ['Type', type, setType, challengeTypes],
            ['Industry', industry, setIndustry, [...new Set(state.challenges.map((c) => c.industry))]],
            ['Status', status, setStatus, ['Untouched', 'In progress', 'Completed']],
          ].map(([label, value, setter, options]) => (
            <label key={label as string}>
              {label as string}
              <select
                value={value as string}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              >
                <option value="">All {String(label).toLowerCase()}</option>
                {(options as readonly string[]).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}

          <div className="filter-legend">
            <h4 className="mono muted">Domain Key</h4>
            <div className="filter-legend-grid">
              {[
                { name: 'AI', color: '#38bdf8' },
                { name: 'Dev Tools', color: '#c084fc' },
                { name: 'Infra', color: '#22d3ee' },
                { name: 'OSS', color: '#34d399' },
                { name: 'Systems', color: '#818cf8' },
                { name: 'Security', color: '#2dd4bf' },
              ].map((item) => {
                const fullCat =
                  item.name === 'Dev Tools'
                    ? 'Developer Tools'
                    : item.name === 'Infra'
                    ? 'Infrastructure'
                    : item.name === 'OSS'
                    ? 'Open Source'
                    : item.name === 'Systems'
                    ? 'Engineering Systems'
                    : item.name === 'Security'
                    ? 'Cybersecurity'
                    : item.name;
                const active = category === fullCat;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={`legend-pill ${active ? 'active' : ''}`}
                    onClick={() => setCategory(active ? '' : fullCat)}
                    title={`Filter by ${item.name}`}
                  >
                    <span className="legend-dot" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filter-legend difficulty-legend">
            <h4 className="mono muted">Difficulty Guide</h4>
            <div className="difficulty-legend-list">
              {[
                { level: 'Easy', color: '#34d399', desc: 'Accessible products & architectures' },
                { level: 'Medium', color: '#facc15', desc: 'Developer platforms & pipelines' },
                { level: 'Hard', color: '#fb923c', desc: 'Distributed systems & storage engines' },
                { level: 'Insane', color: '#f87171', desc: 'Low-level protocols, kernels & CVEs' },
              ].map((d) => {
                const active = difficulty === d.level;
                return (
                  <button
                    key={d.level}
                    type="button"
                    className={`difficulty-legend-row ${active ? 'active' : ''}`}
                    onClick={() => setDifficulty(active ? '' : d.level)}
                    title={`Filter by ${d.level}: ${d.desc}`}
                  >
                    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                      <span className="legend-dot" style={{ backgroundColor: d.color }} />
                      <strong className="mono">{d.level}</strong>
                    </div>
                    <span className="difficulty-desc">{d.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="quiet"
            onClick={() => {
              setSearch('');
              setCategory('');
              setType('');
              setDifficulty('');
              setIndustry('');
              setStatus('');
            }}
          >
            Reset filters
          </button>

          <div className="filter-note">
            <span className="orange">30 / 05</span>
            <p>
              Pick a gap in your knowledge.
              <br />
              Go find the edges.
            </p>
          </div>
        </aside>

        <div>
          <div className="library-toolbar">
            <label className="search-input">
              <Search size={18} />
              <span className="sr-only">Search challenges</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics, technologies, industries…"
              />
            </label>
            <span className="mono muted">{list.length} cases</span>
          </div>

          <div className="library-grid">
            {list.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>

          {!list.length && (
            <div className="empty">
              <h2>No matching challenges found</h2>
              <p>We couldn’t find any case studies matching your criteria. Try searching for broader terms or clearing active filters.</p>
              <button
                type="button"
                className="button primary small"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setType('');
                  setDifficulty('');
                  setIndustry('');
                  setStatus('');
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Reveal({
  challenge: c,
  daily = false,
}: {
  challenge: Challenge;
  daily?: boolean;
}) {
  const { state, start, deleteSession, discardAndStart } = useApp();
  const router = useAppRouter();
  const active = state.sessions.find((s) => s.id === state.activeId && s.phase !== 'complete');
  const [confirmAction, setConfirmAction] = useState<'discard-and-start' | 'delete-only' | null>(null);
  const catStyle = getCategoryStyle(c.category);

  return (
    <div className="page reveal-page">
      <div className="reveal-grid">
        <div className="reveal-main">
          <p className="eyebrow">
            {daily ? `Today’s challenge / ${dateKey()}` : `Challenge / #${number(c.number)}`}
          </p>

          <div className="row reveal-meta-tags">
            <span
              className="badge category-badge"
              style={{
                backgroundColor: catStyle.bg,
                color: catStyle.text,
                borderColor: catStyle.border,
              }}
            >
              {c.category}
            </span>
            <Badge>{c.difficulty}</Badge>
            <span className="mono muted">{c.type}</span>
          </div>

          <h1>{c.title}</h1>
          <p className="mission">{c.mission}</p>

          <div className="reveal-spec">
            <div>
              <span>Research</span>
              <strong className="orange">30:00</strong>
            </div>
            <div>
              <span>Pitch</span>
              <strong>05:00</strong>
            </div>
            <div>
              <span>Complexity</span>
              <strong className="complexity">{c.difficulty}</strong>
            </div>
          </div>

          {active ? (
            <div className="active-session-warning notice">
              <div className="active-session-header">
                <AlertTriangle size={20} className="warning-icon orange" />
                <p>
                  <strong>Unfinished Session in Progress:</strong> You have an active{' '}
                  <span className="active-session-title">{active.challenge.title}</span> challenge.
                  Resume it, or start over fresh with a new session.
                </p>
              </div>

              {confirmAction === null && (
                <div className="active-session-actions">
                  <Link
                    className="button primary active-session-resume-btn"
                    href={`/${active.phase === 'research' ? 'research' : active.phase === 'pitch' ? 'pitch' : 'result'}/${active.id}`}
                  >
                    <ArrowRight size={16} />
                    <span>Resume session</span>
                  </Link>

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
                      <strong>Start over with this challenge?</strong> This will permanently delete your unfinished session for{' '}
                      <strong>{active.challenge.title}</strong> and start 30:00 study on <strong>{c.title}</strong>.
                    </p>
                  </div>
                  <div className="confirm-actions">
                    <button
                      className="button danger-solid"
                      onClick={() => {
                        const newId = discardAndStart(active.id, c);
                        router.push(`/research/${newId}`);
                      }}
                      type="button"
                    >
                      <Trash2 size={15} />
                      <span>Yes, Delete & Start This (30:00)</span>
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
                      <strong>{active.challenge.title}</strong> from this device so you can start or explore freely.
                    </p>
                  </div>
                  <div className="confirm-actions">
                    <button
                      className="button danger-solid"
                      onClick={() => {
                        deleteSession(active.id);
                        setConfirmAction(null);
                      }}
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
            <div className="reveal-actions-row">
              <button
                className="button primary big"
                onClick={() => router.push(`/research/${start(c)}`)}
              >
                <span>Start 30:00</span>
                <ArrowRight size={18} />
              </button>
              <Link className="button" href="/challenge">
                <Shuffle size={16} /> Spin Roulette
              </Link>
            </div>
          )}

          <p className="hint">The timer starts when you do. Notes save automatically on this device.</p>

          <div className="reveal-sources">
            <h3>Research starting points</h3>
            <SourceList challenge={c} />
          </div>
        </div>

        <aside className="objectives panel">
          <p className="eyebrow">Your research brief</p>
          <h2>
            Follow the questions.
            <br />
            Find your own answers.
          </h2>
          <ol>
            {c.researchQuestions.map((q, i) => (
              <li key={i}>
                <span className="mono orange">{String(i + 1).padStart(2, '0')}</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
          <div className="brief-bottom">
            ONE UNFAMILIAR SUBJECT.
            <br />
            NO PREPARATION. REAL LEARNING.
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Generator({ daily = false }: { daily?: boolean }) {
  return <TopicRoulette isDaily={daily} />;
}
