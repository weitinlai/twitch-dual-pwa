// Service Worker 版本號
const CACHE_VERSION = 'v1.6.2';
const CACHE_NAME = `twitch-pwa-${CACHE_VERSION}`;

// 需要快取的檔案列表
const CACHE_FILES = [
  '/twitch-dual-pwa/',
  '/twitch-dual-pwa/index.html',
  '/twitch-dual-pwa/manifest.json',
  '/twitch-dual-pwa/icon-192.png',
  '/twitch-dual-pwa/icon-512.png',
  '/twitch-dual-pwa/service-worker.js'
];

// 安裝事件 - 快取檔案
self.addEventListener('install', e => {
  console.log(`[SW] Installing new version: ${CACHE_VERSION}`);
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log(`[SW] Caching files for version: ${CACHE_VERSION}`);
      return cache.addAll(CACHE_FILES);
    }).then(() => {
      // 強制激活新的 service worker
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理舊快取
self.addEventListener('activate', e => {
  console.log(`[SW] Activating new version: ${CACHE_VERSION}`);
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 刪除舊版本的快取
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 立即控制所有頁面
      return self.clients.claim();
    })
  );
});

// 攔截網路請求
self.addEventListener('fetch', e => {
  // 只處理 GET 請求
  if (e.request.method !== 'GET') return;

  // 跳過非 HTTP/HTTPS 請求
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then(response => {
      // 如果快取中有回應，返回快取的回應
      if (response) {
        console.log(`[SW] Serving from cache: ${e.request.url}`);
        return response;
      }

      // 否則從網路獲取
      console.log(`[SW] Fetching from network: ${e.request.url}`);
      return fetch(e.request).then(response => {
        // 檢查回應是否有效
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 複製回應以快取
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache);
        });

        return response;
      }).catch(error => {
        console.log(`[SW] Fetch failed: ${e.request.url}`, error);
        // 如果是 HTML 頁面請求失敗，返回快取的首頁
        if (e.request.destination === 'document') {
          return caches.match('/twitch-dual-pwa/index.html');
        }
      });
    })
  );
});

// 處理背景同步 (如果支援)
self.addEventListener('sync', e => {
  console.log(`[SW] Background sync: ${e.tag}`);
});

// 處理推送通知 (如果支援)
self.addEventListener('push', e => {
  console.log('[SW] Push notification received');
  // 這裡可以添加推送通知處理邏輯
});
