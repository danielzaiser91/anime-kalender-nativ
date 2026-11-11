// Die Navigation zwischen Woche, Monat, Suche, News, Saison, Abo und Was gucken?: eine Stelle für Namen, Adressen und aria-current (Leiste und Suche benutzen sie gleich).
import { h } from '../dom.js'
import { hashFuerOrt } from '../../zustand/router.js'
import { ORTE, schluesselBeider } from '../../logik/ort.js'

const NAMEN = { woche: ORTE.woche.name, monat: ORTE.monat.name, suche: 'Suche', news: 'News', saison: 'Saison', abo: 'Abo', gucken: 'Was gucken?' }

/** Woche und Monat zeigen denselben Zeitpunkt wie die gerade gezeigte Ansicht (aus den Ansichten ohne Zeit: heute); Suche, News, Saison und Abo beginnen leer. */
function ziele({ ort, heute }) {
  const beide = ORTE[ort.art] ? schluesselBeider(ort, heute) : { woche: ORTE.woche.von(heute), monat: ORTE.monat.von(heute) }
  return {
    woche: hashFuerOrt({ art: 'woche', schluessel: beide.woche }),
    monat: hashFuerOrt({ art: 'monat', schluessel: beide.monat }),
    suche: hashFuerOrt({ art: 'suche', schluessel: '' }),
    news: hashFuerOrt({ art: 'news', schluessel: '' }),
    saison: hashFuerOrt({ art: 'saison', schluessel: '' }),
    abo: hashFuerOrt({ art: 'abo', schluessel: '' }),
    gucken: hashFuerOrt({ art: 'gucken', schluessel: '' }),
  }
}

export function ansichten(zustand) {
  const adressen = ziele(zustand)
  const links = Object.keys(NAMEN).map((art) => h('a', { class: 'ansicht', href: adressen[art], 'aria-current': art === zustand.ort.art ? 'page' : undefined }, NAMEN[art]))
  return h('nav', { class: 'ansichten', 'aria-label': 'Ansicht' }, links)
}
