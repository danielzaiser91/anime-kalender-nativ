// Handlung im Panel: Kürzung, Quellenname und die Hinweise über dem Text (Hauptseite: abschnitte.tsx, hilfen.tsx).
import { erscheintErst } from './start.js'

export const VORSCHAU_ZEICHEN = 200

/** Zuerst zwei Sätze, den Rest auf Wunsch. */
export const kuerzeHandlung = (text, offen) => (offen || text.length <= VORSCHAU_ZEICHEN ? text : `${text.slice(0, VORSCHAU_ZEICHEN).trimEnd()} …`)

export const brauchtMehrKnopf = (text) => text.length > VORSCHAU_ZEICHEN

/** Anbietername wie auf der Quelle selbst: aus der Adresse („anisearch.de“) wird „aniSearch“. */
export const quelleName = (name) => (name === 'anisearch.de' ? 'aniSearch' : name === 'anilist.co' ? 'AniList' : name)

/** Der Hinweis über einem geliehenen Text: noch nicht erschienen, oder keine eigene Handlung; ohne `von` keiner. */
export function ersatzHinweis(plot, titel, heute) {
  if (!plot.von) return null
  const gestartet = !erscheintErst(titel, heute)
  return gestartet ? `Zu diesem Teil gibt es keine eigene Handlung — hier steht die von „${plot.von}".` : `Noch nicht erschienen — hier steht die Handlung von „${plot.von}".`
}

/** Ein eigener Text, der nur die Reihe beschreibt, trägt den Hinweis „Zur Reihe“. */
export const gilltFuerReihe = (plot) => Boolean(plot.eigen?.reihe) && !plot.von
