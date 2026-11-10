// Filter des Katalogs, nachgebaut aus web/src/lib/filters.ts (passtTitel) der Hauptseite: 10 Listen, je Einschluss ("mit") und Ausschluss ("ohne"),
// dazu drei Schnellfilter mit eigenem Feld (fav, frei, wo). Cartoon, Disc und TV sind Werte der Listen kw, rt und p. Rein, ohne DOM.
import { istFavorit } from './merken.js'

/** Die Listen in der Reihenfolge der Adresse (Kurznamen wie auf der Hauptseite). */
export const LISTEN = ['p', 'anb', 'rt', 'st', 'fsk', 'y', 'g', 'kw', 'sp', 'her']
export const SCHNELL_FELDER = ['fav', 'frei', 'wo']
export const CARTOON = 'Cartoon'
// Listen mit festem Wertebereich, in der Reihenfolge der Anzeige; ein unbekannter Wert in der Adresse fällt weg.
export const FESTE_WERTE = {
  rt: ['weekly', 'batch', 'movie', 'disc'],
  st: ['airing', 'tba', 'abgeschlossen', 'erschienen', 'unbekannt'],
  fsk: [0, 6, 12, 16, 18],
  her: ['JP', 'KR', 'CN', 'TW', 'US', 'XX'],
}
// Wer mehrere Werte wählt: Genre und Schlagwort verlangen alle, die übrigen eines davon.
const UND = new Set(['g', 'kw'])
const ZAHLEN = new Set(['fsk', 'y'])

export const leerListen = () => Object.fromEntries(LISTEN.map((liste) => [liste, []]))
// `offen` ist die Liste, deren Werte gerade gezeigt werden (nur Anzeige, wirkt nicht auf die Treffer).
export const leererFilter = () => ({ q: '', mit: leerListen(), ohne: leerListen(), schnell: {}, offen: '' })
export const istZahlenListe = (liste) => ZAHLEN.has(liste)

/** Die Werte, die ein Titel in einer Liste hat; "Film" zählt auch für ein Filmwerk ohne Termin. */
const WERTE = {
  p: (t) => t.plattformen,
  anb: (t) => t.anbieter,
  rt: (t) => (t.format === 'MOVIE' ? [...t.arten, 'movie'] : t.arten),
  st: (t) => [t.status],
  fsk: (t) => (t.fsk == null ? [] : [t.fsk]),
  y: (t) => t.jahre,
  g: (t) => t.genres,
  kw: (t) => t.keywords,
  her: (t) => [t.herkunft],
}

/** Die Werte eines Titels in einer Liste (Sprecher stehen nicht am Titel). */
export const werteVon = (t, liste) => WERTE[liste]?.(t) ?? []

/** Sprecher wirken über Titel-IDs (`auswahl.mit`: mindestens einer der Gewählten, `auswahl.ohne`: keiner der Ausgeschlossenen). */
const passtSprecher = (t, auswahl) => (!auswahl.mit || auswahl.mit.has(t.id)) && !auswahl.ohne?.has(t.id)

function passtSchnell(t, f, favoriten) {
  const urteile = { fav: istFavorit({ favoriten }, t.ak), frei: Boolean(t.kostenlos), wo: Boolean(t.stream) }
  return SCHNELL_FELDER.every((feld) => !f.schnell[feld] || (f.schnell[feld] === 'ja') === urteile[feld])
}

function passtListen(t, f) {
  for (const liste of LISTEN) {
    if (!WERTE[liste]) continue
    const werte = WERTE[liste](t)
    if (f.ohne[liste].some((w) => werte.includes(w))) return false
    const gewaehlt = f.mit[liste]
    if (gewaehlt.length && !(UND.has(liste) ? gewaehlt.every((w) => werte.includes(w)) : gewaehlt.some((w) => werte.includes(w)))) return false
  }
  return true
}

/** Passt der Titel zu allen Filtern (ohne den Suchbegriff)? `umfeld`: `favoriten` (Set der Kennungen) und `sprecher` (Auswahl der IDs oder undefined). */
export function passt(t, f, umfeld) {
  if (umfeld.sprecher && !passtSprecher(t, umfeld.sprecher)) return false
  return passtSchnell(t, f, umfeld.favoriten) && passtListen(t, f)
}

/** Ecchi-Titel bleiben weg, bis der Nutzer sie zeigt; das Genre ist dann auch als Filterwert unbekannt (wie auf der Hauptseite). */
export function mitEcchiWahl(titel, f, ecchi) {
  if (ecchi) return { titel, filter: f }
  return { titel: sichtbareTitel(titel, false), filter: { ...f, mit: { ...f.mit, g: f.mit.g.filter((g) => g !== 'Ecchi') } } }
}

/** Die Titel, die der Nutzer sieht: ohne Ecchi, solange er sie nicht zeigt. */
export const sichtbareTitel = (titel, ecchi) => (ecchi ? titel : titel.filter((t) => !t.genres.includes('Ecchi')))

/** Die Auswahl aus den gewählten Sprechern: `idsVon(name)` liefert ihre Titel-IDs. */
export function sprecherAuswahl(f, idsVon) {
  const vereinige = (namen) => new Set(namen.flatMap(idsVon))
  if (!f.mit.sp.length && !f.ohne.sp.length) return undefined
  return { mit: f.mit.sp.length ? vereinige(f.mit.sp) : undefined, ohne: f.ohne.sp.length ? vereinige(f.ohne.sp) : undefined }
}

/** Der Katalog zu Suche und Filter: erst filtern, dann suchen. */
export function filtere(katalog, f, umfeld) {
  const { titel, filter } = mitEcchiWahl(katalog, f, umfeld.ecchi)
  return titel.filter((t) => passt(t, filter, umfeld))
}

/** Wie viele Wahlen gesetzt sind (ohne den Suchbegriff). */
export const zaehleWahlen = (f) => LISTEN.reduce((n, liste) => n + f.mit[liste].length + f.ohne[liste].length, 0) + SCHNELL_FELDER.filter((feld) => f.schnell[feld]).length
