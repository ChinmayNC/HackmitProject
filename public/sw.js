const CACHE_NAME = "lock-in-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192.jpg", "/icon-512.jpg"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    }),
  )
})

// Handle background sync for session data
self.addEventListener("sync", (event) => {
  if (event.tag === "session-backup") {
    event.waitUntil(backupSessionData())
  }
})

async function backupSessionData() {
  // In production, sync session data to server
  console.log("Backing up session data...")
}
