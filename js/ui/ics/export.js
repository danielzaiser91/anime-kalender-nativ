// Favoriten als Kalenderdatei (wird erst beim Klick geladen): Termine ab heute aus den Titelbausteinen, als Datei-Download.
import { h } from '../dom.js'
import { baueIcs } from '../../logik/ics.js'
import { gruppeVonAk } from '../../logik/titel.js'
import { heuteInBerlin } from '../../logik/zeit.js'

function ladeHerunter(name, text) {
  const adresse = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }))
  const link = h('a', { href: adresse, download: name })
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(adresse)
}

async function favoritenTermine({ store, lader, jetzt }) {
  const heute = heuteInBerlin(jetzt())
  const kennungen = [...store.lies().merk.favoriten].map(String)
  const gruppen = await Promise.all([...new Set(kennungen.map(gruppeVonAk))].map(lader.ladeTitelGruppe))
  const bausteine = kennungen.flatMap((ak) => gruppen.map((g) => g.titel[ak]).filter(Boolean))
  return bausteine.flatMap((b) => b.termine.filter((t) => t.date >= heute).map((termin) => ({ ak: b.ak, termin })))
}

/** Lädt die Datei herunter und nennt die Zahl der Termine; ohne Favoriten oder Termine entsteht keine Datei (Antwort 0). */
export async function exportiereFavoriten(abhaengigkeiten) {
  const eintraege = await favoritenTermine(abhaengigkeiten)
  if (eintraege.length) ladeHerunter('anime-kalender-favoriten.ics', baueIcs(eintraege))
  return eintraege.length
}
