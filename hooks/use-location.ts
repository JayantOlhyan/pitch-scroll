'use client';
import {useSyncExternalStore} from 'react';
const subscribe=(fn:()=>void)=>{window.addEventListener('popstate',fn);return()=>window.removeEventListener('popstate',fn);};
const snapshot=()=>location.pathname+location.search;
export function navigate(url:string,replace=false){if(!navigator.onLine){if(location.pathname+location.search!==url)location[replace?'replace':'assign'](url);return;}if(replace&&snapshot()===url)return;const old=location.pathname;history[replace?'replaceState':'pushState']({},'',url);window.dispatchEvent(new PopStateEvent('popstate'));if(old!==location.pathname&&!replace)window.scrollTo(0,0);}
export function useLocation(){const route=useSyncExternalStore(subscribe,snapshot,()=>'/');const [path,search='']=route.split('?');return {path,query:new URLSearchParams(search)};}
const router={push:(url:string)=>navigate(url),replace:(url:string)=>navigate(url,true)};
export function useAppRouter(){return router;}
