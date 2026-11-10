// Der Filter in der Adresse ("#/suche?q=naruto&g=Action&xkw=Cartoon&fav=1"): Namen wie auf der Hauptseite, Ausschluss mit "x" davor.
// Schnellfilter fav, frei, wo: 1 = nur das, 0 = das ausblenden; f = die gerade geöffnete Liste. Rein, ohne DOM.
import { FESTE_WERTE, istZahlenListe, leererFilter, LISTEN, SCHNELL_FELDER } from './filter.js'

function leseListe(abfrage, name, liste) {
  const roh = abfrage.getAll(name).join(',').split(',').filter(Boolean)
  const werte = [...new Set(istZahlenListe(liste) ? roh.map(Number).filter(Number.isInteger) : roh)]
  return FESTE_WERTE[liste] ? werte.filter((w) => FESTE_WERTE[liste].includes(w)) : werte
}

/** Der Filter zur Abfragezeichenkette (ohne "?"). */
export function leseFilter(text) {
  const abfrage = new URLSearchParams(text)
  const filter = { ...leererFilter(), q: abfrage.get('q') ?? '', offen: LISTEN.find((liste) => liste === abfrage.get('f')) ?? '' }
  for (const liste of LISTEN) {
    filter.mit[liste] = leseListe(abfrage, liste, liste)
    filter.ohne[liste] = leseListe(abfrage, `x${liste}`, liste)
  }
  for (const feld of SCHNELL_FELDER) if (['1', '0'].includes(abfrage.get(feld))) filter.schnell[feld] = abfrage.get(feld) === '1' ? 'ja' : 'nein'
  return filter
}

/** Die Abfragezeichenkette zum Filter; gleiche Filter ergeben dieselbe Zeichenkette. */
export function schreibeFilter(filter) {
  const abfrage = new URLSearchParams()
  if (filter.q.trim()) abfrage.set('q', filter.q.trim())
  for (const liste of LISTEN) {
    if (filter.mit[liste].length) abfrage.set(liste, filter.mit[liste].join(','))
    if (filter.ohne[liste].length) abfrage.set(`x${liste}`, filter.ohne[liste].join(','))
  }
  for (const feld of SCHNELL_FELDER) if (filter.schnell[feld]) abfrage.set(feld, filter.schnell[feld] === 'ja' ? '1' : '0')
  if (filter.offen) abfrage.set('f', filter.offen)
  return abfrage.toString()
}

const ohneWert = (werte, wert) => werte.filter((w) => w !== wert)

export const wertZustand = (filter, liste, wert) => (filter.mit[liste].includes(wert) ? 'mit' : filter.ohne[liste].includes(wert) ? 'ohne' : 'nichts')

/** Ein Tipp auf einen Wert: nichts → "mit" → "ohne" → nichts. */
export function schalteWert(filter, liste, wert) {
  const zustand = wertZustand(filter, liste, wert)
  const mit = zustand === 'nichts' ? [...filter.mit[liste], wert] : ohneWert(filter.mit[liste], wert)
  const ohne = zustand === 'mit' ? [...filter.ohne[liste], wert] : ohneWert(filter.ohne[liste], wert)
  return { ...filter, mit: { ...filter.mit, [liste]: mit }, ohne: { ...filter.ohne, [liste]: ohne } }
}

/** Ein Tipp auf einen Schnellfilter mit eigenem Feld: nichts → ja → nein → nichts. */
export function schalteSchnell(filter, feld) {
  const folge = { undefined: 'ja', ja: 'nein', nein: undefined }
  return { ...filter, schnell: { ...filter.schnell, [feld]: folge[filter.schnell[feld]] } }
}

/** Die Liste aufklappen (oder, wenn schon offen, zuklappen). */
export const schalteOffen = (filter, liste) => ({ ...filter, offen: filter.offen === liste ? '' : liste })
