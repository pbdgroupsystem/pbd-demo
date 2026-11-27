const scope=new URL(self.registration.scope),prefix='pbd-shell:'+scope.pathname+':',cacheName=prefix+'1';
const files=['./index.html','./admin.html','./config.js','./app.js','./style.css','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(prefix)&&k!==cacheName).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==scope.origin)return;
 const asset=files.find(f=>new URL(f,scope).pathname===url.pathname)||(url.pathname===scope.pathname?'./index.html':'');
 if(!asset)return;
 event.respondWith((async()=>{const cache=await caches.open(cacheName);try{const response=await fetch(req);if(response.ok&&!url.search)await cache.put(asset,response.clone());return response}catch(error){const cached=await cache.match(asset);if(cached)return cached;throw error}})())
});