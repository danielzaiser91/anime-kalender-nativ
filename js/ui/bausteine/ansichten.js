// Die Navigation zwischen Woche, Monat und Suche: eine Stelle für Namen, Adressen und aria-current (Leiste und Suche benutzen sie gleich).
import { h } from '../dom.js'
import { hashFuerOrt } from '../../zustand/router.js'
import { ORTE, schluesselBeider } from '../../logik/ort.js'

const NAMEN = { woche: ORTE.woche.name, monat: ORTE.monat.name, suche: 'Suche' }

/** Woche und Monat zeigen denselben Zeitpunkt wie die gerade gezeigte Ansicht (aus der Suche: heute); die Suche beginnt leer. */
function ziele({ ort, heute }) {
  const beide = ort.art === 'suche' ? { woche: ORTE.woche.von(heute), monat: ORTE.monat.von(heute) } : schluesselBeider(ort, heute)
  return {
    woche: hashFuerOrt({ art: 'woche', schluessel: beide.woche }),
    monat: hashFuerOrt({ art: 'monat', schluessel: beide.monat }),
    suche: hashFuerOrt({ art: 'suche', schluessel: '' }),
  }
}

export function ansichten(zustand) {
  const adressen = ziele(zustand)
  const links = Object.keys(NAMEN).map((art) => h('a', { class: 'ansicht', href: adressen[art], 'aria-current': art === zustand.ort.art ? 'page' : undefined }, NAMEN[art]))
  return h('nav', { class: 'ansichten', 'aria-label': 'Ansicht' }, links)
}
