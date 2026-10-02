'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,ReactNode} from 'react';
import {AppState,Challenge,Session} from '@/types';
import {initialState,loadState,saveState,STORAGE_KEY,normalizeState} from '@/lib/storage';
import {advance,createSession,remaining} from '@/lib/engine';
import {sound,SoundEvent} from '@/lib/sound';
type Context={state:AppState;ready:boolean;error:string;update:(fn:(s:AppState)=>AppState)=>void;editSession:(id:string,fn:(s:Session)=>Session)=>void;deleteSession:(id:string)=>void;discardAndStart:(abandonId:string,c:Challenge)=>string;start:(c:Challenge)=>string;play:(e:SoundEvent,opts?:{speedRatio?:number;isNearStop?:boolean})=>void;rouletteTick:(speedRatio?:number,isNearStop?:boolean)=>void;rouletteHit:()=>void;now:number;clearError:()=>void};
const AppContext=createContext<Context|null>(null);
export function AppProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<AppState>(initialState),[ready,setReady]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now());
 const latest=useRef(state);const writable=useRef(true);
 const update=useCallback((fn:(s:AppState)=>AppState)=>{const next=fn(latest.current);latest.current=next;setState(next);if(writable.current)try{saveState(next);}catch{setError('Your browser could not save this change. Export a backup from Data management before closing this tab.');}},[]);
 useEffect(()=>{try{const s=loadState();latest.current=s;setState(s);try{saveState(s);}catch{setError('Your browser could not save the library upgrade. Export a backup from Data management before closing this tab.');}}catch{writable.current=false;setError('Saved data could not be read. Your existing data has been preserved. Export the stored data in Data management before replacing it.');}setReady(true);
 const onStorage=(e:StorageEvent)=>{if(e.key===STORAGE_KEY&&e.newValue)try{const s=normalizeState(JSON.parse(e.newValue));latest.current=s;setState(s);}catch{}};window.addEventListener('storage',onStorage);return()=>window.removeEventListener('storage',onStorage);},[]);
 const play=useCallback((event:SoundEvent,opts?:{speedRatio?:number;isNearStop?:boolean})=>{const p=latest.current.preferences;sound(event,p.sound,p.volume,opts);},[]);
 const rouletteTick=useCallback((speedRatio=0.5,isNearStop=false)=>{const p=latest.current.preferences;sound('roulette-tick',p.sound,p.volume,{speedRatio,isNearStop});},[]);
 const rouletteHit=useCallback(()=>{const p=latest.current.preferences;sound('roulette-hit',p.sound,p.volume);},[]);
 const prev=useRef({id:'',phase:'',seconds:0});
 useEffect(()=>{if(!ready)return;const tick=()=>{const time=Date.now();setNow(time);const current=latest.current;const active=current.sessions.find(s=>s.id===current.activeId);if(!active)return;const next=advance(active,time);if(next!==active){play(next.phase==='pitch'?'transition':'pitch-complete');update(s=>({...s,sessions:s.sessions.map(x=>x.id===next.id?next:x)}));}else if(!active.pausedAt){const left=remaining(active,time);const old=prev.current;const thresholds=active.phase==='research'?[600,300,60,30]:[120,60,30];if(old.id===active.id&&old.phase===active.phase)for(const n of thresholds)if(old.seconds>n&&left<=n){play(active.phase==='pitch'?'pitch-warning':n===600?'ten':n===300?'five':n===60?'one':'thirty');break;}prev.current={id:active.id,phase:active.phase,seconds:left};}};tick();const timer=setInterval(tick,250);window.addEventListener('focus',tick);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick);document.removeEventListener('visibilitychange',tick);};},[ready,play,update]);
 const editSession=useCallback((id:string,fn:(s:Session)=>Session)=>update(s=>({...s,sessions:s.sessions.map(x=>x.id===id?fn(x):x)})),[update]);
 const deleteSession=useCallback((id:string)=>update(s=>({...s,sessions:s.sessions.filter(x=>x.id!==id),activeId:s.activeId===id?null:s.activeId})),[update]);
 const discardAndStart=useCallback((abandonId:string,c:Challenge)=>{const filtered=latest.current.sessions.filter(x=>x.id!==abandonId);const s=createSession(c,Math.max(0,...filtered.map(x=>x.number))+1);update(old=>({...old,activeId:s.id,seen:[...old.seen.filter(id=>id!==c.id),c.id],sessions:[s,...old.sessions.filter(x=>x.id!==abandonId)]}));play('start');return s.id;},[update,play]);
 const start=useCallback((c:Challenge)=>{const s=createSession(c,Math.max(0,...latest.current.sessions.map(s=>s.number))+1);update(old=>({...old,activeId:s.id,seen:[...old.seen.filter(id=>id!==c.id),c.id],sessions:[s,...old.sessions]}));play('start');return s.id;},[update,play]);
 return <AppContext.Provider value={{state,ready,error,update,editSession,deleteSession,discardAndStart,start,play,rouletteTick,rouletteHit,now,clearError:()=>{writable.current=true;setError('');}}}>{children}</AppContext.Provider>;
}
export function useApp(){const ctx=useContext(AppContext);if(!ctx)throw new Error('App provider is missing');return ctx;}
