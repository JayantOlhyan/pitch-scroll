import { z } from 'zod';
import { AppState, Challenge } from '@/types';
import { challenges } from '@/data/challenges';
import { legacyCatalogSlugs } from '@/data/legacy-catalog';
export const STORAGE_KEY='thirty-minute:v1';
const sourceSchema=z.object({label:z.string().min(1).max(200),url:z.string().url().refine(v=>/^https?:\/\//.test(v),'Use http or https links')});
export const challengeSchema=z.object({id:z.string().min(1),number:z.number().int().positive(),title:z.string().min(1).max(200),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),type:z.string().min(1),category:z.string().min(1),industry:z.string().min(1),difficulty:z.enum(['Easy','Medium','Hard','Insane']),description:z.string().min(1),mission:z.string().min(1),researchQuestions:z.array(z.string()).min(1),keywords:z.array(z.string()),sources:z.array(sourceSchema),featured:z.boolean(),createdAt:z.string()});
export const sessionSchema=z.object({id:z.string(),number:z.number(),challenge:challengeSchema,phase:z.enum(['research','pitch','assessment','complete']),startedAt:z.number(),endTime:z.number(),phaseStartedAt:z.number(),pausedAt:z.number().nullable(),pausedTotal:z.number(),practice:z.boolean(),notes:z.record(z.string()),checklist:z.array(z.boolean()).length(10),scores:z.array(z.number().min(1).max(10)).length(8),reflections:z.array(z.string()).length(4),researchSeconds:z.number(),pitchSeconds:z.number(),completedAt:z.number().optional()});
export const stateSchema=z.object({version:z.literal(1),catalogRevision:z.number().int().nonnegative().optional(),challenges:z.array(challengeSchema),sessions:z.array(sessionSchema),seen:z.array(z.string()),activeId:z.string().nullable(),preferences:z.object({sound:z.boolean(),volume:z.number().min(0).max(1),cinematic:z.boolean(),recording:z.enum(['off','wide','vertical'])})});
export const initialState=():AppState=>({version:1,catalogRevision:CATALOG_REVISION,challenges,sessions:[],seen:[],activeId:null,preferences:{sound:false,volume:.35,cinematic:false,recording:'off'}});
export function loadState():AppState {const raw=localStorage.getItem(STORAGE_KEY);return raw?normalizeState(JSON.parse(raw)):initialState();}
export function saveState(state:AppState){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
export function parseChallenges(raw:unknown):Challenge[]{const list=z.array(challengeSchema).min(1).parse(raw);if(new Set(list.map(c=>c.id)).size!==list.length||new Set(list.map(c=>c.slug)).size!==list.length)throw new Error('Challenge IDs and slugs must be unique.');return list;}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function exportJSON(value:unknown,name:string){downloadBlob(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),name);}

export const CATALOG_REVISION = 1;
const legacySlugs = new Set<string>(legacyCatalogSlugs);
const builtinBySlug = new Map(challenges.map(c => [c.slug, c]));
const legacyId = /^topic-\d+$/;

// Slugs in stored snapshots disambiguate IDs whose array positions changed.
function legacyAliases(list:Challenge[]):Map<string,string> {
 const orders = [legacyCatalogSlugs as readonly string[],challenges.map(c=>c.slug)];
 const matches = (order:readonly string[])=>list.filter(c=>legacyId.test(c.id) && order[Number(c.id.slice(6))-1]===c.slug).length;
 const order = matches(orders[1]) > matches(orders[0]) ? orders[1] : orders[0];
 return new Map(order.map((slug,i)=>[`topic-${i+1}`,`builtin:${slug}`]));
}

function stableChallenge(c:Challenge,aliases=new Map<string,string>()):Challenge {
 if (!legacyId.test(c.id)) return c;
 const canonical = builtinBySlug.get(c.slug);
 return {...c,id:canonical?.id ?? aliases.get(c.id) ?? `legacy:${c.id}`};
}

export function normalizeState(raw:unknown):AppState {
 const state = stateSchema.parse(raw);
 const aliases = legacyAliases(state.challenges);
 const stable = (c:Challenge)=>stableChallenge(c,aliases);
 const idMap = new Map(state.challenges.map(c => [c.id,stable(c).id]));
 for (const session of state.sessions) {
  if (!idMap.has(session.challenge.id)) idMap.set(session.challenge.id,stable(session.challenge).id);
 }
 const list = state.challenges.map(stable);
 if ((state.catalogRevision ?? 0) < CATALOG_REVISION) {
  const ids = new Set(list.map(c=>c.id));
  const slugs = new Set(list.map(c=>c.slug));
  // Missing old topics may have been intentionally deleted or excluded by an import.
  for (const c of challenges) {
   if (!legacySlugs.has(c.slug) && !ids.has(c.id) && !slugs.has(c.slug)) list.push(c);
  }
 }
 return {...state,catalogRevision:Math.max(state.catalogRevision ?? 0,CATALOG_REVISION),challenges:list,
  sessions:state.sessions.map(s=>({...s,challenge:stable(s.challenge)})),
  seen:[...new Set(state.seen.map(id=>idMap.get(id) ?? (legacyId.test(id)?`legacy:${id}`:id)))]};
}

export function replaceLibrary(state:AppState,raw:unknown):AppState {
 const parsed = parseChallenges(raw);
 const aliases = legacyAliases(parsed);
 const list = parsed.map(c=>stableChallenge(c,aliases));
 // Validate again: canonicalizing legacy IDs must not introduce collisions.
 parseChallenges(list);
 const previous = new Map(state.challenges.map(c=>[c.id,c.slug]));
 const bySlug = new Map(list.map(c=>[c.slug,c.id]));
 const remap = (id:string,slug?:string)=>bySlug.get(slug ?? previous.get(id) ?? '') ?? id;
 return {...state,catalogRevision:CATALOG_REVISION,challenges:list,
  sessions:state.sessions.map(s=>({...s,challenge:{...s.challenge,id:remap(s.challenge.id,s.challenge.slug)}})),
  seen:[...new Set(state.seen.map(id=>remap(id)))]};
}
