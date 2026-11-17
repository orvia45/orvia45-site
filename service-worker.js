'use strict';
const CACHE_NAME = 'orvia45-shell-v3';
const APP_SHELL = [
  '/', '/index.html', '/style.css', '/orvia45-theme.css', '/splash.js', '/app.js',
  '/support-links.js', '/home-records.js', '/password-toggle.js',
  '/manifest.webmanifest', '/icons/orvia45-192.png', '/icons/orvia45-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => (key.startsWith('smile-shell-') || key.startsWith('orvia45-shell-')) && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy)); }
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)); }
      return response;
    }).catch(() => caches.match(request)));
  }
});
