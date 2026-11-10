// Quellenübersicht je Titel, gerechnet wie auf der Hauptseite (Quellenuebersicht.tsx): eine Zeile je Quelle, dazu was sie liefert.
// Zeile: [Name, Adresse oder null, Zahl der Belege, Liefert-Kürzel]; die Kürzel übersetzt die Oberfläche (t Termine, o Originaltermine, w Werk, d Deutsch, s Stimmen, f FSK).
const ANZEIGENAME = { 'anisearch.de': 'aniSearch', 'anisearch.com': 'aniSearch', 'anilist.co': 'AniList', 'animenewsnetwork.com': 'Anime News Network' }
const HOST_NAMEN = { 'gw.api.animationdigitalnetwork.com': 'ADN API' }
const EIGENE_ID_BASIS = 5_000_000
const EIGENE_ID_ENDE = 6_000_000
const NAME_ORIGINAL = 'TMDB'

const API_HOST = /(?:^|\.)(?:api|graphql)\./i
const API_PFAD = /\/api\/|graphql|\.json$/i

/** Eine Adresse, die ein Besucher öffnen kann: http(s), keine API. */
function istLink(url) {
  try {
    const adresse = new URL(url)
    return /^https?:$/.test(adresse.protocol) && !API_HOST.test(adresse.hostname) && !API_PFAD.test(adresse.pathname)
  } catch {
    return false
  }
}

function hostVon(url) {
  try {
    const adresse = new URL(url)
    const host = adresse.host.replace(/^www\./, '')
    if (host === 'crunchyroll.com' && /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?news\//i.test(adresse.pathname)) return 'Crunchyroll News'
    return HOST_NAMEN[host] ?? host
  } catch {
    return url
  }
}

/** Je Host eine Zeile mit der Zahl der Belege; die Adresse nur, wenn sie ein Besucher öffnen kann. */
function terminQuellen(releases) {
  const je = new Map()
  for (const r of releases) {
    const original = r.schedule?.nachOriginalQuelle ? [{ url: r.schedule.nachOriginalQuelle, name: NAME_ORIGINAL }] : []
    for (const q of [...(r.quellen ?? r.sources.map((url) => ({ url, name: hostVon(url) }))), ...original]) {
      const host = q.name || hostVon(q.url)
      const da = je.get(host)
      if (da) da.anzahl++
      else je.set(host, { host, url: istLink(q.url) ? q.url : null, anzahl: 1 })
    }
  }
  return [...je.values()].map((q) => [ANZEIGENAME[q.host] ?? q.host, q.url, q.anzahl, [q.host === NAME_ORIGINAL ? 'o' : 't']])
}

/** aniSearch-Adresse mit Slug aus der eigenen Handlung des Titels, sonst die der Datei, sonst die Kennung. */
const aniSearchAdresse = (titel, handlung) => {
  const eigene = handlung?.de && handlung.deSource?.url?.includes('anisearch.de/anime/') ? handlung.deSource.url : handlung?.asUrl
  return eigene ?? (titel.anisearchId ? `https://www.anisearch.de/anime/${titel.anisearchId}` : null)
}

function eigeneZeilen(titel, handlung) {
  const zeilen = []
  if (titel.id < EIGENE_ID_BASIS || titel.id >= EIGENE_ID_ENDE) zeilen.push(['AniList', `https://anilist.co/anime/${titel.id}`, 0, ['w']])
  if (titel.titleDe) zeilen.push(['aniSearch', aniSearchAdresse(titel, handlung), 0, ['d']])
  if (titel.hasVoices) zeilen.push(['Anime News Network', titel.annId ? `https://www.animenewsnetwork.com/encyclopedia/anime.php?id=${titel.annId}` : null, 0, ['s']])
  if (titel.fsk !== undefined) zeilen.push(['FSK', null, 0, ['f']])
  return zeilen
}

/** Gleicher Name, eine Zeile: die erste Adresse gewinnt, Belege werden gezählt, Kürzel vereinigt. */
export function fuegeQuellenZusammen(zeilen) {
  const nachName = new Map()
  for (const [name, url, anzahl, liefert] of zeilen) {
    const da = nachName.get(name)
    if (!da) nachName.set(name, [name, url, anzahl, [...liefert]])
    else {
      da[1] ??= url
      da[2] += anzahl
      for (const k of liefert) if (!da[3].includes(k)) da[3].push(k)
    }
  }
  return [...nachName.values()]
}

export function baueQuellen(titel, releases, handlung) {
  return fuegeQuellenZusammen([...terminQuellen(releases), ...eigeneZeilen(titel, handlung)])
}
