// Rechenschritte von "Was gucken?" ohne DOM (aus web/src/lib/empfehlung-reise.ts der Hauptseite): Abzüge beim Start, Rangliste, Ersatz auf der Galerie, Zeilen und Zahlen.
import { einstiegsIndizes, fortschritt, UNTERGRENZE_REST, VORSCHLAEGE, vorschlaege } from './gucken-kern.js'

/** Die Einstiege zu gemerkten Kennungen (auch Kennungen anderer Teile einer Reihe); Unbekanntes fällt weg. */
export const ablageEintraege = (k, ids) => einstiegsIndizes(k, [...ids]).map((i) => k.datei.einstiege[i])

/** Zahl der Plätze, die die Rangliste vorhält: genug Ersatz für "Nein" und "Gesehen" auf der Galerie. */
export const RANGLISTE_LAENGE = 60

/** Alles, was der Nutzer schon kennt: Favoriten, Gesehenes dieser Ansicht und "gesehen bis" (Schlüssel = Kennung). */
export function ausgeschlossenFuerReise(merk) {
  const alle = new Set([...merk.favoriten, ...merk.empfGesehen])
  for (const id of Object.keys(merk.gesehen)) alle.add(Number(id))
  return [...alle]
}

/** Gesehene und verworfene Vorschläge: kommen nie wieder als Vorschlag. */
export const wegVon = (merk) => [...merk.empfVerworfen, ...merk.empfGesehen]

/** Die Rangliste der Vorschläge aus dem Rechenkern. */
export const rangliste = (k, z, weg) => vorschlaege(k, z, { verworfen: weg, anzahl: RANGLISTE_LAENGE })

/** Die ersten Plätze der Galerie. */
export const ersteVorschlaege = (rang) => rang.slice(0, VORSCHLAEGE).map((x) => x.id)

/** Ersetzt `entfernt` durch den nächsten Titel der Rangliste, der noch nicht gezeigt wird; gibt es keinen, rückt die Galerie zusammen. */
export function ersetzeVorschlag(gezeigt, entfernt, rang) {
  const naechster = rang.find((x) => !gezeigt.includes(x.id))
  if (naechster) return gezeigt.map((id) => (id === entfernt ? naechster.id : id))
  return gezeigt.filter((id) => id !== entfernt)
}

export const artWort = (k) => (k.f === 'MOVIE' ? 'Film' : 'Serie')

/** Nummer des laufenden Duells, Ziel, Zahl der Titel und Restmenge (`null`, wenn sie an der Untergrenze klebt: dann nur eine Grenze, kein Messwert). */
export function stand(k, z, ziel) {
  const f = fortschritt(k, z, ziel)
  return { nr: Math.min(f.gewertet + 1, ziel), ziel, gesamt: f.gesamt, rest: f.rest <= UNTERGRENZE_REST ? null : f.rest, fertig: f.fertig }
}

/** Gewertete Duelle, die "Noch vier Duelle – genauer" ergibt: höchstens `max`. */
export const naechstesZiel = (ziel, max) => Math.min(max, ziel + 4)

/** Die Datei ohne Ecchi-Einstiege (Genre-Index aus der Datei selbst), solange Ecchi ausgeblendet ist. */
export function ohneEcchiEinstiege(datei, zeigen) {
  const ecchi = datei.genres.indexOf('Ecchi')
  if (zeigen || ecchi < 0) return datei
  return { ...datei, einstiege: datei.einstiege.filter((k) => !k.g.includes(ecchi)) }
}
