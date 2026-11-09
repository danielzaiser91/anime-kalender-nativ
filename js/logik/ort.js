// Die Ansicht als Tabelle (heute nur die Woche): Kopf, Blättern und Ablauf lesen sie, damit eine zweite Ansicht keinen zweiten Kopf braucht. Rein, ohne DOM.
import { verschiebeWoche, wocheVon } from './zeit.js'
import { kalenderwoche, wochenSpanne } from './wochentext.js'

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
}

export const imBereich = (ort, stand) => !stand || ORTE[ort.art].wochen(ort.schluessel).some((woche) => woche >= stand.von && woche <= stand.bis)
