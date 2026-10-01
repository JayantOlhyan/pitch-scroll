'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Focus, Shuffle, Radio } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { statistics } from '@/lib/engine';
import { ChallengeCard, SectionTitle, number } from './ui';
import { getCategoryStyle } from './topic-roulette';

export function Home() {
  const { state } = useApp();
  const stats = statistics(state.sessions);
  const featured = state.challenges.filter((c) => c.featured).slice(0, 4);

  // Rotating preview topic candidates
  const sampleTopics = state.challenges.filter((c) =>
    ['Perplexity', 'Docker', 'Zerodha', 'Netflix architecture', 'Rust', 'Cloudflare', 'Groq', 'Stripe'].includes(c.title)
  );
  const previewList = sampleTopics.length > 0 ? sampleTopics : state.challenges.slice(0, 6);

  const [previewIdx, setPreviewIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (previewList.length <= 1) return;
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setPreviewIdx((prev) => (prev + 1) % previewList.length);
        setFading(false);
      }, 350);
    }, 4200);
    return () => clearInterval(interval);
  }, [previewList.length]);

  const activePreview = previewList[previewIdx] || state.challenges[0];
  const catStyle = activePreview ? getCategoryStyle(activePreview.category) : getCategoryStyle('AI');

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-pulse" />
            <span>A TECH LEARNING & CONTENT CREATION SERIES</span>
          </p>

          <h1>
            <span className="orange">30 MINUTES</span>
            <br />
            TO UNDERSTAND IT.
            <br />
            <span className="outline-text">5 MINUTES</span>
            <br />
            TO PITCH IT.
          </h1>

          <p className="hero-description">
            One unfamiliar subject. A running clock.
            <br />
            Research under pressure. Then explain what you learned on camera before the time runs out.
          </p>

          <div className="actions hero-actions">
            <Link href="/challenge" className="button primary big">
              <Shuffle size={18} />
              <span>START CHALLENGE</span>
            </Link>
            <Link href="/challenges" className="button big">
              <span>BROWSE CASE STUDIES</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="hero-footnote mono">
            <span>NO PREPARATION.</span>
            <span className="dot-sep">·</span>
            <span>NO GENERATED ANSWERS.</span>
            <span className="dot-sep">·</span>
            <span>REAL LEARNING.</span>
          </div>
        </div>

        {/* Live Topic Preview & Instrument Card */}
        <div className="hero-instrument">
          <div className="instrument-top">
            <div className="row">
              <span className="live-badge mono">
                <i className="live-dot" /> LIVE PREVIEW
              </span>
              <span className="mono muted">TODAY’S SELECTION</span>
            </div>
            <Focus size={18} className="muted" />
          </div>

          <div className="instrument-body">
            {/* Live Rotating Challenge Card */}
            <div className={`live-preview-card ${fading ? 'fade-out' : 'fade-in'}`}>
              <div className="row between live-card-meta">
                <span className="mono muted">CASE #{number(activePreview.number)}</span>
                <span
                  className="badge category-badge"
                  style={{
                    backgroundColor: catStyle.bg,
                    color: catStyle.text,
                    borderColor: catStyle.border,
                  }}
                >
                  {activePreview.category}
                </span>
                <span className="badge difficulty-badge">{activePreview.difficulty}</span>
              </div>

              <div className="live-topic-name">
                <h3 title={activePreview.title}>[ {activePreview.title} ]</h3>
              </div>

              <p className="live-topic-desc">{activePreview.description}</p>
            </div>

            <div className="time-ruler">
              {Array.from({ length: 31 }, (_, i) => (
                <i key={i} className={i % 5 === 0 ? 'major' : ''} />
              ))}
            </div>

            <div className="hero-timer">
              30<span>:</span>00
            </div>

            <div className="instrument-status">
              <span>
                <i className="orange-dot" /> READY WHEN YOU ARE
              </span>
              <span>1800 SECONDS RESEARCH + 300 SECONDS PITCH</span>
            </div>

            <div className="instrument-rule" />

            <div className="phase-legend">
              <div>
                <span className="phase-index mono">01</span>
                <strong>Find the signal.</strong>
                <p>30 minutes. Build a clear mental model from raw primary sources.</p>
              </div>
              <div>
                <span className="phase-index mono">02</span>
                <strong>Make it make sense.</strong>
                <p>5 minutes. Explain it simply without buzzwords on video.</p>
              </div>
            </div>

            {/* Quick launch directly into roulette */}
            <Link href="/challenge" className="hero-roulette-cta">
              <span>Launch Topic Roulette</span>
              <Shuffle size={14} />
            </Link>
          </div>

          <div className="instrument-bottom">
            <span className="mono">ONE SUBJECT. ZERO PREPARATION.</span>
            <span className="instrument-cross">+</span>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="stats-strip">
        {[
          [state.challenges.length, 'Challenges in library'],
          [stats.complete.length, 'Challenges completed'],
          [stats.streak, 'Day learning streak'],
          [stats.complete.length ? `${stats.averageScore.toFixed(1)}/10` : '—', 'Average self score'],
        ].map(([v, l]) => (
          <div key={l}>
            <strong>{v}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>

      {/* Process Section - How It Works */}
      <section className="section process-section">
        <SectionTitle label="THE 30 MINUTE FORMAT" title="How the Challenge Works" />
        <div className="process-grid">
          {[
            ['01', 'GET THE CHALLENGE', 'Spin the topic roulette. Unseen subjects take priority.'],
            ['02', 'RESEARCH 30 MINUTES', 'Follow raw sources. Read docs. Build your architectural model.'],
            ['03', 'CLOCK HITS ZERO', 'Close all tabs. Research immediately stops.'],
            ['04', 'PITCH 5 MINUTES', 'Turn on the camera. Deliver a concise explanation in your own words.'],
            ['05', 'REFLECT & SCORE', 'Grade your technical clarity, identify gaps, and publish your takeaway.'],
          ].map(([n, t, d]) => (
            <div key={n} className="process-step-card">
              <span className="process-number mono">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Challenges */}
      <section className="section">
        <SectionTitle label="CHOOSE YOUR NEXT RABBIT HOLE" title="Featured Challenges">
          <Link className="text-link" href="/challenges">
            View full library ({state.challenges.length}) <ArrowUpRight size={16} />
          </Link>
        </SectionTitle>
        <div className="card-grid">
          {featured.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      </section>

      {/* Category Explorer */}
      <section className="section">
        <SectionTitle label="EXPLORE THE FIELD" title="Curiosity Has No Department." />
        <div className="category-grid">
          {[...new Set(state.challenges.map((c) => c.category))].map((cat, i) => {
            const catS = getCategoryStyle(cat);
            return (
              <Link key={cat} href={`/challenges?category=${encodeURIComponent(cat)}`} className="cat-card-link">
                <span className="mono muted">{number(i + 1)}</span>
                <strong style={{ color: catS.text }}>{cat}</strong>
                <span className="mono cat-count">{state.challenges.filter((c) => c.category === cat).length}</span>
                <ArrowUpRight size={16} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Fieldwork */}
      {stats.complete.length > 0 && (
        <section className="section">
          <SectionTitle title="Your Recent Fieldwork">
            <Link href="/history" className="text-link">
              View history ({stats.complete.length})
            </Link>
          </SectionTitle>
          <div className="history-rows-box">
            {stats.complete.slice(0, 3).map((s) => (
              <Link className="history-row" key={s.id} href={`/result/${s.id}`}>
                <span className="mono muted">#{number(s.number)}</span>
                <strong>{s.challenge.title}</strong>
                <span className="cat-tag mono">{s.challenge.category}</span>
                <span className="orange mono score-tag">
                  {(s.scores.reduce((a, b) => a + b, 0) / 8).toFixed(1)}/10
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="closing">
        <div>
          <p className="eyebrow">BUILT FOR CURIOUS CREATORS</p>
          <h2>
            The challenge is simple.
            <br />
            The understanding is earned.
          </h2>
          <p>
            Train technical breadth, research speed, and the ability to explain complicated systems clearly. Film the
            process, embrace the pressure, and share what you actually learned.
          </p>
          <Link href="/about" className="text-link">
            About the series philosophy <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="closing-cta">
          <Radio size={28} className="orange" />
          <h3>
            Your next episode
            <br />
            starts here.
          </h3>
          <Link className="button primary big" href="/challenge">
            <Shuffle size={18} />
            <span>START CHALLENGE</span>
          </Link>
        </div>
      </section>
    </>
  );
}
