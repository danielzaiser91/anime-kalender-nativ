// Rahmen jeder Ansicht: Leiste, Zeitkopf, Inhalt, Fußnote; dazu die Lade- und Fehlermeldung, die Woche und Monat teilen.
import { h } from '../dom.js'
import { leiste } from './leiste.js'
import { zeitkopf } from './zeitkopf.js'
import { standText } from '../../logik/wochentext.js'

export function fussnote(stand) {
  const adresse = h('a', { href: 'https://anime-kalender.de' }, 'anime-kalender.de')
  const text = ['Newsletter, Push und alle Einzelheiten zu jedem Titel: ', adresse, '.']
  return h('footer', { class: 'fuss' }, stand && h('p', {}, `Datenstand ${standText(stand.erzeugt)}`), h('p', {}, text))
}

/** Die Meldung, solange die Daten fehlen; sonst nichts. */
export function ladeMeldung(zustand) {
  if (zustand.status !== 'fehler' && zustand.daten) return null
  const text = zustand.status === 'fehler' ? `Die Daten konnten nicht geladen werden (${zustand.fehler}).` : 'Lädt …'
  return h('p', { class: 'meldung', role: 'status' }, text)
}

export function seitenrahmen(zustand, inhalt) {
  return h('div', { class: 'wochenseite', 'aria-busy': zustand.status === 'laedt' ? 'true' : 'false' }, leiste(zustand), zeitkopf(zustand), inhalt, fussnote(zustand.stand))
}
