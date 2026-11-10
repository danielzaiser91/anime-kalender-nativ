// Eine Serie der Saison: Cover, Name (Link auf das Panel, wo es eines gibt), Stufe der deutschen Fassung, Termine, Anbieter.
import { h } from '../dom.js'
import { STUFEN, terminText } from '../../logik/saison-stufe.js'
import { hashFuerTitel } from '../../zustand/router.js'

const ANBIETER_MAX = 3

function anbieterKnoten(zeile) {
  const laut = zeile.laut ?? []
  const chips = zeile.anbieter.slice(0, ANBIETER_MAX).map((name) => h('span', { class: laut.includes(name) ? 'chip laut' : 'chip' }, name))
  const hinweis = laut.length > 0 && h('span', { class: 'hinweis' }, `${laut.join(', ')}: Deutsch laut Anbieter`)
  return chips.length > 0 ? h('span', { class: 'chips' }, chips, hinweis) : null
}

function coverKnoten(zeile) {
  if (!zeile.cover) return h('span', { class: 'cover cover-leer', 'aria-hidden': 'true' })
  return h('img', { class: zeile.erschienen ? 'cover' : 'cover noch', src: zeile.cover, alt: '', width: '56', height: '84', loading: 'lazy', decoding: 'async' })
}

export function saisonKarte(zeile, kontext) {
  const name = zeile.ak ? h('a', { href: hashFuerTitel(kontext.ort, zeile.ak), 'aria-haspopup': 'dialog' }, zeile.name) : zeile.name
  const termin = terminText({ zeile, ausblick: kontext.ausblick, jahr: kontext.heute.slice(0, 4), erschienen: zeile.erschienen })
  const text = h('div', { class: 'text' }, h('h3', { class: 'titel' }, name), h('p', { class: `stufe stufe-${zeile.stufe}` }, STUFEN[zeile.stufe]), termin && h('p', {}, termin), anbieterKnoten(zeile))
  return h('li', { class: zeile.erschienen ? 'kachel' : 'kachel kommt' }, coverKnoten(zeile), text)
}
