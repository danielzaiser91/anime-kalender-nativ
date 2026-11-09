// Monatsrechnung "JJJJ-MM" auf Basis von zeit.js. Rein, ohne DOM.
import { addiereTage, tageDerWoche, verschiebeWoche, wocheVon } from './zeit.js'

export const istMonatsschluessel = (text) => /^\d{4}-(0[1-9]|1[0-2])$/.test(text)

export const monatVon = (datum) => datum.slice(0, 7)

const ersterTag = (monat) => `${monat}-01`

export function verschiebeMonat(monat, n) {
  const index = Number(monat.slice(0, 4)) * 12 + Number(monat.slice(5)) - 1 + n
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

const letzterTag = (monat) => addiereTage(ersterTag(verschiebeMonat(monat, 1)), -1)

/** Die Wochen, die der Monat berührt: von der Woche des Ersten bis zur Woche des Letzten. */
export function wochenDesMonats(monat) {
  const ende = wocheVon(letzterTag(monat))
  const wochen = []
  for (let woche = wocheVon(ersterTag(monat)); woche <= ende; woche = verschiebeWoche(woche, 1)) wochen.push(woche)
  return wochen
}

/** Das Raster Montag bis Sonntag, je Woche eine Zeile; Tage der Nachbarmonate sind markiert. */
export const monatsraster = (monat) => wochenDesMonats(monat).map((woche) => tageDerWoche(woche).map((datum) => ({ datum, imMonat: monatVon(datum) === monat })))
