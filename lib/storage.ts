import { z } from 'zod';
import { AppState, Challenge } from '@/types';
import { challenges } from '@/data/challenges';
export const STORAGE_KEY='thirty-minute:v1';
const sourceSchema=z.object({label:z.string().min(1).max(200),url:z.string().url().refine(v=>/^https?:\/\//.test(v),'Use http or https links')});
export const challengeSchema=z.object({id:z.string().min(1),number:z.number().int().positive(),title:z.string().min(1).max(200),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),type:z.string().min(1),category:z.string().min(1),industry:z.string().min(1),difficulty:z.enum(['Easy','Medium','Hard','Insane']),description:z.string().min(1),mission:z.string().min(1),researchQuestions:z.array(z.string()).min(1),keywords:z.array(z.string()),sources:z.array(sourceSchema),featured:z.boolean(),createdAt:z.string()});
export const sessionSchema=z.object({id:z.string(),number:z.number(),challenge:challengeSchema,phase:z.enum(['research','pitch','assessment','complete']),startedAt:z.number(),endTime:z.number(),phaseStartedAt:z.number(),pausedAt:z.number().nullable(),pausedTotal:z.number(),practice:z.boolean(),notes:z.record(z.string()),checklist:z.array(z.boolean()).length(10),scores:z.array(z.number().min(1).max(10)).length(8),reflections:z.array(z.string()).length(4),researchSeconds:z.number(),pitchSeconds:z.number(),completedAt:z.number().optional()});
export const stateSchema=z.object({version:z.literal(1),challenges:z.array(challengeSchema),sessions:z.array(sessionSchema),seen:z.array(z.string()),activeId:z.string().nullable(),preferences:z.object({sound:z.boolean(),volume:z.number().min(0).max(1),cinematic:z.boolean(),recording:z.enum(['off','wide','vertical'])})});
export const initialState=():AppState=>({version:1,challenges,sessions:[],seen:[],activeId:null,preferences:{sound:false,volume:.35,cinematic:false,recording:'off'}});
export function loadState():AppState {const raw=localStorage.getItem(STORAGE_KEY);return raw?stateSchema.parse(JSON.parse(raw)):initialState();}
export function saveState(state:AppState){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
export function parseChallenges(raw:unknown):Challenge[]{const list=z.array(challengeSchema).min(1).parse(raw);if(new Set(list.map(c=>c.id)).size!==list.length||new Set(list.map(c=>c.slug)).size!==list.length)throw new Error('Challenge IDs and slugs must be unique.');return list;}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function exportJSON(value:unknown,name:string){downloadBlob(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),name);}
