// Die Suche der Hauptseite (web/src/lib/search.ts, sucheGen) über die Titel des Katalogs. Gleiche Treffermenge; die Reihenfolge ist einfacher:
// Rang (0 Name gleich, 1 beginnt so, 2 alle Wörter im Namen, 3 ungefähr, 4 nur in Studio/Genre/Schlagwort), dann Abstand, dann Name.
// Rein, ohne DOM. `titel.namen` und `titel.weitere` (Originalschrift, Synonyme) sind die Namen, der Rest steht in den Zusatzfeldern.
import { kuerzesterName, normalisiere, ohneWortanfang, tippAbstand, trifftGenau, trifftUngefaehr, woerter } from './suche-text.js'

const FUELLWOERTER = new Set(['von', 'der', 'die', 'das', 'des', 'dem', 'den', 'und', 'ein', 'eine', 'the', 'of', 'and', 'a', 'an', 'no'])
const KOLLATOR = new Intl.Collator('de')
const entferneZeichen = (text) => text.replace(/[^\p{L}\p{N}]+/gu, '')

const namenVon = (titel) => [...titel.namen, ...(titel.weitere ?? [])].filter(Boolean)
const zusatzVon = (titel) => [...namenVon(titel), ...titel.studios, ...titel.genres, ...titel.keywords]

/** Ohne Füllwörter suchen, solange etwas übrig bleibt ("the" allein bleibt Suchwort). */
export function suchwoerterVon(begriff) {
  const alle = woerter(begriff)
  const ohne = alle.filter((w) => !FUELLWOERTER.has(w))
  return ohne.length ? ohne : alle
}

/** Strenge Stufe: Rang 0 bis 2 über die Namen, sonst kein Treffer. */
function strenger(titel, wort) {
  const namen = namenVon(titel)
  const normal = namen.map(normalisiere)
  const kompakt = entferneZeichen(wort.suchwoerter.join('')).length >= 4 ? normal.map(entferneZeichen) : []
  if (normal.includes(wort.ganz) || kompakt.includes(wort.kompakt)) return { rang: 0, abstand: 0 }
  if (normal.some((n) => n.startsWith(wort.ganz)) || kompakt.some((n) => n.startsWith(wort.kompakt))) return { rang: 1, abstand: 0 }
  if (!trifftGenau(wort.suchwoerter, namen)) return null
  return { rang: 2, abstand: ohneWortanfang(wort.suchwoerter, namen) * 1000 + kuerzesterName(wort.suchwoerter, namen) }
}

/** Lockere Stufe für Titel ohne strengen Treffer: Tippfehler im Namen (Rang 3) oder Treffer im Zusatz (Rang 4). */
function lockerer(titel, wort, titelPasst) {
  const imZusatz = trifftGenau(wort.suchwoerter, zusatzVon(titel))
  if (titelPasst && !imZusatz) return null
  if (trifftUngefaehr(wort.suchwoerter, namenVon(titel))) return titelPasst ? null : { rang: 3, abstand: tippAbstand(wort.suchwoerter, namenVon(titel)) }
  return imZusatz ? { rang: 4, abstand: 0 } : null
}

const vergleiche = (a, b) => a.rang - b.rang || a.abstand - b.abstand || KOLLATOR.compare(a.titel.name, b.titel.name)

/** Die Treffer zum Suchbegriff, beste zuerst; ohne Suchwörter alle Titel nach Name. */
export function suche(titel, begriff) {
  const suchwoerter = suchwoerterVon(begriff)
  if (!suchwoerter.length) return [...titel].sort((a, b) => KOLLATOR.compare(a.name, b.name))
  const wort = { suchwoerter, ganz: suchwoerter.join(' '), kompakt: suchwoerter.join('') }
  const streng = titel.map((t) => ({ titel: t, ...strenger(t, wort) })).filter((t) => t.rang !== undefined)
  const gefunden = new Set(streng.map((t) => t.titel))
  const locker = titel.filter((t) => !gefunden.has(t)).map((t) => ({ titel: t, ...lockerer(t, wort, streng.length > 0) })).filter((t) => t.rang !== undefined)
  return [...streng, ...locker].sort(vergleiche).map((t) => t.titel)
}
