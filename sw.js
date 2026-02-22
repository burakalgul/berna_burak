// Service Worker for PWA - Offline Support
const CACHE_NAME = 'berna-burak-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './favicon.svg',
  './berna.gif',
  './burak.gif',
  './dilerimki.mp3',
  './achievements.js',
  './boss-mechanics.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache files individually to avoid failures
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
            });
          })
        );
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-http(s) requests (chrome-extension, data:, blob:, etc.)
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  
  // Skip chrome extension requests
  if (event.request.url.includes('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Skip caching for non-http(s) responses
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              // Only cache http(s) requests
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, responseToCache).catch(err => {
                  console.log('Cache put failed:', err);
                });
              }
            });
          
          return response;
        }).catch((error) => {
          // Network request failed, return a fallback if available
          console.log('Fetch failed for:', event.request.url);
          return caches.match('./index.html');
        });
      }).catch((error) => {
        console.log('Cache match failed:', error);
        return fetch(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
