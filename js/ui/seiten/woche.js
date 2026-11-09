// Wochenansicht: je Tag eine Liste der Termine.
import { h } from '../dom.js'
import { kachel } from '../bausteine/kachel.js'
import { ladeMeldung, seitenrahmen } from '../bausteine/seitenrahmen.js'
import { tageDerWoche } from '../../logik/zeit.js'
import { gruppiereNachTag } from '../../logik/woche.js'
import { tagUeberschrift } from '../../logik/wochentext.js'

function tagKnoten(tag, kontext) {
  const ueberschrift = h('h2', { id: `tag-${tag.datum}` }, tagUeberschrift(tag.datum), tag.datum === kontext.heute && h('span', { class: 'heute-marke' }, 'heute'))
  const inhalt = tag.termine.length ? h('ol', { class: 'termine' }, tag.termine.map((t) => kachel(t, kontext))) : h('p', { class: 'leer' }, 'Keine Termine')
  return h('section', { class: 'tag', 'aria-labelledby': `tag-${tag.datum}` }, ueberschrift, inhalt)
}

function inhalt(zustand) {
  const meldung = ladeMeldung(zustand)
  if (meldung) return meldung
  const tage = gruppiereNachTag(zustand.daten.termine, tageDerWoche(zustand.ort.schluessel))
  const kontext = { titel: zustand.daten.titel, heute: zustand.heute, ort: zustand.ort, merk: zustand.merk }
  return h('div', { class: 'tage' }, tage.map((tag) => tagKnoten(tag, kontext)))
}

export const wochenseite = (zustand) => seitenrahmen(zustand, inhalt(zustand))
