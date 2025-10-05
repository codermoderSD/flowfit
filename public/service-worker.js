const CACHE_NAME = "flowfit-v1";
const urlsToCache = ["/", "/manifest.json", "/icon-192.jpg", "/icon-512.jpg"];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching resources");
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked");
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push notifications
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push received');
  
  if (!event.data) {
    console.log('[Service Worker] Push event has no data');
    return;
  }

  const payload = event.data.json();
  console.log('[Service Worker] Push payload:', payload);
  
  const { body, icon, image, badge, url, title } = payload;
  const notificationTitle = title ?? 'FlowFit';
  const notificationOptions = {
    body: body ?? 'Time to move!',
    icon: icon ?? '/icon-192.jpg',
    badge: badge ?? '/icon-192.jpg',
    image,
    data: {
      url: url ?? '/',
    },
    requireInteraction: false,
    tag: 'flowfit-notification',
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[Service Worker] Notification displayed');
      })
      .catch(err => {
        console.error('[Service Worker] Error showing notification:', err);
      })
  );
});
