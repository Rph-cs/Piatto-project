// Service worker do Piatto: guarda o "esqueleto" do site para abrir rápido. A API nunca é guardada.
const V='piatto-v1',SHELL=['/','/style.css','/app.js','/piatto.jpg','/manifest.webmanifest','/img/cafe.svg','/img/almoco.svg','/img/lanche.svg','/img/sobremesa.svg','/img/geral.svg','/icons/icon-192.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))))});
