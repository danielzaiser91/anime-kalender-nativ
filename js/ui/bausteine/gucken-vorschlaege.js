// Der Schluss von "Was gucken?": bis zu fünf Vorschläge als Galerie (Cover öffnet das Panel), darunter "genauer", "Von vorn" und die Ablage.
import { h } from '../dom.js'
import { coverKnoten } from './gucken-duell.js'
import { ablage } from './gucken-ablage.js'
import { kannGenauer } from '../../logik/gucken-ablauf.js'
import { anbieterName } from '../../logik/folge.js'
import { artWort, stand } from '../../logik/gucken-reise.js'
import { istFavorit } from '../../logik/merken.js'
import { hashFuerTitel } from '../../zustand/router.js'

const knopf = (text, { aktion, ak, name }) => h('button', { type: 'button', class: 'schalter', 'data-aktion': aktion, 'data-ak': ak, 'aria-label': `${text}: ${name}`, 'data-fokus': `${aktion}-${ak}` }, text)

function vorschlag(k, { ort, merk }) {
  const anbieter = [...new Set(k.p.map((plattform) => anbieterName(plattform)))].join(', ')
  const infos = [artWort(k), k.y, anbieter].filter(Boolean).join(' · ')
  const cover = h('a', { class: 'gucken-vorschlag-cover', href: hashFuerTitel(ort, k.id), 'aria-haspopup': 'dialog', 'aria-label': `${k.n}: Handlung, Anbieter und Trailer` }, coverKnoten(k, 'gucken-cover'), k.ab !== undefined && h('span', { class: 'gucken-staffel' }, `Beginnt mit Staffel ${k.ab}`))
  const favorit = h('button', { type: 'button', class: 'schalter', 'aria-pressed': String(istFavorit(merk, k.id)), 'aria-label': `Favorit: ${k.n}`, 'data-aktion': 'favorit', 'data-ak': k.id, 'data-fokus': `gucken-fav-${k.id}` }, '★ Favorit')
  const aktionen = h('div', { class: 'gucken-aktionen' }, favorit, knopf('Schon gesehen', { aktion: 'gucken-gesehen', ak: k.id, name: k.n }), knopf('Nicht interessiert', { aktion: 'gucken-nein', ak: k.id, name: k.n }))
  return h('li', { class: 'gucken-vorschlag' }, h('h3', {}, k.n), h('p', { class: 'gucken-info' }, infos), cover, aktionen)
}

function liste(g, umfeld) {
  const kandidaten = g.gezeigt.map((id) => g.kontext.datei.einstiege[g.kontext.index.get(id)])
  if (!kandidaten.length) return h('p', { class: 'leer' }, 'Für diese Antworten ist nichts mehr übrig. Andere Antworten geben andere Vorschläge.')
  const wenige = kandidaten.length < 5 && h('p', { class: 'hinweis-zeile' }, kandidaten.length === 1 ? 'Nur noch ein Vorschlag – andere Antworten geben mehr.' : `Nur noch ${kandidaten.length} Vorschläge – andere Antworten geben mehr.`)
  return h('div', {}, wenige, h('ul', { class: 'gucken-galerie' }, kandidaten.map((k) => vorschlag(k, umfeld))))
}

function unterZeile(g) {
  const s = stand(g.kontext, g.sitzung.zustand, g.ziel)
  const eingegrenzt = s.rest === null ? 'auf die passendsten' : `auf ca. ${s.rest}`
  return h('p', { class: 'hinweis-zeile' }, `Aus ${s.gesamt} Titeln mit deutscher Synchro, eingegrenzt ${eingegrenzt}. Tippe aufs Cover für mehr Details.`)
}

export function vorschlagsAnsicht(g, umfeld) {
  const genauer = kannGenauer(g) && h('button', { type: 'button', class: 'schalter hervor', 'data-aktion': 'gucken-genauer', 'data-fokus': 'gucken-genauer' }, 'Noch vier Duelle – genauer')
  const vonVorn = h('button', { type: 'button', class: 'schalter', 'data-aktion': 'gucken-los', 'data-fokus': 'gucken-los' }, 'Von vorn')
  return h('section', { class: 'gucken-ergebnis', 'aria-live': 'polite' }, h('h2', { class: 'seiten-titel' }, g.gezeigt.length < 5 ? 'Deine Vorschläge' : 'Fünf Vorschläge für dich'), unterZeile(g), liste(g, umfeld), h('div', { class: 'gucken-leiste' }, genauer, vonVorn), ablage(g, umfeld.merk))
}
