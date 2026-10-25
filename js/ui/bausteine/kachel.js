// Ein Termin: Cover, Titel (Link zur Hauptseite), Anbieter und Folge, Uhrzeit.
import { h } from '../dom.js'
import { folgeZeile, marke, zeitText } from '../../logik/folge.js'
import { titelAdresse } from '../../logik/woche.js'

function coverKnoten(cover) {
  if (!cover) return h('div', { class: 'cover cover-leer', 'aria-hidden': 'true' })
  return h('img', { class: 'cover', src: cover, alt: '', width: '56', height: '84', loading: 'lazy', decoding: 'async' })
}

function titelKnoten(termin, ak) {
  const adresse = titelAdresse(ak)
  return h('h3', { class: 'titel' }, adresse ? h('a', { href: adresse }, termin.name) : termin.name)
}

export function kachel(termin, titel) {
  const info = titel[termin.titleId] ?? {}
  const zeit = zeitText(termin)
  return h(
    'li',
    { class: 'kachel' },
    coverKnoten(info.cover),
    h('div', { class: 'text' }, titelKnoten(termin, info.ak), h('p', { class: 'folge' }, folgeZeile(termin)), marke(termin) && h('p', { class: 'marke' }, marke(termin))),
    zeit && h('p', { class: 'zeit' }, zeit),
  )
}
