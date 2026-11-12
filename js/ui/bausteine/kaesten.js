// Die zwei Kästen unter dem Poster-Raster eines Tages: "Im Fernsehen" (Kacheln zum Wischen) und "Im Handel" (Liste).
import { h } from '../dom.js'
import { folgeZeile, zeitText } from '../../logik/folge.js'
import { buendelText, buendleFernsehen, senderZeile, tvVorbei } from '../../logik/woche-teile.js'
import { hashFuerTitel } from '../../zustand/router.js'

function link(termin, { titel, ort }, klasse) {
  const ak = titel[termin.titleId]?.ak
  return ak ? h('a', { class: klasse, href: hashFuerTitel(ort, ak), 'aria-haspopup': 'dialog' }, termin.name) : h('span', { class: klasse }, termin.name)
}

function fernsehKachel(gruppe, kontext) {
  const { erster, weitere } = gruppe
  const cover = kontext.titel[erster.titleId]?.cover
  const mehr = buendelText(weitere)
  return h(
    'li',
    { class: tvVorbei(gruppe, kontext) ? 'tv-kachel tv-vorbei' : 'tv-kachel' },
    cover ? h('img', { class: 'tv-cover', src: cover, alt: '', width: '24', height: '34', loading: 'lazy', decoding: 'async' }) : h('span', { class: 'tv-cover' }),
    h('span', { class: 'tv-zeit' }, zeitText(erster) || '–'),
    h('span', { class: 'tv-text' }, link(erster, kontext, 'tv-titel'), h('span', { class: 'tv-sender' }, senderZeile(erster))),
    mehr && h('span', { class: 'tv-mehr' }, mehr),
  )
}

/** Wie live steht der Kasten an jedem Tag; ohne Sendung sagt er es. */
export function fernsehKasten(termine, kontext) {
  const kopf = h('h3', { class: 'kasten-kopf' }, h('span', { class: 'tv-zeichen', 'aria-hidden': 'true' }), 'Im Fernsehen')
  const inhalt = termine.length ? h('ul', { class: 'tv-reihe' }, buendleFernsehen(termine).map((g) => fernsehKachel(g, kontext))) : h('p', { class: 'tv-leer' }, 'Keine Ausstrahlung.')
  return h('div', { class: 'tv-kasten' }, kopf, inhalt)
}

function handelZeile(termin, kontext) {
  return h('li', { class: 'handel-zeile' }, link(termin, kontext, 'handel-titel'), h('span', { class: 'handel-unter' }, folgeZeile(termin)))
}

export function handelKasten(termine, kontext) {
  if (!termine.length) return null
  return h('div', { class: 'handel-kasten' }, h('h3', { class: 'kasten-kopf handel-kopf' }, `Im Handel · ${termine.length}`), h('ul', { class: 'handel-liste' }, termine.map((t) => handelZeile(t, kontext))))
}
