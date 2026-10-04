import { AppState, Challenge, Session } from '@/types';
export const RESEARCH_MS=1800000, PITCH_MS=300000;
export const formatTime=(seconds:number)=>`${Math.floor(Math.max(0,seconds)/60).toString().padStart(2,'0')}:${Math.floor(Math.max(0,seconds)%60).toString().padStart(2,'0')}`;
export const average=(n:number[])=>n.length?n.reduce((a,b)=>a+b,0)/n.length:0;
export const score=(s:Session)=>average(s.scores);
export function remaining(s:Session,now=Date.now()){return Math.min(s.phase==='research'?1800:300,Math.max(0,Math.ceil((s.endTime-(s.pausedAt??now))/1000)));}
export function createSession(challenge:Challenge,number:number,now=Date.now()):Session{return {id:crypto.randomUUID(),number,challenge,phase:'research',startedAt:now,phaseStartedAt:now,endTime:now+RESEARCH_MS,pausedAt:null,pausedTotal:0,practice:false,notes:{},checklist:Array(10).fill(false),scores:Array(8).fill(5),reflections:Array(4).fill(''),researchSeconds:0,pitchSeconds:0};}
export function advance(s:Session,now=Date.now(),early=false):Session{
 if(s.pausedAt&&!early)return s;
 if(s.phase!=='research'&&s.phase!=='pitch')return s;
 if(!early&&now<s.endTime)return s;
 const end=early?(s.pausedAt??now):s.endTime;
 const elapsed=Math.max(0,Math.round((end-s.phaseStartedAt)/1000));
 if(s.phase==='research'){
 const next={...s,phase:'pitch' as const,researchSeconds:Math.min(1800,elapsed),phaseStartedAt:early?now:s.endTime,endTime:(early?now:s.endTime)+PITCH_MS,pausedAt:null};
 return advance(next,now);
 }
 return {...s,phase:'assessment',pitchSeconds:Math.min(300,elapsed),pausedAt:null};
}
export function pause(s:Session,now=Date.now()):Session{
 if(s.phase!=='research'&&s.phase!=='pitch')return s;
 if(!s.pausedAt)return {...s,pausedAt:now,practice:true};
 const delay=now-s.pausedAt; return {...s,pausedAt:null,endTime:s.endTime+delay,phaseStartedAt:s.phaseStartedAt+delay,pausedTotal:s.pausedTotal+delay};
}
export function resetTimer(s:Session,now=Date.now(),keepPaused?:boolean):Session{
 if(s.phase!=='research'&&s.phase!=='pitch'&&s.phase!=='assessment')return s;
 if(s.phase==='assessment')return restartPitch(s,now,keepPaused??false);
 const duration=s.phase==='research'?RESEARCH_MS:PITCH_MS;
 const isPaused=keepPaused!==undefined?keepPaused:(s.pausedAt!==null);
 return {...s,phaseStartedAt:now,endTime:now+duration,pausedAt:isPaused?now:null,pitchSeconds:s.phase==='pitch'?0:s.pitchSeconds,researchSeconds:s.phase==='research'?0:s.researchSeconds,practice:true};
}
export function restartPitch(s:Session,now=Date.now(),keepPaused=false):Session{
 return {...s,phase:'pitch',phaseStartedAt:now,endTime:now+PITCH_MS,pausedAt:keepPaused?now:null,pitchSeconds:0,practice:true};
}
export function choose(pool:Challenge[],seen:string[],sessions:Session[],random=Math.random){
 const unseen=pool.filter(c=>!seen.includes(c.id)&&!sessions.some(s=>s.challenge.id===c.id));
 const candidates=unseen.length?unseen:pool.filter(c=>!seen.slice(-Math.min(5,Math.max(0,pool.length-1))).includes(c.id));
 const final=candidates.length?candidates:pool;return final[Math.floor(random()*final.length)];
}
export function dateKey(time:number|Date=Date.now()){const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dailyChallenge(pool:Challenge[],date=dateKey()){let hash=2166136261;for(const char of date)hash=Math.imul(hash^char.charCodeAt(0),16777619);return pool[(hash>>>0)%pool.length];}
export function statistics(sessions:Session[]){
 const complete=sessions.filter(s=>s.phase==='complete'); const days=[...new Set(complete.map(s=>dateKey(s.completedAt!)))].sort();
 const ordinal=(d:string)=>Date.parse(d+'T12:00:00Z')/86400000;
 let longest=0,run=0;days.forEach((d,i)=>{run=i&&ordinal(d)-ordinal(days[i-1])===1?run+1:1;longest=Math.max(longest,run);});
 let streak=0;let cursor=ordinal(dateKey());if(!days.includes(dateKey()))cursor--;
 const ordinals=new Set(days.map(ordinal));while(ordinals.has(cursor)){streak++;cursor--;}
 return {complete,streak,longest,averageScore:average(complete.map(score)),averagePitch:average(complete.map(s=>average([s.scores[5],s.scores[6]]))),averageResearch:average(complete.map(s=>s.researchSeconds)),categories:new Set(complete.map(s=>s.challenge.category)).size};
}
export function statusFor(c:Challenge,state:AppState){return state.sessions.some(s=>s.challenge.id===c.id&&s.phase==='complete')?'Completed':state.sessions.some(s=>s.challenge.id===c.id&&s.phase!=='complete')?'In progress':'Untouched';}
