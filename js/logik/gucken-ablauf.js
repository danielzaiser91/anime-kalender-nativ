// Ablauf von "Was gucken?" als reine Zustandsübergänge (aus web/src/lib/empfehlung-ablauf.ts der Hauptseite): Einleitung → Duelle → fünf Vorschläge.
// Zustand: { phase: 'start' | 'duell' | 'ergebnis', kontext, sitzung, ziel, gezeigt (Kennungen der Galerie) }.
import { antworteSitzung, DUELLE_MAX, DUELLE_START, istFertig, neueSitzung, neuerZustand, zurueck } from './gucken-kern.js'
import { ersetzeVorschlag, ersteVorschlaege, naechstesZiel, rangliste } from './gucken-reise.js'

/** "Los geht's" und "Von vorn": neue Sitzung mit den Abzügen; die Galerie des letzten Ergebnisses bleibt, bis das nächste kommt. */
export function neueReise(g, { kontext, startwert, ausgeschlossen, weg }) {
  const sitzung = neueSitzung(neuerZustand(kontext, startwert, ausgeschlossen))
  return naechsterSchritt({ ...g, phase: 'duell', kontext, sitzung, ziel: DUELLE_START, gezeigt: g?.gezeigt ?? [] }, weg)
}

/** Ist das Ziel erreicht oder gibt es kein Paar mehr (auch gleich nach dem Start, wenn fast alles abgezogen ist), zeigt die Galerie die ersten Plätze der Rangliste. */
function naechsterSchritt(g, weg) {
  if (!istFertig(g.kontext, g.sitzung.zustand, g.ziel)) return g
  return { ...g, phase: 'ergebnis', gezeigt: ersteVorschlaege(rangliste(g.kontext, g.sitzung.zustand, weg)) }
}

/** Antwort ('A', 'B', 'N') auf das Paar. */
export function antworten(g, { antwort, weg }) {
  return naechsterSchritt({ ...g, sitzung: antworteSitzung(g.kontext, g.sitzung, antwort) }, weg)
}

/** Ein Duell zurück; am Anfang bleibt alles. */
export const duellZurueck = (g) => ({ ...g, sitzung: zurueck(g.sitzung) })

/** "Noch vier Duelle – genauer": Ziel hoch (höchstens 10), zurück ins Duell. */
export const genauerMachen = (g) => ({ ...g, ziel: naechstesZiel(g.ziel, DUELLE_MAX), phase: 'duell' })

/** Ob "genauer" noch etwas bringt: noch nicht 10 gewertete Duelle und noch ein Paar da. */
export const kannGenauer = (g) => !istFertig(g.kontext, g.sitzung.zustand, DUELLE_MAX)

/** "Nein" oder "Gesehen" auf der Galerie: der Titel geht, der nächste der Rangliste rückt an seine Stelle (`weg` schließt ihn schon ein). */
export function entfernen(g, { id, weg }) {
  return { ...g, gezeigt: ersetzeVorschlag(g.gezeigt, id, rangliste(g.kontext, g.sitzung.zustand, weg)) }
}
