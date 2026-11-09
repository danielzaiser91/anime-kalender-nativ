// Rahmen jeder Ansicht: Zeitkopf, Inhalt, Fußnote; dazu die Lade- und Fehlermeldung.
import { h } from '../dom.js'
import { zeitkopf } from './zeitkopf.js'
import { standText } from '../../logik/wochentext.js'

function fussnote(stand) {
  const adresse = h('a', { href: 'https://anime-kalender.de' }, 'anime-kalender.de')
  const text = ['Newsletter, Push, Favoriten und alle Einzelheiten zu jedem Titel: ', adresse, '.']
  return h('footer', { class: 'fuss' }, stand && h('p', {}, `Datenstand ${standText(stand.erzeugt)}`), h('p', {}, text))
}

/** Die Meldung, solange die Daten fehlen; sonst nichts. */
export function ladeMeldung(zustand) {
  if (zustand.status !== 'fehler' && zustand.daten) return null
  const text = zustand.status === 'fehler' ? `Die Woche konnte nicht geladen werden (${zustand.fehler}).` : 'Lädt …'
  return h('p', { class: 'meldung', role: 'status' }, text)
}

export function seitenrahmen(zustand, inhalt) {
  return h('div', { class: 'wochenseite', 'aria-busy': zustand.status === 'laedt' ? 'true' : 'false' }, zeitkopf(zustand), inhalt, fussnote(zustand.stand))
}
