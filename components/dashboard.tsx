'use client';

import Link from 'next/link';
import { Trash2, Sparkles, TrendingUp, Calendar, Layers, Award } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { statistics, score, formatTime, dateKey } from '@/lib/engine';
import { Empty, Badge, number, SectionTitle } from './ui';

export function History() {
  const { state, deleteSession } = useApp();
  const complete = state.sessions.filter((s) => s.phase === 'complete');
  const unfinished = state.sessions.filter((s) => s.phase !== 'complete');

  return (
    <div className="page history-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Your learning record</p>
          <h1>Fieldwork, documented.</h1>
          <p>Every session, every insight. Saved locally on this device.</p>
        </div>
      </div>

      {unfinished.length > 0 && (
        <section className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h2>Continue an active session</h2>
          {unfinished.map((s) => (
            <div className="history-row unfinished-history-row" key={s.id}>
              <Link
                className="unfinished-history-link"
                href={`/${s.phase === 'research' ? 'research' : s.phase === 'pitch' ? 'pitch' : 'result'}/${s.id}`}
              >
                <span className="mono">#{number(s.number)}</span>
                <strong>{s.challenge.title}</strong>
                <span className="phase-pill mono">{s.phase}</span>
                <span className="orange">Resume &rarr;</span>
              </Link>
              <button
                className="icon-button"
                aria-label={`Delete unfinished session ${s.challenge.title}`}
                title="Delete unfinished session"
                onClick={() => {
                  if (window.confirm(`Delete unfinished session "${s.challenge.title}"?`)) {
                    deleteSession(s.id);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </section>
      )}

      {complete.length ? (
        <div className="history-list">
          {complete.map((s) => (
            <Link href={`/result/${s.id}`} key={s.id} className="history-item">
              <div>
                <span className="mono muted">
                  TEST #{number(s.number)} · {new Date(s.completedAt!).toLocaleDateString()}
                </span>
                <h2>{s.challenge.title}</h2>
                <div className="row" style={{ gap: 8, margin: '6px 0' }}>
                  <Badge>{s.challenge.difficulty}</Badge>
                  <span className="muted">
                    {s.challenge.category}
                    {s.practice ? ' · Practice' : ''}
                  </span>
                </div>
                <p>{s.reflections[3] || 'No summary takeaway recorded.'}</p>
              </div>
              <div className="history-numbers">
                <strong className="orange">
                  {score(s).toFixed(1)}
                  <small>/10</small>
                </strong>
                <span className="mono">{formatTime(s.researchSeconds)} research</span>
                <span className="mono">{formatTime(s.pitchSeconds)} pitch</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title="Your first insight is still ahead.">
          Complete a challenge to build your research history and track your compounding knowledge.
        </Empty>
      )}
    </div>
  );
}

export function Dashboard() {
  const { state } = useApp();
  const stats = statistics(state.sessions);
  const categories = [...new Set(state.challenges.map((c) => c.category))];
  const difficulty = ['Easy', 'Medium', 'Hard', 'Insane'];
  const totalCompleted = stats.complete.length;

  const days = Array.from({ length: 56 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (55 - i));
    return dateKey(d);
  });

  return (
    <div className="page dashboard">
      <div className="page-title">
        <div>
          <p className="eyebrow">A little wider. A little clearer.</p>
          <h1>Your learning dashboard.</h1>
          <p>Progress measured in genuine understanding and technical breadth.</p>
        </div>
        <Link className="button primary" href="/challenge">
          Start challenge
        </Link>
      </div>

      <div className="dashboard-stats">
        {[
          [stats.complete.length, 'Challenges completed'],
          [stats.streak, 'Current streak (days)'],
          [stats.longest, 'Longest streak (days)'],
          [totalCompleted ? `${stats.averageScore.toFixed(1)}/10` : '—', 'Average score'],
          [totalCompleted ? formatTime(stats.averageResearch) : '—', 'Avg. research time'],
          [totalCompleted ? `${stats.averagePitch.toFixed(1)}/10` : '—', 'Avg. pitch score'],
          [`${stats.categories}/${categories.length}`, 'Categories explored'],
        ].map(([v, l]) => (
          <div className="stat" key={l}>
            <span>{l}</span>
            <strong className="mono">{v}</strong>
          </div>
        ))}
      </div>

      {/* 8-Week Activity Calendar */}
      <section className="panel activity">
        <div className="row between activity-header">
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <Calendar size={18} className="orange" />
            <h2>Show up. Stay curious.</h2>
          </div>
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            <span className="mono orange">
              {stats.complete.filter((s) => days.includes(dateKey(s.completedAt!))).length} completed in window
            </span>
            <span className="mono muted">Last 8 weeks</span>
          </div>
        </div>

        <div className="activity-timeline-axis mono">
          <span>8 WEEKS AGO</span>
          <span>4 WEEKS AGO</span>
          <span>THIS WEEK</span>
        </div>

        <div className="activity-grid">
          {days.map((d) => {
            const count = stats.complete.filter((s) => dateKey(s.completedAt!) === d).length;
            const levelClass = count > 1 ? 'high-activity done' : count === 1 ? 'done' : '';
            return (
              <div
                key={d}
                className={levelClass}
                title={`${d}: ${count} challenge${count === 1 ? '' : 's'} completed`}
                aria-label={`${d}: ${count} challenge${count === 1 ? '' : 's'}`}
              />
            );
          })}
        </div>

        <div className="activity-footer">
          <p className="hint">Each square represents one day. Consistency compounds technical intuition.</p>
          <div className="activity-scale-legend mono" aria-label="Activity legend">
            <span className="muted">Less</span>
            <span className="scale-box" title="0 challenges" />
            <span className="scale-box done" title="1 challenge" />
            <span className="scale-box high" title="2+ challenges" />
            <span className="muted">More</span>
          </div>
        </div>
      </section>

      {/* Charts & Breakdown */}
      <div className="dashboard-charts">
        <section className="panel">
          <div className="row" style={{ gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <Layers size={18} className="orange" />
            <h2>Across the field</h2>
          </div>
          {categories.map((cat) => {
            const n = stats.complete.filter((s) => s.challenge.category === cat).length;
            const pct = totalCompleted > 0 ? Math.round((n / totalCompleted) * 100) : 0;
            return (
              <div className="chart-row" key={cat}>
                <span>{cat}</span>
                <progress value={n} max={Math.max(1, totalCompleted)} />
                <strong className="mono">
                  {n} {totalCompleted > 0 && <small className="muted">({pct}%)</small>}
                </strong>
              </div>
            );
          })}
        </section>

        <section className="panel">
          <div className="row" style={{ gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <Award size={18} className="orange" />
            <h2>The difficulty mix</h2>
          </div>
          {difficulty.map((d) => {
            const n = stats.complete.filter((s) => s.challenge.difficulty === d).length;
            const pct = totalCompleted > 0 ? Math.round((n / totalCompleted) * 100) : 0;
            return (
              <div className="chart-row" key={d}>
                <span>{d}</span>
                <progress value={n} max={Math.max(1, totalCompleted)} />
                <strong className="mono">
                  {n} {totalCompleted > 0 && <small className="muted">({pct}%)</small>}
                </strong>
              </div>
            );
          })}

          <div className="dashboard-insight">
            <span className="orange mono">{totalCompleted ? `${Math.round(stats.averageScore * 10)}%` : '35:00'}</span>
            <p>
              {totalCompleted
                ? 'Your average self-assessed understanding. The honest gaps are your next research directions.'
                : 'One focused session is all it takes to start. Your statistics and domain mix will appear here as you complete challenges.'}
            </p>
          </div>
        </section>
      </div>

      {/* Recent Challenges Section */}
      <section className="section" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <SectionTitle title="Recent challenges">
          <Link className="text-link" href="/history">
            All history ({totalCompleted})
          </Link>
        </SectionTitle>
        {totalCompleted ? (
          stats.complete.slice(0, 5).map((s) => (
            <Link className="history-row" key={s.id} href={`/result/${s.id}`}>
              <span className="mono muted">#{number(s.number)}</span>
              <strong>{s.challenge.title}</strong>
              <span className="mono muted">{new Date(s.completedAt!).toLocaleDateString()}</span>
              <span className="orange mono">{score(s).toFixed(1)}/10</span>
            </Link>
          ))
        ) : (
          <p className="muted">No completed challenges yet. Start with something you’ve always wanted to understand.</p>
        )}
      </section>
    </div>
  );
}
