/* Aurora 3.1 Service Worker. Weather is NETWORK FIRST with a short-lived, explicitly marked fallback. */
'use strict';
const SHELL_CACHE='tabarjal-shell-v5.5-performance-20261014';
const WEATHER_CACHE='tabarjal-weather-v4.3-20261013';
const MAX_WEATHER_AGE_MS=10*60*1000;
const MAX_OFFLINE_STALE_MS=24*60*60*1000;
const MAX_WEATHER_ENTRIES=12;
const STATIC_ASSETS=['/','/index.html','/styles.css','/aurora-luxe.css','/aurora-critical-bundle.css','/aurora-luxe.js','/weather-ai.css','/weather-ai.js','/navigation.js','/app.js','/enhancements.js','/studio.css','/studio.js','/prayer.css','/prayer.js','/quran.html','/quran.css','/quran.js','/privacy.html','/about.html','/manifest.webmanifest','/offline.html','/icons/icon-192.png','/icons/icon-512.png'];
const WEATHER_HOSTS=new Set(['api.open-meteo.com','air-quality-api.open-meteo.com']);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  await caches.open(SHELL_CACHE).then(cache=>cache.addAll(STATIC_ASSETS));

 })());
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const name of await caches.keys()){
   if(name.startsWith('tabarjal-')&&name!==SHELL_CACHE&&name!==WEATHER_CACHE)await caches.delete(name);
  }
  await self.clients.claim();
 })());
});
async function capWeatherCache(cache){
 const keys=await cache.keys();
 for(const key of keys.slice(0,Math.max(0,keys.length-MAX_WEATHER_ENTRIES)))await cache.delete(key);
}
async function networkFirstWeather(event){
 const request=event.request;
 let response;
 try{
  response=await fetch(request);
  if(!response.ok)throw Error('Weather API HTTP '+response.status);
  if(response.type!=='opaque'){
   const copy=response.clone(),fetchedAt=Date.now();
   event.waitUntil((async()=>{
    // Cache only parseable weather/air-quality JSON, never an HTML captive portal.
    const contentType=(copy.headers.get('content-type')||'').toLowerCase();
    if(!contentType.includes('application/json'))return;
    const parsed=await copy.clone().json().catch(()=>null);
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||parsed.error)return;
    if(!parsed.current || typeof parsed.current!=='object')return;

    const cache=await caches.open(WEATHER_CACHE);
    const headers=new Headers(copy.headers);
    headers.set('X-Tabarjal-Cached-At',String(fetchedAt));
    await cache.put(request,new Response(copy.body,{status:copy.status,statusText:copy.statusText,headers}));
    await capWeatherCache(cache);
   })().catch(()=>{}));
  }
  return response;
 }catch(error){
  // Cached forecasts are limited to ten minutes; NEVER silently pass off older forecasts as live data.
  const cache=await caches.open(WEATHER_CACHE);
  const saved=await cache.match(request);
  if(saved){
   const at=Number(saved.headers.get('X-Tabarjal-Cached-At'));
   if(Number.isFinite(at)&&at>0&&Date.now()-at<=MAX_OFFLINE_STALE_MS){
    const headers=new Headers(saved.headers);
    headers.set('X-Tabarjal-Cache','fallback');
    headers.set('X-Tabarjal-Stale',String(Date.now()-at>MAX_WEATHER_AGE_MS));
    return new Response(saved.body,{status:saved.status,statusText:saved.statusText,headers});
   }
   await cache.delete(request);
  }
  return Response.error();
 }
}
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(event.request.method==='GET' && u.hostname==='cdn.islamic.network' && u.pathname.includes('/quran/audio/')) {event.respondWith((async()=>{const c=await caches.open('tabarjal-quran-audio-personal-v1');try{return await fetch(event.request)}catch(e){return await c.match(event.request)||Response.error()}})());return;}

 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(WEATHER_HOSTS.has(url.hostname)&&url.protocol==='https:'){
  event.respondWith(networkFirstWeather(event));return;
 }
 if(url.origin!==self.location.origin)return; // Radar and map base tiles are never bulk cached.
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>await caches.match(request)||await caches.match('/offline.html')));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(SHELL_CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));}
  return response;
 })));
});
