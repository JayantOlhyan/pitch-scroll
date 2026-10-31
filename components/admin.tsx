'use client';

import { useState } from 'react';
import { Copy, Download, Plus, Trash2, Pencil, Upload, Search, Database, ShieldCheck } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { Challenge, difficulties, challengeTypes } from '@/types';
import { questions } from '@/data/challenges';
import {
  challengeSchema,
  exportJSON,
  downloadBlob,
  parseChallenges,
  stateSchema,
  normalizeState,
  replaceLibrary,
  STORAGE_KEY,
} from '@/lib/storage';
import { Modal, Badge } from './ui';

export function Admin({ startNew = false }: { startNew?: boolean }) {
  const { state, update, clearError } = useApp();

  const blank = (): Challenge => ({
    id: crypto.randomUUID(),
    number: Math.max(0, ...state.challenges.map((c) => c.number)) + 1,
    title: '',
    slug: '',
    type: 'Company',
    category: 'Custom',
    industry: 'Technology',
    difficulty: 'Medium',
    description: '',
    mission: '',
    researchQuestions: [...questions],
    keywords: [],
    sources: [],
    featured: false,
    createdAt: new Date().toISOString(),
  });

  const [editing, setEditing] = useState<Challenge | null>(startNew ? blank() : null);
  const [deleting, setDeleting] = useState<Challenge | null>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<{ kind: 'library' | 'backup'; value: unknown } | null>(null);
  const [json, setJson] = useState('');

  const change = (key: keyof Challenge, value: unknown) =>
    setEditing((c) => (c ? { ...c, [key]: value } : c));

  async function importFile(file: File | undefined, kind: 'library' | 'backup') {
    if (!file) return;
    try {
      if (file.size > 10000000) throw new Error('Choose a file smaller than 10 MB.');
      const value = JSON.parse(await file.text());
      if (kind === 'library') parseChallenges(value);
      else stateSchema.parse(value);
      setPending({ kind, value });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read JSON file.');
    }
  }

  function applyImport() {
    if (!pending) return;
    try {
      if (pending.kind === 'library') {
        const list = parseChallenges(pending.value);
        update((s) => replaceLibrary(s, list));
        setMessage(`Successfully imported ${list.length} challenges. Your existing session history is preserved.`);
      } else {
        const next = normalizeState(pending.value);
        clearError();
        update(() => next);
        setMessage('Full device backup successfully restored.');
      }
      setPending(null);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="page admin-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Local-first data management</p>
          <h1>Data management & backups.</h1>
          <p>Curate your library, create custom research topics, and safely migrate your fieldwork.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setError('');
            setEditing(blank());
          }}
        >
          <Plus size={16} /> Add challenge
        </button>
      </div>

      <div className="admin-stats-bar" role="region" aria-label="Catalog statistics summary">
        <div className="admin-stat-pill">
          <Database size={14} className="admin-stat-icon" />
          <span className="admin-stat-label">Catalog Topics:</span>
          <span className="admin-stat-val">{state.challenges.length}</span>
        </div>
        <div className="admin-stat-pill">
          <span className="admin-stat-label">Categories:</span>
          <span className="admin-stat-val">{new Set(state.challenges.map((c) => c.category)).size}</span>
        </div>
        <div className="admin-stat-pill">
          <span className="admin-stat-label">Primary Sources:</span>
          <span className="admin-stat-val">
            {state.challenges.reduce((acc, c) => acc + (c.sources?.length || 0), 0)}
          </span>
        </div>
        <div className="admin-stat-pill">
          <ShieldCheck size={14} className="admin-stat-icon" />
          <span className="admin-stat-label">Integrity Status:</span>
          <span className="admin-stat-val highlight">Schema Verified</span>
        </div>
      </div>

      <div className="admin-actions panel">
        <div>
          <h3>Challenge library</h3>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 16px' }}>
            Export or replace the challenge catalog. Session history remains completely untouched.
          </p>
          <div className="actions">
            <button
              className="button"
              type="button"
              onClick={() => exportJSON(state.challenges, '30-minute-challenges.json')}
            >
              <Download size={16} /> Export catalog JSON
            </button>
            <label className="button file-label">
              <Upload size={16} /> Import catalog JSON
              <input
                type="file"
                accept="application/json,.json"
                aria-label="Import challenge JSON"
                onChange={(e) => {
                  void importFile(e.target.files?.[0], 'library');
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div>
          <h3>Complete device backup</h3>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 16px' }}>
            Full snapshot including notes, checklists, self-scores, custom challenges, and settings.
          </p>
          <div className="actions">
            <button
              className="button"
              type="button"
              onClick={() => {
                const raw = localStorage.getItem(STORAGE_KEY);
                downloadBlob(
                  new Blob([raw || JSON.stringify(state, null, 2)], { type: 'application/json' }),
                  '30-minute-full-backup.json'
                );
              }}
            >
              <Download size={16} /> Download full backup
            </button>
            <label className="button file-label">
              <Upload size={16} /> Restore full backup
              <input
                type="file"
                accept="application/json,.json"
                aria-label="Restore full backup"
                onChange={(e) => {
                  void importFile(e.target.files?.[0], 'backup');
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <p className="hint">
        Your work is stored 100% locally in this browser. To transfer your sessions between computers, export a full backup and restore it on your target device.
      </p>

      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <div style={{ marginTop: 32 }}>
        <label className="search-input">
          <Search size={18} />
          <span className="sr-only">Search data</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a challenge to edit or duplicate…"
          />
        </label>
      </div>

      <details style={{ marginTop: 20 }}>
        <summary>Preview or paste library JSON directly</summary>
        <p className="hint">
          Validate and import a JSON array of challenges directly. Structure must match the schema specification.
        </p>
        <label>
          Library JSON
          <textarea
            className="json-editor"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder="Paste an exported challenge array…"
          />
        </label>
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={() => setJson(JSON.stringify(state.challenges, null, 2))}>
            Preview current JSON
          </button>
          <button
            className="button"
            type="button"
            onClick={() => {
              try {
                const value = JSON.parse(json);
                parseChallenges(value);
                setPending({ kind: 'library', value });
                setError('');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Invalid JSON format.');
              }
            }}
          >
            Validate and import
          </button>
        </div>
      </details>

      <div className="admin-list">
        {state.challenges
          .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
          .map((c) => (
            <div className="admin-row" key={c.id}>
              <div>
                <strong>{c.title}</strong>
                <span>
                  {c.category} · {c.type}
                </span>
              </div>
              <Badge>{c.difficulty}</Badge>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="icon-button"
                  aria-label={`Edit ${c.title}`}
                  title="Edit challenge"
                  onClick={() => {
                    setEditing(c);
                    setError('');
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Duplicate ${c.title}`}
                  title="Duplicate challenge"
                  onClick={() => {
                    const duplicate = {
                      ...c,
                      id: crypto.randomUUID(),
                      number: Math.max(...state.challenges.map((x) => x.number)) + 1,
                      title: c.title + ' (copy)',
                      slug: c.slug + '-copy-' + Date.now(),
                      featured: false,
                    };
                    update((s) => ({ ...s, challenges: [...s.challenges, duplicate] }));
                    setMessage(`Duplicated ${c.title}.`);
                  }}
                >
                  <Copy size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete ${c.title}`}
                  title="Delete challenge"
                  onClick={() => setDeleting(c)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Edit / Add Challenge Modal */}
      {editing && (
        <Modal
          title={state.challenges.some((c) => c.id === editing.id) ? 'Edit challenge' : 'Add custom challenge'}
          onClose={() => setEditing(null)}
        >
          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const c = challengeSchema.parse(editing);
                if (state.challenges.some((x) => x.id !== c.id && x.slug === c.slug)) {
                  throw new Error('This URL slug is already in use. Please specify a unique slug.');
                }
                update((s) => ({
                  ...s,
                  challenges: s.challenges.some((x) => x.id === c.id)
                    ? s.challenges.map((x) => (x.id === c.id ? c : x))
                    : [...s.challenges, c],
                }));
                setEditing(null);
                setError('');
                setMessage('Challenge saved successfully.');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Please check all required challenge fields.');
              }
            }}
          >
            {['title', 'slug', 'category', 'industry'].map((key) => (
              <label key={key}>
                {key === 'slug' ? 'URL slug' : key[0].toUpperCase() + key.slice(1)}
                <input
                  required
                  value={String(editing[key as keyof Challenge])}
                  onChange={(e) => {
                    change(key as keyof Challenge, e.target.value);
                    if (key === 'title' && !state.challenges.some((c) => c.id === editing.id)) {
                      change(
                        'slug',
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                      );
                    }
                  }}
                />
              </label>
            ))}

            <div className="form-grid">
              <label>
                Type
                <select value={editing.type} onChange={(e) => change('type', e.target.value)}>
                  {challengeTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Difficulty
                <select value={editing.difficulty} onChange={(e) => change('difficulty', e.target.value)}>
                  {difficulties.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>

            {['description', 'mission'].map((key) => (
              <label key={key}>
                {key === 'description' ? 'Description (1–2 sentences)' : 'Mission prompt'}
                <textarea
                  required
                  value={String(editing[key as keyof Challenge])}
                  onChange={(e) => change(key as keyof Challenge, e.target.value)}
                />
              </label>
            ))}

            <label>
              Research questions (exactly 10 questions, one per line)
              <textarea
                required
                value={editing.researchQuestions.join('\n')}
                onChange={(e) => change('researchQuestions', e.target.value.split('\n'))}
              />
            </label>

            <label>
              Keywords (comma-separated tags)
              <input
                value={editing.keywords.join(', ')}
                onChange={(e) =>
                  change(
                    'keywords',
                    e.target.value.split(',').map((v) => v.trim())
                  )
                }
              />
            </label>

            <label>
              Primary source URLs (one URL per line)
              <textarea
                value={editing.sources.map((s) => s.url).join('\n')}
                onChange={(e) =>
                  change(
                    'sources',
                    e.target.value
                      .split('\n')
                      .filter(Boolean)
                      .map((url) => ({ url, label: 'Research source' }))
                  )
                }
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => change('featured', e.target.checked)}
              />{' '}
              Feature on home page
            </label>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button className="button primary" type="submit">
              Save challenge
            </button>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <Modal title={`Delete "${deleting.title}"?`} onClose={() => setDeleting(null)}>
          <p>
            This permanently removes the topic from your challenge library. Any existing completed or in-progress sessions for this topic retain their own snapshot of the challenge and your notes.
          </p>
          <div className="actions modal-actions" style={{ marginTop: 20 }}>
            <button className="button" type="button" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="button danger"
              type="button"
              onClick={() => {
                update((s) => ({ ...s, challenges: s.challenges.filter((c) => c.id !== deleting.id) }));
                setDeleting(null);
                setMessage('Challenge deleted from library.');
              }}
            >
              Delete challenge
            </button>
          </div>
        </Modal>
      )}

      {/* Import Confirmation Modal */}
      {pending && (
        <Modal
          title={pending.kind === 'library' ? 'Replace your challenge catalog?' : 'Restore full device backup?'}
          onClose={() => setPending(null)}
        >
          <p>
            {pending.kind === 'library'
              ? 'The imported catalog will replace your current library list. Your session history, reflections, and notes remain completely intact.'
              : 'Warning: This will overwrite all local challenges, session history, notes, and preferences with the contents of this backup. We recommend downloading a backup first.'}
          </p>
          <div className="actions modal-actions" style={{ marginTop: 20 }}>
            <button className="button" type="button" onClick={() => setPending(null)}>
              Cancel
            </button>
            <button className="button primary" type="button" onClick={applyImport}>
              Confirm import
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
