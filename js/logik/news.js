// News: welche Wochen und Tage die Ansicht zeigt, Filter nach Art, die gleichförmigen "auch bei …"-Meldungen. Rein, ohne DOM.
// Hauptseite: web/src/components/NewsView.tsx, web/src/lib/news-gruppen.ts.
import { addiereTage, wocheVon } from './zeit.js'

export const TAGE_SCHRITT = 14
const TAGE_HOECHSTENS = 3650
/** Ab so vielen "auch bei …"-Einträgen an einem Tag werden sie unter einer Zeile eingeklappt. */
export const GLEICH_AB = 4

/** "?art=neu&tage=28": Art-Filter und wie viele Tage zurück (Vorgabe 14, in Schritten von 14). */
export function leseNewsAbfrage(abfrage) {
  const teile = new URLSearchParams(abfrage)
  const tage = Number(teile.get('tage'))
  return { art: teile.get('art') || null, tage: Number.isInteger(tage) && tage > TAGE_SCHRITT && tage <= TAGE_HOECHSTENS ? tage : TAGE_SCHRITT }
}

export function schreibeNewsAbfrage({ art, tage }) {
  const teile = new URLSearchParams()
  if (art) teile.set('art', art)
  if (tage > TAGE_SCHRITT) teile.set('tage', String(tage))
  return teile.toString()
}

export const newsGrenze = (heute, tage) => addiereTage(heute, -tage)

/** Die Wochen des Index, die ab der Grenze Tage enthalten können. */
export const benoetigteWochen = (index, grenze) => index.wochen.filter((woche) => woche >= wocheVon(grenze))

/** Gibt es Älteres als die Grenze: im Index eine frühere Woche oder in den geladenen Tagen ein früherer Tag. */
export const gibtAelteres = (index, tage, grenze) => index.wochen.some((woche) => woche < wocheVon(grenze)) || tage.some((tag) => tag.am < grenze)

/** Ein Eintrag, dessen Meldungen alle nur sagen "jetzt auch bei einem weiteren Anbieter". */
const istGleichmelder = (eintrag) => eintrag.meldungen.length > 0 && eintrag.meldungen.every((m) => m.art === 'neu' && m.weiterer)

/** Trennt die Einträge eines Tages in die, die man liest, und die gleichförmigen; unter GLEICH_AB bleibt alles beisammen. */
export function teileGleichmelder(liste) {
  const gleich = liste.filter(istGleichmelder)
  return gleich.length >= GLEICH_AB ? { normal: liste.filter((e) => !istGleichmelder(e)), gleich } : { normal: liste, gleich: [] }
}

/** Die Tage ab der Grenze, ohne Ecchi (Vorgabe) und, wenn gewählt, nur Einträge mit Meldungen der Art; leere Tage entfallen. */
export function sichtbareTage(tage, { grenze, ecchi }) {
  return tage
    .filter((tag) => tag.am >= grenze)
    .map((tag) => ({ ...tag, eintraege: tag.eintraege.filter((e) => ecchi || !e.ecchi) }))
    .filter((tag) => tag.eintraege.length > 0)
}

export function nachArt(tage, art) {
  if (!art) return tage
  return tage.map((tag) => ({ ...tag, eintraege: tag.eintraege.filter((e) => e.meldungen.some((m) => m.art === art)) })).filter((tag) => tag.eintraege.length > 0)
}

/** Wie oft jede Art vorkommt (Beschriftung aus den Daten): die Filterleiste zeigt nur, was es gibt. */
export function zaehleArten(tage) {
  const arten = new Map()
  for (const m of tage.flatMap((tag) => tag.eintraege.flatMap((e) => e.meldungen))) {
    const alt = arten.get(m.art) ?? { art: m.art, label: m.label, zahl: 0 }
    arten.set(m.art, { ...alt, zahl: alt.zahl + 1 })
  }
  return [...arten.values()].sort((a, b) => b.zahl - a.zahl)
}
