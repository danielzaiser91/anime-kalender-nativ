// Die Filter der Suche als Links (jeder Tipp ändert die Adresse): Schnellfilter, gewählte Werte, die zehn Listen und die Werte der geöffneten Liste.
import { h } from '../dom.js'
import { wahlLink } from './filter-wahl.js'
import { CARTOON, leererFilter, LISTEN, zaehleWahlen } from '../../logik/filter.js'
import { schalteOffen, schalteSchnell, schalteWert, wertZustand } from '../../logik/filter-adresse.js'
import { LISTEN_NAMEN, optionen, wertName } from '../../logik/filter-texte.js'

// Schnellfilter: mit eigenem Feld (fav, frei, wo) oder als Wert einer Liste (Cartoon, TV, Disc).
const SCHNELL = [
  { text: '★ Favoriten', feld: 'fav' },
  { text: 'Cartoon', liste: 'kw', wert: CARTOON },
  { text: 'Kostenlos', feld: 'frei' },
  { text: 'TV', liste: 'p', wert: 'tv' },
  { text: 'Disc', liste: 'rt', wert: 'disc' },
  { text: 'Verfügbar', feld: 'wo' },
]

const SCHNELL_ZUSTAND = { ja: 'mit', nein: 'ohne' }

function schnellLink({ filter, ziel }, eintrag) {
  const zustand = eintrag.feld ? (SCHNELL_ZUSTAND[filter.schnell[eintrag.feld]] ?? 'nichts') : wertZustand(filter, eintrag.liste, eintrag.wert)
  const naechster = eintrag.feld ? schalteSchnell(filter, eintrag.feld) : schalteWert(filter, eintrag.liste, eintrag.wert)
  return wahlLink({ text: eintrag.text, zustand, ziel: ziel(naechster), fokus: `schnell-${eintrag.text}` })
}

export const schnellZeile = (kontext) => h('div', { class: 'wahl-zeile', role: 'group', 'aria-label': 'Schnellfilter' }, SCHNELL.map((eintrag) => schnellLink(kontext, eintrag)))

/** Alle gewählten Werte (mit und ohne) zum Abwählen, dazu das Zurücksetzen; ohne Wahl nichts. */
export function aktiveZeile({ filter, ziel }) {
  if (!zaehleWahlen(filter)) return null
  const gewaehlt = LISTEN.flatMap((liste) => [...filter.mit[liste], ...filter.ohne[liste]].map((wert) => ({ liste, wert })))
  const links = gewaehlt.map(({ liste, wert }, i) => wahlLink({ text: `${LISTEN_NAMEN[liste]}: ${wertName(liste, wert)}`, zustand: wertZustand(filter, liste, wert), ziel: ziel(schalteWert(filter, liste, wert)), fokus: `aktiv-${i}` }))
  const zuruecksetzen = h('a', { class: 'wahl-knopf', href: ziel({ ...leererFilter(), q: filter.q, offen: filter.offen }), 'data-fokus': 'zuruecksetzen' }, 'Alle Filter zurücksetzen')
  return h('div', { class: 'wahl-zeile', role: 'group', 'aria-label': 'Gewählte Filter' }, links, zuruecksetzen)
}

/** Die zehn Listen als Überschriften; die geöffnete trägt aria-current. */
export function listenZeile({ filter, ziel }) {
  const links = LISTEN.map((liste) => {
    const zahl = filter.mit[liste].length + filter.ohne[liste].length
    const attribute = { class: 'wahl-knopf liste', href: ziel(schalteOffen(filter, liste)), 'aria-current': filter.offen === liste ? 'true' : undefined, 'data-fokus': `liste-${liste}` }
    return h('a', attribute, zahl ? `${LISTEN_NAMEN[liste]} (${zahl})` : LISTEN_NAMEN[liste])
  })
  return h('nav', { class: 'wahl-zeile', 'aria-label': 'Filterlisten' }, links)
}

/** Die Werte der geöffneten Liste mit Titelzahl; Sprecher zeigen nur die gewählten (Eingabe im Suchformular). */
export function werteZeile({ filter, ziel, titel }) {
  if (!filter.offen || filter.offen === 'sp') return null
  const links = optionen(titel, filter.offen).map(({ wert, zahl }, i) => {
    const text = `${wertName(filter.offen, wert)} (${zahl})`
    return wahlLink({ text, zustand: wertZustand(filter, filter.offen, wert), ziel: ziel(schalteWert(filter, filter.offen, wert)), fokus: `wert-${i}` })
  })
  return h('div', { class: 'wahl-zeile', role: 'group', 'aria-label': LISTEN_NAMEN[filter.offen] }, links)
}
