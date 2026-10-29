'use client';

import { useEffect, useState } from 'react';
import { useAppRouter } from '@/hooks/use-location';
import {
  BookOpen,
  CheckCheck,
  FileText,
  Pause,
  Play,
  Smartphone,
  Tv,
  AlertCircle,
  Expand,
  Shrink,
  Film,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { Session, sections } from '@/types';
import { advance, pause, remaining, resetTimer } from '@/lib/engine';
import { Badge, Modal, SourceList, Timer, number } from './ui';
import { getCategoryStyle } from './topic-roulette';

const prompts = [
  'What real-world pain does it eliminate? Who feels the acute pain, and what is the cost of not solving it?',
  'What is the end-user workflow from start to finish? Where does the core value click into place?',
  'What makes it work under the hood? Identify the non-obvious engineering and technical decisions.',
  'Map the high-level architecture: major services, data flow, state management, and critical dependencies.',
  'Who writes the check, what metrics drive pricing, and what does it cost operationally to deliver?',
  'What existing solutions do users compare it against, and where does each approach fail or shine?',
  'What is defensible? What network effect, proprietary data, switching friction, or scale advantage compounds?',
  'Where does the abstraction leak or break? What are the architectural bottlenecks and failure modes?',
  'What counterintuitive insight did you discover? Form your own thesis beyond company marketing.',
  'Synthesize your 5-minute story: Problem → Architecture → Business reality → Verdict.',
];

const checkLabels = [
  'I understand the acute user problem',
  'I understand the product workflow',
  'I understand the core technology',
  'I can sketch the system architecture',
  'I understand unit economics & business model',
  'I know the competitive landscape',
  'I can identify the compound moat',
  'I know the architectural tradeoffs & flaws',
  'I have formulated an independent opinion',
  'I can pitch this clearly in 5 minutes',
];

export function Workspace({ session: s }: { session: Session }) {
  const { state, update, editSession, play, now } = useApp();
  const router = useAppRouter();
  const [tab, setTab] = useState('Problem');
  const [panel, setPanel] = useState('notes');
  const [end, setEnd] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [shortcutModal, setShortcutModal] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [teleprompterSize, setTeleprompterSize] = useState<'normal' | 'large' | 'xl'>('normal');

  const p = state.preferences;
  const pitch = s.phase === 'pitch';
  const left = remaining(s, now);
  const checked = s.checklist.filter(Boolean).length;
  const catStyle = getCategoryStyle(s.challenge.category);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const target = s.phase === 'research' ? 'research' : s.phase === 'pitch' ? 'pitch' : 'result';
    router.replace(`/${target}/${s.id}`);
  }, [s.phase, s.id, router]);

  const setPrefs = (partial: Partial<typeof p>) =>
    update((st) => ({ ...st, preferences: { ...st.preferences, ...partial } }));

  const toggleCinematic = () => {
    setPrefs({ cinematic: !p.cinematic });
    if (!p.cinematic) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable]') || e.metaKey || e.ctrlKey || e.altKey)
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        editSession(s.id, (x) => pause(advance(x)));
      }
      if (e.key.toLowerCase() === 'r' && !e.shiftKey) {
        e.preventDefault();
        setResetModal(true);
      }
      if (e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        toggleCinematic();
      }
      if (e.key.toLowerCase() === 'f' && e.shiftKey) {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShortcutModal((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setPrefs({ cinematic: false, recording: 'off' });
        setShortcutModal(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (s.phase !== 'research' && s.phase !== 'pitch') return null;
  const noteKey = pitch ? 'Pitch Notes' : tab;

  return (
    <div
      className={`workspace ${p.cinematic ? 'cinematic' : ''} ${
        p.recording !== 'off' ? `recording ${p.recording}` : ''
      }`}
    >
      {/* Top Workspace Toolbar */}
      <div className="workspace-toolbar">
        <div className="toolbar-left">
          <span className="mono muted">
            30 MINUTE <span className="orange">/</span> {pitch ? '05:00 PITCH PHASE' : '30:00 RESEARCH PHASE'}
          </span>
        </div>

        <div className="row toolbar-right">
          {/* Fullscreen Toggle */}
          <button
            className={`quiet toolbar-btn ${fullscreen ? 'active' : ''}`}
            onClick={toggleFullscreen}
            title="Toggle full screen window (Hotkey: Shift+F)"
          >
            {fullscreen ? <Shrink size={15} /> : <Expand size={15} />}
            <span>{fullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>

          {/* Cinematic Mode Toggle */}
          <button
            className={`quiet toolbar-btn ${p.cinematic ? 'active' : ''}`}
            onClick={toggleCinematic}
            title="Toggle distraction-free cinematic mode (Hotkey: F)"
          >
            <Film size={15} />
            <span>Cinematic</span>
          </button>

          {/* Recording Mode Controls (16:9 & 9:16) */}
          <div className="recording-toggle-group">
            <button
              className={`quiet toggle-item ${p.recording === 'off' ? 'active' : ''}`}
              onClick={() => setPrefs({ recording: 'off' })}
              title="Standard workspace view"
            >
              Standard
            </button>
            <button
              className={`quiet toggle-item ${p.recording === 'wide' ? 'active' : ''}`}
              onClick={() => setPrefs({ recording: 'wide' })}
              title="16:9 Mode (YouTube recording layout)"
            >
              <Tv size={14} />
              <span>16:9</span>
            </button>
            <button
              className={`quiet toggle-item ${p.recording === 'vertical' ? 'active' : ''}`}
              onClick={() => setPrefs({ recording: 'vertical' })}
              title="9:16 Mode (Instagram Reels & Shorts layout)"
            >
              <Smartphone size={14} />
              <span>9:16</span>
            </button>
          </div>

          {/* Pause / Resume Button */}
          <button
            className="quiet toolbar-btn"
            onClick={() => editSession(s.id, (x) => pause(advance(x)))}
            title="Pause timer (Marks attempt as practice)"
          >
            {s.pausedAt ? <Play size={16} /> : <Pause size={16} />}
            <span>{s.pausedAt ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            className="quiet toolbar-btn"
            onClick={() => setShortcutModal(true)}
            aria-label="Keyboard shortcuts legend"
            title="Keyboard shortcuts legend (Hotkey: ?)"
          >
            <HelpCircle size={15} />
            <span>Shortcuts</span>
          </button>

          {/* Reset Timer Button */}
          <button
            className="quiet toolbar-btn"
            onClick={() => setResetModal(true)}
            title={pitch ? 'Reset 5-minute pitch timer to 05:00' : 'Reset research timer to 30:00'}
          >
            <RotateCcw size={15} />
            <span>Reset timer</span>
          </button>

          {/* End Phase Button */}
          <button className="button small danger" onClick={() => setEnd(true)}>
            {pitch ? 'Finish pitch' : 'End research'}
          </button>
        </div>
      </div>

      {/* Main Workspace Heading / Timer Banner */}
      <div className="workspace-heading">
        <div className="heading-copy">
          <p className="eyebrow">
            {pitch ? (
              <span className="orange">PHASE 2: PITCH ON CAMERA</span>
            ) : (
              `CHALLENGE #${number(s.challenge.number)}`
            )}
            <span className="test-number mono">TEST / #{number(s.number)}</span>
          </p>

          <h1>{pitch ? s.challenge.title : s.challenge.title}</h1>

          <div className="row meta-row">
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

          {!pitch && <p className="workspace-description">{s.challenge.description}</p>}
        </div>

        <Timer
          session={s}
          large={pitch || p.cinematic || p.recording !== 'off'}
          onReset={() => setResetModal(true)}
        />
      </div>

      {/* Pitch Announcement Banner */}
      {pitch && (
        <div className="pitch-announcement-banner">
          <div className="pitch-announcement-header">
            <div>
              <span className="mono orange">RESEARCH COMPLETE</span>
              <h2>YOUR 5 MINUTE PITCH STARTS NOW.</h2>
              <p>Deliver your explanation cleanly. Use the 7 beats below as your mental map.</p>
            </div>
            <button
              type="button"
              className="button quiet small pitch-reset-btn"
              onClick={() => setResetModal(true)}
              title="Reset 5-minute pitch countdown back to 05:00"
            >
              <RotateCcw size={14} />
              <span>Reset 05:00 timer</span>
            </button>
          </div>
        </div>
      )}

      {/* Critical Countdown Alert */}
      {left <= 60 && (
        <p className="time-warning" role="status">
          <AlertCircle size={16} />
          <span>
            {left <= 30 ? '30 SECONDS REMAINING.' : 'FINAL MINUTE.'}{' '}
            {pitch ? 'Deliver your key insight and conclude.' : 'Wrap up notes and prepare for the 5-minute pitch.'}
          </span>
        </p>
      )}

      {s.pausedAt && (
        <p className="notice" role="status">
          Timer paused. Resuming will add paused time to your countdown; this attempt will be flagged as practice.
        </p>
      )}

      {/* Recording Mode Broadcast Card (Visible when recording mode is active) */}
      <div className="recording-essentials">
        <div className="row between record-notes-header">
          <span className="mono orange">
            {pitch ? '05:00 PITCH TALKING POINTS' : 'LIVE MENTAL MODEL & NOTES'}
          </span>
          <span className="mono muted">
            {pitch ? '01 Problem · 02 Solution · 03 Tech · 04 Business · 05 Verdict' : tab}
          </span>
        </div>
        <div className={`record-notes teleprompter-${teleprompterSize}`}>
          {s.notes[pitch ? 'Pitch Notes' : tab] ||
            s.notes['Pitch Notes'] ||
            s.notes['Problem'] ||
            'Formulate your mental model and talking points…'}
        </div>
      </div>

      {/* Interactive Work Area */}
      <div className={`work-grid ${pitch ? 'pitch-grid' : ''}`}>
        {!pitch && (
          <aside className="work-nav">
            <div className="work-switch">
              <button
                className={panel === 'notes' ? 'active' : ''}
                onClick={() => setPanel('notes')}
              >
                <FileText size={16} /> Research
              </button>
              <button
                className={panel === 'sources' ? 'active' : ''}
                onClick={() => setPanel('sources')}
              >
                <BookOpen size={16} /> Sources
              </button>
              <button
                className={panel === 'checklist' ? 'active' : ''}
                onClick={() => setPanel('checklist')}
              >
                <CheckCheck size={16} /> Checklist
              </button>
            </div>

            <nav aria-label="Research sections">
              {sections.map((sec, i) => (
                <button
                  key={sec}
                  className={tab === sec && panel === 'notes' ? 'active' : ''}
                  onClick={() => {
                    setTab(sec);
                    setPanel('notes');
                  }}
                >
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                  {sec}
                  {s.notes[sec] && <i className="note-dot" />}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <section className="editor-panel">
          {pitch ? (
            <div className="pitch-objectives">
              <div className="row between pitch-objectives-header">
                <p className="eyebrow" style={{ marginBottom: 0 }}>THE 7 PITCH BEATS</p>
                <span className="mono pitch-timing-legend">5:00 PACING GUIDE</span>
              </div>
              {[
                ['01', 'Problem', '00:00–00:40', '40s', 'Who suffers, what is broken, and why does this exist?'],
                ['02', 'Solution', '00:40–01:15', '35s', 'What does the product actually do in simple terms?'],
                ['03', 'How It Works', '01:15–02:00', '45s', 'The user workflow and the underlying mechanics.'],
                ['04', 'Technology & Architecture', '02:00–03:00', '60s', 'Key technical decisions, data flow, and trade-offs.'],
                ['05', 'Business Model', '03:00–03:45', '45s', 'Who pays, pricing model, and cost to deliver.'],
                ['06', 'Competition & Moat', '03:45–04:20', '35s', 'What alternatives exist and why is this hard to clone?'],
                ['07', 'Your Verdict & Insight', '04:20–05:00', '40s', 'The single non-obvious takeaway that matters.'],
              ].map(([idx, title, timeRange, duration, desc]) => (
                <div key={title} className="beat-card">
                  <span className="mono orange beat-idx">{idx}</span>
                  <div className="beat-body">
                    <div className="row between beat-top">
                      <strong>{title}</strong>
                      <span className="beat-timing-tag mono" title={`Target duration: ${duration}`}>
                        {timeRange}
                      </span>
                    </div>
                    <p className="beat-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : panel === 'sources' ? (
            <>
              <h2>Verified Starting Sources</h2>
              <SourceList challenge={s.challenge} />
              <h3 className="section-subhead">Research Questions</h3>
              <ul className="question-list">
                {s.challenge.researchQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </>
          ) : panel === 'checklist' ? (
            <Checklist session={s} />
          ) : (
            <>
              <div className="row between editor-header">
                <h2>{tab}</h2>
                <span className="saved">
                  <i /> Autosaved locally
                </span>
              </div>
              <p className="editor-prompt">
                {prompts[sections.indexOf(tab as (typeof sections)[number])]}
              </p>
              <label className="sr-only" htmlFor="research-note">
                {tab} notes
              </label>
              <textarea
                id="research-note"
                className="research-textarea"
                value={s.notes[tab] || ''}
                placeholder="Start with raw facts. Connect the dots. Write your mental model…"
                onChange={(e) =>
                  editSession(s.id, (x) => ({
                    ...x,
                    notes: { ...x.notes, [tab]: e.target.value },
                  }))
                }
              />
              <div className="editor-footer">
                <span>
                  {(s.notes[tab] || '').trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <span>Real understanding. Your own notes.</span>
              </div>
            </>
          )}
        </section>

        <aside className="research-side">
          {pitch ? (
            <>
              <div className="row between">
                <h3>Pitch Talking Points</h3>
                <div className="teleprompter-size-controls" role="group" aria-label="Teleprompter font size">
                  {(['normal', 'large', 'xl'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      className={`teleprompter-btn ${teleprompterSize === sz ? 'active' : ''}`}
                      onClick={() => setTeleprompterSize(sz)}
                      title={`Scale teleprompter font: ${sz}`}
                    >
                      {sz === 'normal' ? '1x' : sz === 'large' ? '1.5x' : '2x'}
                    </button>
                  ))}
                </div>
                <span className="saved">
                  <i /> Autosaved
                </span>
              </div>
              <label className="sr-only" htmlFor="pitch-note">
                Pitch notes
              </label>
              <textarea
                id="pitch-note"
                className={`pitch-textarea teleprompter-${teleprompterSize}`}
                value={s.notes[noteKey] || ''}
                placeholder="Draft your bullet points for the 5-minute pitch…"
                onChange={(e) =>
                  editSession(s.id, (x) => ({
                    ...x,
                    notes: { ...x.notes, [noteKey]: e.target.value },
                  }))
                }
              />
              <details className="notes-review-drawer">
                <summary>Review your 30-min research notes</summary>
                {sections
                  .filter((sec) => sec !== 'Pitch Notes' && s.notes[sec])
                  .map((sec) => (
                    <div className="read-note" key={sec}>
                      <h4>{sec}</h4>
                      <p>{s.notes[sec]}</p>
                    </div>
                  ))}
              </details>
            </>
          ) : (
            <>
              <Checklist session={s} />
              <div className="side-source">
                <h3>Starting Sources</h3>
                <SourceList challenge={s.challenge} />
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Workspace Footer Bar */}
      <div className="workspace-bottom">
        <span className="mono">
          {pitch ? '05' : '30'} MINUTE / {pitch ? 'PITCH' : 'RESEARCH'} RUN
        </span>
        <span className="mono muted shortcuts-help">
          <kbd>Shift+F</kbd> full screen · <kbd>F</kbd> cinematic · <kbd>Space</kbd> pause · <kbd>R</kbd> reset timer · <kbd>M</kbd> sound · <kbd>Esc</kbd> exit
        </span>
        <span className="mono">{checked}/10 questions understood</span>
      </div>

      {/* Confirmation Modal */}
      {end && (
        <Modal
          title={pitch ? 'Finish your 5-minute pitch early?' : 'End research and begin your 5-minute pitch?'}
          onClose={() => setEnd(false)}
        >
          <p>
            {pitch
              ? 'Your actual pitch duration will be recorded, and you will move immediately to self-assessment and scorecard generation.'
              : 'Your 30-minute research window will close immediately, and your 5-minute pitch timer will start. Your research notes remain available to reference.'}
          </p>
          <div className="actions modal-actions">
            <button className="button" onClick={() => setEnd(false)}>
              Keep Going
            </button>
            <button
              className="button primary"
              onClick={() => {
                editSession(s.id, (x) => advance(x, Date.now(), true));
                play(pitch ? 'pitch-complete' : 'transition');
                setEnd(false);
              }}
            >
              {pitch ? 'Finish and Score' : 'Start 05:00 Pitch'}
            </button>
          </div>
        </Modal>
      )}

      {/* Reset Timer Confirmation Modal */}
      {resetModal && (
        <Modal
          title={pitch ? 'Reset 5-minute pitch timer?' : 'Reset 30-minute research timer?'}
          onClose={() => setResetModal(false)}
        >
          <p>
            {pitch
              ? 'Missed the start or need to fix camera/audio? You can reset the countdown back to 05:00 to start fresh. This attempt will be flagged as practice.'
              : 'This will reset your research countdown back to 30:00. This attempt will be flagged as practice.'}
          </p>
          <div className="actions modal-actions">
            <button className="button" type="button" onClick={() => setResetModal(false)}>
              Keep Going
            </button>
            <button
              className="button"
              type="button"
              onClick={() => {
                editSession(s.id, (x) => resetTimer(x, Date.now(), true));
                play('click');
                setResetModal(false);
              }}
            >
              Reset & Pause
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => {
                editSession(s.id, (x) => resetTimer(x, Date.now(), false));
                play('start');
                setResetModal(false);
              }}
            >
              {pitch ? 'Reset & Start 05:00' : 'Reset & Start 30:00'}
            </button>
          </div>
        </Modal>
      )}

      {/* Keyboard Shortcuts Legend Modal */}
      {shortcutModal && (
        <Modal title="Keyboard Shortcuts Legend" onClose={() => setShortcutModal(false)}>
          <div className="shortcuts-legend-list">
            {[
              ['Space', 'Pause or resume session countdown (marks attempt as practice)'],
              ['R', 'Reset timer back to 30:00 (Research) or 05:00 (Pitch)'],
              ['F', 'Toggle distraction-free cinematic mode'],
              ['Shift + F', 'Toggle native fullscreen browser window'],
              ['M', 'Mute or unmute procedural Web Audio sound cues'],
              ['N', 'Draw a new topic challenge from library'],
              ['?', 'Toggle this keyboard shortcuts legend modal'],
              ['Escape', 'Exit cinematic / recording modes or dismiss dialogs'],
            ].map(([key, desc]) => (
              <div key={key} className="shortcut-legend-row">
                <kbd className="mono">{key}</kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
          <div className="actions modal-actions" style={{ marginTop: 20 }}>
            <button className="button primary" type="button" onClick={() => setShortcutModal(false)}>
              Got it
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Checklist({ session: s }: { session: Session }) {
  const { editSession, play } = useApp();
  const n = s.checklist.filter(Boolean).length;

  return (
    <div className="checklist">
      <div className="row between">
        <h3>Research Checklist</h3>
        <span className="mono orange">{n}/10</span>
      </div>
      <progress value={n} max={10} aria-label="Research checklist completion" />
      {checkLabels.map((label, i) => (
        <label key={label}>
          <input
            type="checkbox"
            checked={s.checklist[i]}
            onChange={(e) => {
              editSession(s.id, (x) => ({
                ...x,
                checklist: x.checklist.map((v, j) => (j === i ? e.target.checked : v)),
              }));
              if (e.target.checked) play('check');
            }}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
