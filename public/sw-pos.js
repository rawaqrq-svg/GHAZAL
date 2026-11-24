/**
 * Ghazal POS - Offline Service Worker (PWA)
 * Keeps the POS cashier interface operational even without internet connection.
 */

const CACHE_NAME = 'ghazal-pos-cache-v1';

// Essential assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/pos/cashier',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache error (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name.startsWith('ghazal-pos-cache')) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API routes, heartbeat, downloads, and Supabase calls
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase')
  ) {
    return;
  }

  // 1. Static Next.js assets (_next/static, images, fonts) -> Cache First with Network Revalidation
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. POS Navigation requests (/pos/cashier) -> Network First with Offline Cache Fallback
  if (request.mode === 'navigate' || url.pathname.startsWith('/pos/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const cashierFallback = await caches.match('/pos/cashier');
          if (cashierFallback) {
            return cashierFallback;
          }
          return new Response(
            `<!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>كاشير غزل - وضع دون اتصال</title>
              <style>
                body { background: #18181b; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                .box { max-width: 420px; padding: 2rem; background: #27272a; border-radius: 1.5rem; border: 1px solid #3f3f46; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #f43f5e; }
                p { color: #a1a1aa; font-size: 0.95rem; line-height: 1.5; }
                button { background: #e11d48; color: #fff; border: none; padding: 0.75rem 1.5rem; font-size: 1rem; font-weight: bold; border-radius: 0.75rem; cursor: pointer; margin-top: 1rem; width: 100%; }
                button:hover { background: #be123c; }
              </style>
            </head>
            <body>
              <div class="box">
                <h1>غزل POS - انقطاع الاتصال</h1>
                <p>تم حفظ جميع بيانات الكاشير والأصناف محلياً. يرجى الضغط على الزر أدناه لإعادة فتح شاشة الكاشير والمتابعة بدون توقف.</p>
                <button onclick="window.location.reload()">إعادة فتح شاشة الكاشير</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
  }
});
