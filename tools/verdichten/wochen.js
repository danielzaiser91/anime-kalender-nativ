// Teilt die Termine in Wochendateien und legt je Woche nur die Titel ab, die darin vorkommen.
import { verschiebeWoche, wocheVon } from '../../js/logik/zeit.js'

export const SCHEMA = 1

// Der Termin behält, was die Anzeige braucht; Fachwerte bleiben unverändert (Uhrzeit, Folge, Marken).
const FELDER = ['titleId', 'name', 'date', 'time', 'platform', 'sender', 'releaseType', 'episode', 'episodeCount', 'episodeCountAssumed', 'timeEstimated', 'estimated', 'sichtung', 'katalog', 'staffelstart', 'staffelfinale', 'imAngebot']

export function kuerzeTermin(termin) {
  const kurz = {}
  for (const feld of FELDER) if (termin[feld] !== undefined) kurz[feld] = termin[feld]
  return kurz
}

// TMDB liefert Bilder in festen Breiten; die Kachel ist 56 px breit, 185 genügt auch für 3-fache Dichte.
export const kleinesCover = (url) => (typeof url === 'string' && url.startsWith('https://') ? url.replace('/t/p/w500/', '/t/p/w185/') : null)

export function baueTitelKarte({ titel, kennungen }) {
  const ak = new Map(kennungen.titel.map((z) => [z[1], z[3] ?? z[0]]))
  return new Map(titel.map((t) => [t.id, { cover: kleinesCover(t.coverImage), ak: ak.get(t.id) ?? null }]))
}

function titelDerWoche(termine, karte) {
  const titel = {}
  for (const t of termine) titel[t.titleId] = karte.get(t.titleId) ?? { cover: null, ak: null }
  return titel
}

/** Von der ersten Woche mit Terminen bis zur letzten, mindestens aber bis vier Wochen nach dem Bauzeitpunkt. */
export function wochenBereich(events, bauMs) {
  const daten = events.map((e) => e.date).sort()
  const bis = [wocheVon(daten.at(-1)), verschiebeWoche(wocheVon(new Date(bauMs).toISOString().slice(0, 10)), 4)].sort().at(-1)
  return { von: wocheVon(daten[0]), bis }
}

export function baueWochen(events, karte, bereich) {
  const nachWoche = Map.groupBy(events, (e) => wocheVon(e.date))
  const wochen = new Map()
  for (let w = bereich.von; w <= bereich.bis; w = verschiebeWoche(w, 1)) {
    const termine = (nachWoche.get(w) ?? []).map(kuerzeTermin)
    wochen.set(w, { schema: SCHEMA, woche: w, titel: titelDerWoche(termine, karte), termine })
  }
  return wochen
}
