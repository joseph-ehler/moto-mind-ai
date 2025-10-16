// KILL SWITCH - This service worker unregisters itself immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      console.log('[SW] Self-destructed successfully')
      return self.clients.matchAll()
    }).then((clients) => {
      clients.forEach(client => client.navigate(client.url))
    })
  )
})
