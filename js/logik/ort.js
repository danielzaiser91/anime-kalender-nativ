// Die Ansichten Woche und Monat als Tabelle: Kopf, Blättern und Ablauf sind für beide dieselben. Rein, ohne DOM.
import { verschiebeWoche, wocheVon, montagDerWoche, addiereTage } from './zeit.js'
import { monatVon, verschiebeMonat, wochenDesMonats } from './monat.js'
import { kalenderwoche, monatsName, wochenSpanne } from './wochentext.js'

export const ORTE = {
  woche: {
    name: 'Woche',
    von: wocheVon,
    verschiebe: verschiebeWoche,
    wochen: (schluessel) => [schluessel],
    titel: wochenSpanne,
    unter: kalenderwoche,
    texte: { zurueck: 'Vorherige Woche', vor: 'Nächste Woche', heute: 'Diese Woche', wortZurueck: 'Vorherige', wortVor: 'Nächste' },
  },
  monat: {
    name: 'Monat',
    von: monatVon,
    verschiebe: verschiebeMonat,
    wochen: wochenDesMonats,
    titel: monatsName,
    unter: () => '',
    texte: { zurueck: 'Vorheriger Monat', vor: 'Nächster Monat', heute: 'Dieser Monat', wortZurueck: 'Vorheriger', wortVor: 'Nächster' },
  },
}

export const imBereich = (ort, stand) => !stand || ORTE[ort.art].wochen(ort.schluessel).some((woche) => woche >= stand.von && woche <= stand.bis)

/** Die Schlüssel beider Ansichten zum selben Zeitpunkt: der Wechsel Woche ↔ Monat bleibt beim Datum. */
export function schluesselBeider(ort, heute) {
  if (ort.art === 'woche') return { woche: ort.schluessel, monat: monatVon(addiereTage(montagDerWoche(ort.schluessel), 3)) }
  const bezug = monatVon(heute) === ort.schluessel ? heute : `${ort.schluessel}-01`
  return { woche: wocheVon(bezug), monat: ort.schluessel }
}

/** Ziel des Datum-Sprungs ("JJJJ-MM-TT") in der gerade gezeigten Ansicht. */
export const sprungOrt = (art, datum) => ({ art, schluessel: ORTE[art].von(datum) })
