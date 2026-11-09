// Ein Termin: Cover, Titel (Link auf das Panel des Titels), Anbieter und Folge, Uhrzeit, dazu Favorit und Gesehen.
import { h } from '../dom.js'
import { folgeZeile, marke, zeitText } from '../../logik/folge.js'
import { istFavorit, istGesehen } from '../../logik/merken.js'
import { hashFuerTitel } from '../../zustand/router.js'
import { schalter } from './schalter.js'

function coverKnoten(cover) {
  if (!cover) return h('div', { class: 'cover cover-leer', 'aria-hidden': 'true' })
  return h('img', { class: 'cover', src: cover, alt: '', width: '56', height: '84', loading: 'lazy', decoding: 'async' })
}

function titelKnoten(termin, { ak, ort }) {
  return h('h3', { class: 'titel' }, ak ? h('a', { href: hashFuerTitel(ort, ak), 'aria-haspopup': 'dialog' }, termin.name) : termin.name)
}

/** Favorit je Titel, Gesehen je Folge; ohne Kennung oder ohne Folgennummer (Film, Katalog) gibt es den Knopf nicht. */
function knoepfe(termin, { ak, merk }) {
  if (!ak) return null
  const folge = !termin.katalog && Number(termin.episode) > 0 ? Number(termin.episode) : 0
  const gesehen = folge && istGesehen(merk, ak, folge)
  return h(
    'div',
    { class: 'aktionen' },
    schalter({ text: '★ Favorit', name: `Favorit: ${termin.name}`, an: istFavorit(merk, ak), aktion: 'favorit', fokus: `fav-${ak}-${termin.date}-${termin.time ?? ''}`, daten: { ak } }),
    folge ? schalter({ text: 'Gesehen', name: `Folge ${folge} gesehen: ${termin.name}`, an: gesehen, aktion: 'gesehen', fokus: `gesehen-${ak}-${folge}`, daten: { ak, folge } }) : null,
  )
}

export function kachel(termin, { titel, ort, merk }) {
  const info = titel[termin.titleId] ?? {}
  const zeit = zeitText(termin)
  const text = h('div', { class: 'text' }, titelKnoten(termin, { ak: info.ak, ort }), h('p', { class: 'folge' }, folgeZeile(termin)), marke(termin) && h('p', { class: 'marke' }, marke(termin)), knoepfe(termin, { ak: info.ak, merk }))
  return h('li', { class: 'kachel' }, coverKnoten(info.cover), text, zeit && h('p', { class: 'zeit' }, zeit))
}
