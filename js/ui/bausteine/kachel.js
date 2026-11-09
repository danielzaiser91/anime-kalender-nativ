// Ein Termin: Cover, Titel (Link auf das Panel des Titels), Anbieter und Folge, Uhrzeit.
import { h } from '../dom.js'
import { folgeZeile, marke, zeitText } from '../../logik/folge.js'
import { hashFuerTitel } from '../../zustand/router.js'

function coverKnoten(cover) {
  if (!cover) return h('div', { class: 'cover cover-leer', 'aria-hidden': 'true' })
  return h('img', { class: 'cover', src: cover, alt: '', width: '56', height: '84', loading: 'lazy', decoding: 'async' })
}

function titelKnoten(termin, { ak, woche }) {
  return h('h3', { class: 'titel' }, ak ? h('a', { href: hashFuerTitel(woche, ak), 'aria-haspopup': 'dialog' }, termin.name) : termin.name)
}

export function kachel(termin, titel, woche) {
  const info = titel[termin.titleId] ?? {}
  const zeit = zeitText(termin)
  return h(
    'li',
    { class: 'kachel' },
    coverKnoten(info.cover),
    h('div', { class: 'text' }, titelKnoten(termin, { ak: info.ak, woche }), h('p', { class: 'folge' }, folgeZeile(termin)), marke(termin) && h('p', { class: 'marke' }, marke(termin))),
    zeit && h('p', { class: 'zeit' }, zeit),
  )
}
