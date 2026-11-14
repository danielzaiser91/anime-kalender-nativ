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

/** Behält nur die jüngsten `grenze` Einträge; keys() liefert die Reihenfolge des Hineinlegens, ein neu geholter Eintrag steht dank delete vor put hinten. */
async function kuerze({ cache, grenze }) {
  const schluessel = await cache.keys()
  await Promise.all(schluessel.slice(0, Math.max(0, schluessel.length - grenze)).map((s) => cache.delete(s)))
}

/** 2xx wird gelegt; 4xx (Datei gewollt weg) entfernt den alten Stand; ein Serverfehler lässt ihn stehen. */
async function holeVomNetz(anfrage, ziel) {
  const antwort = await fetch(anfrage.url, { cache: 'no-cache' })
  if (antwort.ok) {
    await ziel.cache.delete(anfrage)
    await ziel.cache.put(anfrage, antwort.clone())
    await kuerze(ziel)
  } else if (antwort.status < 500) {
    await ziel.cache.delete(anfrage)
  }
  return antwort
}

const warte = (ms, wert) => new Promise((fertig) => setTimeout(() => fertig(wert), ms))

/** Mit Stand im Cache: Netz, aber nach FRIST_MS, bei Fehler oder Serverfehler (ab 500) der Cache; 4xx gilt (Datei ist weg). Ohne Stand: nur das Netz. */
async function netzZuerst(anfrage, ziel, alt) {
  const netz = holeVomNetz(anfrage, ziel)
  if (!alt) return netz
  const antwort = await Promise.race([netz.catch(() => alt), warte(FRIST_MS, alt)])
  return antwort.status < 500 && antwort.status > 0 ? antwort : alt
}

async function antworte(anfrage) {
  const daten = new URL(anfrage.url).pathname.includes('/data/')
  const ziel = { cache: await caches.open(daten ? DATEN : HUELLE), grenze: daten ? MAX_DATEN : Infinity }
  const { cache } = ziel
  const alt = (await cache.match(anfrage)) ?? (anfrage.mode === 'navigate' ? await cache.match(self.registration.scope) : undefined)
  try {
    return await netzZuerst(anfrage, ziel, alt)
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
