// Leiste über der Ansicht: Ansichten (Woche, Monat, Suche), Datum-Sprung, nur Favoriten, Einstellungen. Die Handlungen liest ui/aktionen.js.
import { h } from '../dom.js'
import { montagDerWoche, addiereTage } from '../../logik/zeit.js'
import { ansichten } from './ansichten.js'
import { schalter } from './schalter.js'

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
    ansichten(zustand),
    sprung(zustand),
    schalter({ text: '★ Nur Favoriten', name: 'Nur Favoriten zeigen', an: merk.nurFavoriten, aktion: 'nur-favoriten', fokus: 'nur-favoriten' }),
    schalter({ text: 'Einstellungen', name: 'Einstellungen öffnen',aktion: 'einstellungen', fokus: 'einstellungen' }),
  )
}
