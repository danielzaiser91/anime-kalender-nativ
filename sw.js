// Service Worker: Die Hülle (HTML, CSS, JS laut huelle.json) liegt nach dem Installieren komplett im Cache. Für alles Eigene gilt
// "Netz zuerst, Cache als Rückfall"; bei langsamem Netz zählt nach FRIST_MS der Cache. Fremde Adressen (Cover) fasst er nicht an.
const HUELLE = 'huelle'
const DATEN = 'daten'
const MAX_DATEN = 150
const FRIST_MS = 4000

async function legeHuelle() {
  const antwort = await fetch('huelle.json', { cache: 'reload' })
  const { dateien } = await antwort.json()
  const cache = await caches.open(HUELLE)
  await cache.addAll(dateien.map((pfad) => new Request(pfad, { cache: 'reload' })))
}

/** Behält nur die jüngsten Datendateien; keys() liefert die Reihenfolge des Hineinlegens. */
async function kuerzeDaten(cache) {
  const schluessel = await cache.keys()
  await Promise.all(schluessel.slice(0, Math.max(0, schluessel.length - MAX_DATEN)).map((s) => cache.delete(s)))
}

async function holeVomNetz(anfrage, cache) {
  const antwort = await fetch(anfrage.url, { cache: 'no-cache' })
  if (antwort.ok) {
    await cache.put(anfrage, antwort.clone())
    await kuerzeDaten(cache)
  }
  return antwort
}

const warte = (ms, wert) => new Promise((fertig) => setTimeout(() => fertig(wert), ms))

/** Mit Stand im Cache: Netz, aber nach FRIST_MS oder bei Fehler/Serverfehler der Cache. Ohne Stand: nur das Netz. */
async function netzZuerst(anfrage, cache, alt) {
  const netz = holeVomNetz(anfrage, cache)
  if (!alt) return netz
  const antwort = await Promise.race([netz.catch(() => alt), warte(FRIST_MS, alt)])
  return antwort.ok ? antwort : alt
}

async function antworte(anfrage) {
  const ziel = new URL(anfrage.url)
  const cache = await caches.open(ziel.pathname.includes('/data/') ? DATEN : HUELLE)
  const alt = (await cache.match(anfrage)) ?? (anfrage.mode === 'navigate' ? await cache.match(self.registration.scope) : undefined)
  try {
    return await netzZuerst(anfrage, cache, alt)
  } catch {
    return Response.error()
  }
}

self.addEventListener('install', (ereignis) => ereignis.waitUntil(legeHuelle().then(() => self.skipWaiting())))
self.addEventListener('activate', (ereignis) => ereignis.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (ereignis) => {
  const { request } = ereignis
  if (request.method === 'GET' && new URL(request.url).origin === self.location.origin) ereignis.respondWith(antworte(request))
})
