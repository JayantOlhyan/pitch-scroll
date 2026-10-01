import type {Metadata} from 'next';
import {AppRoute} from '@/components/app-shell';
import {challenges} from '@/data/challenges';
export async function generateMetadata({params}:{params:Promise<{path?:string[]}>}):Promise<Metadata>{const {path}=await params;const c=path?.[0]==='challenges'?challenges.find(c=>c.slug===path[1]):undefined;return c?{title:`${c.title} — 30 MINUTE Challenge`,description:c.description}:{title:`${path?.[0]?path[0].charAt(0).toUpperCase()+path[0].slice(1)+' — ':''}30 MINUTE`};}
export default function Page(){return <AppRoute/>;}
