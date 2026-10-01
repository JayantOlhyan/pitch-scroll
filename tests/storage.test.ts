import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges } from '../data/challenges';
import { legacyCatalogSlugs } from '../data/legacy-catalog';
import { createSession, statusFor } from '../lib/engine';
import { initialState, normalizeState, replaceLibrary, CATALOG_REVISION } from '../lib/storage';
import { Challenge } from '../types';

const previous = legacyCatalogSlugs.map((slug,i)=>({...challenges.find(c=>c.slug===slug)!,id:`topic-${i+1}`,number:i+1}));
const expanded = challenges.map((c,i)=>({...c,id:`topic-${i+1}`}));
const legacy = (list:Challenge[])=>({...initialState(),catalogRevision:undefined,challenges:list});

for (const [name,catalog] of [['previous',previous],['expanded',expanded]] as const) {
 test(`${name} catalog upgrades without changing active session content or deadlines`,()=>{
  const github = catalog.find(c=>c.slug==='github')!;
  const session = createSession(github,42,1000000);
  session.notes.Problem='Private notes';
  session.scores=[9,8,7,6,5,4,3,2];
  const raw={...legacy(catalog),sessions:[session],seen:[github.id],activeId:session.id};
  const state=normalizeState(JSON.parse(JSON.stringify(raw)));
  assert.equal(state.challenges.length,177);
  assert.equal(state.catalogRevision,CATALOG_REVISION);
  assert.deepEqual(state.sessions[0],{...session,challenge:{...github,id:'builtin:github'}});
  assert.equal(state.activeId,session.id);
  assert.deepEqual(state.preferences,raw.preferences);
  assert.deepEqual(state.seen,['builtin:github']);
  assert.equal(statusFor(challenges.find(c=>c.slug==='github')!,state),'In progress');
  assert.deepEqual(normalizeState(state),state);
 });
}

test('upgrade preserves edits, custom challenges, deleted old topics, and unresolved history',()=>{
 const list=structuredClone(previous.filter(c=>c.slug!=='openai'));
 const github=list.find(c=>c.slug==='github')!;
 github.description='My custom description';
 github.slug='my-edited-github';
 const custom={...challenges[0],id:'my-custom-id',slug:'my-own-topic',title:'My topic'};
 const state=normalizeState({...legacy([...list,custom]),seen:['topic-9999',github.id]});
 assert.equal(state.challenges.some(c=>c.slug==='openai'),false);
 assert.deepEqual(state.challenges.find(c=>c.id==='my-custom-id'),custom);
 assert.equal(state.challenges.find(c=>c.id==='builtin:github')?.description,'My custom description');
 assert.deepEqual(state.seen,['legacy:topic-9999','builtin:github']);
 const deletedNew={...state,challenges:state.challenges.filter(c=>c.slug!=='groq')};
 assert.deepEqual(normalizeState(deletedNew),deletedNew);
});

test('session snapshots resolve shifted IDs independently of the library',()=>{
 const old=previous.find(c=>c.slug==='github')!;
 const session=createSession(old,1,1000);
 const state=normalizeState({...legacy(expanded),sessions:[session]});
 assert.equal(state.sessions[0].challenge.id,'builtin:github');
});

test('import replaces exactly the requested library and reconciles history by slug',()=>{
 const session=createSession(challenges[0],1,1000);
 const state={...initialState(),sessions:[session],seen:[challenges[0].id]};
 const imported={...challenges[0],id:'imported-openai',description:'Edited import'};
 const next=replaceLibrary(state,[imported]);
 assert.deepEqual(next.challenges,[imported]);
 assert.deepEqual(next.sessions[0],{...session,challenge:{...session.challenge,id:imported.id}});
 assert.deepEqual(next.seen,[imported.id]);
 assert.deepEqual(normalizeState(next),next);
});

test('built-in identities derive from slugs rather than positions',()=>{
 for (const c of [...challenges].reverse()) assert.equal(c.id,`builtin:${c.slug}`);
});

test('invalid backups are rejected without mutating their input',()=>{
 const raw={...legacy(previous),sessions:[{id:'broken'}]};
 const before=JSON.stringify(raw);
 assert.throws(()=>normalizeState(raw));
 assert.equal(JSON.stringify(raw),before);
});


test('expanded legacy catalogs keep deletions of newly introduced topics',()=>{
 const state=normalizeState(legacy(expanded.filter(c=>c.slug!=='groq')));
 assert.equal(state.challenges.some(c=>c.slug==='groq'),false);
 assert.equal(state.challenges.length,176);
});

test('edited slugs do not change an established built-in identity',()=>{
 const list=structuredClone(previous.filter(c=>c.slug!=='openai'));
 list.find(c=>c.slug==='github')!.slug='openai';
 const state=normalizeState(legacy(list));
 assert.equal(state.challenges.find(c=>c.slug==='openai')?.id,'builtin:github');
});


test('imported ID reuse cannot assign old history to a different custom topic',()=>{
 const old={...challenges[0],id:'custom-id',slug:'custom-old'};
 const replacement={...challenges[1],id:'custom-id',slug:'custom-new'};
 const session=createSession(old,1,1000);
 const state={...initialState(),challenges:[old],sessions:[session],seen:[old.id]};
 const next=replaceLibrary(state,[replacement]);
 assert.equal(statusFor(replacement,next),'Untouched');
 assert.equal(next.sessions[0].challenge.id,'history:custom-id:custom-old');
 assert.deepEqual(next.seen,['history:custom-id:custom-old']);
});
