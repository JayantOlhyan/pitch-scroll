import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advance,
  createSession,
  remaining,
  choose,
  dailyChallenge,
  statistics,
  score,
  statusFor,
  RESEARCH_MS,
  PITCH_MS,
} from '../lib/engine';
import { challenges } from '../data/challenges';
import {
  initialState,
  stateSchema,
  sessionSchema,
} from '../lib/storage';
import { decodeShare, shareToken, contentAssets } from '../lib/sharing';
import { sections, scoreLabels, reflectionLabels } from '../types';

test('complete user journey test: roulette selection -> 30:00 research -> 05:00 pitch -> assessment -> result card', () => {
  const state = initialState();
  assert.equal(state.sessions.length, 0);

  // 1. Topic Roulette selection
  const pool = state.challenges;
  const picked = choose(pool, state.seen, state.sessions);
  assert.ok(picked, 'Should pick a challenge');

  // 2. Start 30:00 research session
  const now = 1700000000000;
  const session = createSession(picked, 1, now);
  assert.equal(session.phase, 'research');
  assert.equal(session.startedAt, now);
  assert.equal(session.endTime, now + RESEARCH_MS);
  assert.equal(remaining(session, now), 1800);

  // 3. User takes research notes in workspace across sections
  session.notes['Problem'] = 'Solves distributed state synchronization across client nodes.';
  session.notes['Technology'] = 'Uses hybrid logical clocks and log-structured merge trees.';
  session.notes['Pitch Notes'] = 'Key takeaway: high write throughput at the cost of eventual read convergence.';
  assert.equal(session.notes['Problem'].length > 0, true);

  // 4. Checklist interaction
  session.checklist[0] = true; // problem understood
  session.checklist[1] = true; // product understood
  session.checklist[2] = true; // tech understood
  assert.equal(session.checklist.filter(Boolean).length, 3);

  // 5. Timer persistence across refresh
  const serialized = JSON.stringify(session);
  const deserialized = sessionSchema.parse(JSON.parse(serialized));
  // 5 minutes later
  const fiveMinLater = now + 300000;
  assert.equal(remaining(deserialized, fiveMinLater), 1500);

  // 6. 30 minutes expire -> automatically advance to 05:00 pitch phase
  const researchDeadline = now + RESEARCH_MS;
  const pitchSession = advance(deserialized, researchDeadline);
  assert.equal(pitchSession.phase, 'pitch');
  assert.equal(pitchSession.researchSeconds, 1800);
  assert.equal(remaining(pitchSession, researchDeadline), 300);
  assert.equal(pitchSession.endTime, researchDeadline + PITCH_MS);

  // 7. Pitch notes added during pitch phase
  pitchSession.notes['Pitch Notes'] += ' Highlight the contrast between synchronous consensus and CRDTs.';

  // 8. 5 minutes expire -> advance to assessment
  const pitchDeadline = researchDeadline + PITCH_MS;
  const assessmentSession = advance(pitchSession, pitchDeadline);
  assert.equal(assessmentSession.phase, 'assessment');
  assert.equal(assessmentSession.pitchSeconds, 300);

  // 9. Score evaluation & reflection
  assessmentSession.scores = [9, 8, 9, 8, 7, 9, 8, 9];
  assessmentSession.reflections = [
    'I learned how log replication handles network partitions.',
    'I underestimated the network overhead of quorum reads.',
    'I would research the compaction algorithms next.',
    'Distributed systems trade simplicity for resilience, and that trade is non-negotiable.',
  ];

  // 10. Complete session & scorecard generation
  const completedSession = {
    ...assessmentSession,
    phase: 'complete' as const,
    completedAt: pitchDeadline + 15000,
  };
  assert.equal(completedSession.phase, 'complete');
  assert.equal(score(completedSession), 8.375);

  // 11. Content creator assets generation
  const assets = contentAssets(completedSession);
  assert.equal(assets.length, 6);
  assert.ok(assets.some(([label]) => label === 'YouTube title'));
  assert.ok(assets.some(([label]) => label === 'Instagram Reel hook'));
  assert.ok(assets.some(([label]) => label === 'LinkedIn post angle'));

  // 12. Share token round trip
  const token = shareToken(completedSession);
  const decoded = decodeShare(token);
  assert.equal(decoded.phase, 'complete');
  assert.equal(decoded.challenge.title, picked.title);
  assert.equal(decoded.reflections[3], completedSession.reflections[3]);
  assert.deepEqual(decoded.notes, {}); // notes are private

  // 13. State update & dashboard stats
  state.sessions.push(completedSession);
  state.seen.push(picked.id);
  const stats = statistics(state.sessions);
  assert.equal(stats.complete.length, 1);
  assert.equal(stats.averageScore, 8.375);
  assert.equal(stats.averageResearch, 1800);
  assert.equal(statusFor(picked, state), 'Completed');

  // Verify full state serialization schema
  assert.doesNotThrow(() => stateSchema.parse(state));
});

test('daily challenge deterministic consistency across dates', () => {
  const c1 = dailyChallenge(challenges, '2026-10-01');
  const c2 = dailyChallenge(challenges, '2026-10-01');
  const c3 = dailyChallenge(challenges, '2026-10-02');
  assert.equal(c1.id, c2.id);
  assert.equal(c1.title, c2.title);
  assert.notEqual(c1.id, c3.id);
});

test('all 10 research sections and 8 score dimensions match specification', () => {
  assert.equal(sections.length, 10);
  assert.equal(scoreLabels.length, 8);
  assert.equal(reflectionLabels.length, 4);
});

test('discard active unfinished session and start over with a new challenge', () => {
  const state = initialState();
  const c1 = state.challenges[0];
  const c2 = state.challenges[1];

  // 1. User starts session for c1
  const session1 = createSession(c1, 1, 1000);
  state.sessions.push(session1);
  state.activeId = session1.id;
  state.seen.push(c1.id);

  assert.equal(state.sessions.length, 1);
  assert.equal(state.activeId, session1.id);

  // 2. User lands on c2 in roulette and chooses "Start Over & Delete Previous"
  // Simulating discardAndStart:
  const filtered = state.sessions.filter((s) => s.id !== session1.id);
  const session2 = createSession(c2, Math.max(0, ...filtered.map((s) => s.number)) + 1, 2000);
  state.sessions = [session2, ...filtered];
  state.activeId = session2.id;
  state.seen = [...state.seen.filter((id) => id !== c2.id), c2.id];

  // Verify previous session is completely deleted and session2 is now active
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].id, session2.id);
  assert.equal(state.sessions[0].challenge.id, c2.id);
  assert.equal(state.activeId, session2.id);
  assert.equal(state.sessions.some((s) => s.id === session1.id), false);

  // Verify schema validation
  assert.doesNotThrow(() => stateSchema.parse(state));
});

test('delete unfinished session removes it from sessions and clears activeId', () => {
  const state = initialState();
  const c1 = state.challenges[0];

  const session1 = createSession(c1, 1, 1000);
  state.sessions.push(session1);
  state.activeId = session1.id;

  assert.equal(state.activeId, session1.id);

  // Simulating deleteSession
  state.sessions = state.sessions.filter((s) => s.id !== session1.id);
  if (state.activeId === session1.id) {
    state.activeId = null;
  }

  assert.equal(state.sessions.length, 0);
  assert.equal(state.activeId, null);
  assert.doesNotThrow(() => stateSchema.parse(state));
});
