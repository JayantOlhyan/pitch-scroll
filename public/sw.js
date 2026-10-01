/* Offline app shell. User notes remain in localStorage, never in this cache. */
const CACHE='30minute-shell-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/')).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('30minute-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const r=event.request;const u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin)return;if(r.mode==='navigate'){event.respondWith(fetch(r).then(response=>{if(response.ok)caches.open(CACHE).then(c=>c.put(r,response.clone()));return response;}).catch(async()=>await caches.match(r)||await caches.match('/')));return;}if(['script','style','font','image'].includes(r.destination)){event.respondWith(caches.match(r).then(cached=>cached||fetch(r).then(response=>{if(response.ok)caches.open(CACHE).then(c=>c.put(r,response.clone()));return response;})));}});

self.addEventListener('message',event=>{if(event.data?.type==='CACHE_ASSETS')event.waitUntil(caches.open(CACHE).then(cache=>Promise.all(event.data.urls.filter(url=>new URL(url).origin===self.location.origin).map(url=>cache.add(url).catch(()=>{})))));});
