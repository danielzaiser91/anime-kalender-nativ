// Wochenansicht: je Tag eine Liste der Termine.
import { h } from '../dom.js'
import { kachel } from '../bausteine/kachel.js'
import { wochenkopf } from '../bausteine/wochenkopf.js'
import { tageDerWoche } from '../../logik/zeit.js'
import { gruppiereNachTag } from '../../logik/woche.js'
import { standText, tagUeberschrift } from '../../logik/wochentext.js'

function tagKnoten(tag, titel, heute) {
  const ueberschrift = h('h2', { id: `tag-${tag.datum}` }, tagUeberschrift(tag.datum), tag.datum === heute && h('span', { class: 'heute-marke' }, 'heute'))
  const inhalt = tag.termine.length ? h('ol', { class: 'termine' }, tag.termine.map((t) => kachel(t, titel))) : h('p', { class: 'leer' }, 'Keine Termine')
  return h('section', { class: 'tag', 'aria-labelledby': `tag-${tag.datum}` }, ueberschrift, inhalt)
}

function meldung(text) {
  return h('p', { class: 'meldung', role: 'status' }, text)
}

function inhalt(zustand) {
  if (zustand.status === 'fehler') return meldung(`Die Woche konnte nicht geladen werden (${zustand.fehler}).`)
  if (!zustand.daten) return meldung('Lädt …')
  const tage = gruppiereNachTag(zustand.daten.termine, tageDerWoche(zustand.woche))
  return h('div', { class: 'tage' }, tage.map((tag) => tagKnoten(tag, zustand.daten.titel, zustand.heute)))
}

export function wochenseite(zustand) {
  return h('div', { class: 'wochenseite', 'aria-busy': zustand.status === 'laedt' ? 'true' : 'false' }, wochenkopf(zustand), inhalt(zustand), fussnote(zustand.stand))
}

function fussnote(stand) {
  const adresse = h('a', { href: 'https://anime-kalender.de' }, 'anime-kalender.de')
  const text = ['Newsletter, Push, Favoriten und alle Einzelheiten zu jedem Titel: ', adresse, '.']
  return h('footer', { class: 'fuss' }, stand && h('p', {}, `Datenstand ${standText(stand.erzeugt)}`), h('p', {}, text))
}
