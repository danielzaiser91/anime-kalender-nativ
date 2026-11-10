// Namen und Auswahl der Filter für die Oberfläche: Überschrift je Liste, Anzeigename je Wert, die Werte mit Titelzahl. Rein, ohne DOM.
import { anbieterName } from './folge.js'
import { FESTE_WERTE, werteVon } from './filter.js'

export const LISTEN_NAMEN = {
  p: 'Plattform',
  anb: 'Bezugsquelle',
  rt: 'Art',
  st: 'Status',
  fsk: 'FSK',
  y: 'Jahr',
  g: 'Genre',
  kw: 'Schlagwort',
  sp: 'Sprecher',
  her: 'Herkunft',
}

const WERT_NAMEN = {
  rt: { weekly: 'Wöchentlich', batch: 'Katalog', movie: 'Film', disc: 'DVD / Blu-ray' },
  st: { airing: 'Läuft', tba: 'TBA', abgeschlossen: 'Abgeschlossen', erschienen: 'Erschienen', unbekannt: 'Termin unbekannt' },
  her: { JP: 'Japan', KR: 'Südkorea', CN: 'China', TW: 'Taiwan', US: 'USA & Co.', XX: 'Unbekannt' },
}

/** Der Name eines Werts: Anbieter und Plattformen wie in der Wochenansicht, FSK als "ab n", der Rest ist selbst der Name. */
export function wertName(liste, wert) {
  if (liste === 'p') return anbieterName(wert)
  if (liste === 'fsk') return `ab ${wert}`
  return WERT_NAMEN[liste]?.[wert] ?? String(wert)
}

/** Die Werte einer Liste mit der Zahl der Titel, die ihn haben; feste Listen in fester Reihenfolge, sonst nach Zahl (Jahre: neueste zuerst). */
export function optionen(titel, liste) {
  const zahlen = new Map()
  for (const t of titel) for (const wert of new Set(werteVon(t, liste))) zahlen.set(wert, (zahlen.get(wert) ?? 0) + 1)
  if (FESTE_WERTE[liste]) return FESTE_WERTE[liste].map((wert) => ({ wert, zahl: zahlen.get(wert) ?? 0 }))
  const nachWert = liste === 'y' ? (a, b) => b[0] - a[0] : (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'de')
  return [...zahlen].sort(nachWert).map(([wert, zahl]) => ({ wert, zahl }))
}

const FORMATE = { TV: 'Serie', MOVIE: 'Film', OVA: 'OVA', SPECIAL: 'Special', ONA: 'ONA', TV_SHORT: 'Kurzserie', MUSIC: 'Musik' }

/** Eine Zeile unter dem Titel: Format, japanisches Startjahr, Status. */
export const metaText = (t) => [FORMATE[t.format] ?? t.format, t.jahr, wertName('st', t.status)].filter(Boolean).join(' · ')
