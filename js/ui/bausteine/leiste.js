// Leiste über der Ansicht: Woche/Monat, Datum-Sprung, nur Favoriten, Einstellungen. Die Handlungen liest ui/aktionen.js.
import { h } from '../dom.js'
import { hashFuerOrt } from '../../zustand/router.js'
import { montagDerWoche, addiereTage } from '../../logik/zeit.js'
import { ORTE, schluesselBeider } from '../../logik/ort.js'
import { schalter } from './schalter.js'

function ansichtLink(art, { ort, heute }) {
  const ziel = { art, schluessel: schluesselBeider(ort, heute)[art] }
  return h('a', { class: 'ansicht', href: hashFuerOrt(ziel), 'aria-current': art === ort.art ? 'page' : undefined }, ORTE[art].name)
}

/** Das Datum-Feld kennt nur Tage mit Daten: von Montag der ersten bis Sonntag der letzten Woche. */
function sprung({ ort, stand }) {
  const grenzen = stand ? { min: montagDerWoche(stand.von), max: addiereTage(montagDerWoche(stand.bis), 6) } : {}
  return h(
    'form',
    { class: 'sprung', 'data-absenden': 'sprung', 'data-art': ort.art },
    h('label', { for: 'sprung-datum' }, 'Datum'),
    h('input', { id: 'sprung-datum', name: 'datum', type: 'date', required: true, ...grenzen }),
    h('button', { type: 'submit', class: 'schalter' }, 'Gehen'),
  )
}

export function leiste(zustand) {
  const { merk } = zustand
  return h(
    'div',
    { class: 'leiste' },
    h('nav', { class: 'ansichten', 'aria-label': 'Ansicht' }, ansichtLink('woche', zustand), ansichtLink('monat', zustand), h('a', { class: 'ansicht', href: '#/suche' }, 'Suche')),
    sprung(zustand),
    schalter({ text: '★ Nur Favoriten', name: 'Nur Favoriten zeigen', an: merk.nurFavoriten, aktion: 'nur-favoriten', fokus: 'nur-favoriten' }),
    schalter({ text: 'Einstellungen', name: 'Einstellungen öffnen',aktion: 'einstellungen', fokus: 'einstellungen' }),
  )
}
