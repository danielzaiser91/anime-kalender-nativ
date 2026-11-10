// Ein Eintrag der News: Cover, Titel (Link auf das Panel, wo es eines gibt) und seine Meldungen mit fertigem Satz, Quellen und Vermerk.
import { h } from '../dom.js'
import { hashFuerTitel } from '../../zustand/router.js'
import { datumKurz } from '../../logik/wochentext.js'

const EXTERN = { target: '_blank', rel: 'noopener noreferrer' }

function abgeloest(eintrag) {
  if (!eintrag) return null
  return eintrag.url ? h('a', { class: 'abgeloest', href: eintrag.url, ...EXTERN }, `${eintrag.text} ↗`) : h('span', { class: 'abgeloest' }, eintrag.text)
}

function quellen(belege) {
  if (!belege) return null
  const links = belege.map(([url, name]) => h('a', { href: url, ...EXTERN }, name))
  return h('span', { class: 'quellen' }, 'Quelle: ', links.flatMap((link, i) => (i ? [', ', link] : [link])))
}

/** Frühere Stände derselben Aussage, gedämpft und durchgestrichen, jeder mit seiner Quelle. */
function verlauf(staende) {
  if (!staende) return null
  const zeile = (s) => h('li', {}, h('span', { class: 'verlauf-tag' }, datumKurz(s.am), s.ueberholtAm && ` · überholt am ${datumKurz(s.ueberholtAm)}`), h('span', { class: 'durchgestrichen' }, s.satz), quellen(s.belege))
  return h('ul', { class: 'verlauf', 'aria-label': 'Frühere Stände' }, staende.map(zeile))
}

function meldungZeile(m) {
  const satz = h('span', { class: m.abgeloest ? 'satz durchgestrichen' : 'satz' }, m.satz)
  const zeile = h('div', { class: 'nachricht-zeile' }, h('span', { class: 'art' }, m.label), m.teil && h('span', { class: 'teil' }, m.teil), satz, abgeloest(m.abgeloest), quellen(m.belege))
  return h('li', {}, zeile, m.hinweis && h('p', { class: 'hinweis' }, m.hinweis), verlauf(m.verlauf))
}

function coverKnoten(cover) {
  if (!cover) return h('div', { class: 'cover cover-leer', 'aria-hidden': 'true' })
  return h('img', { class: 'cover', src: cover, alt: '', width: '56', height: '84', loading: 'lazy', decoding: 'async' })
}

export function newsEintrag(eintrag, { ort }) {
  const name = eintrag.ak ? h('a', { href: hashFuerTitel(ort, eintrag.ak), 'aria-haspopup': 'dialog' }, eintrag.name) : eintrag.name
  const text = h('div', { class: 'text' }, h('h3', { class: 'titel' }, name), h('ul', { class: 'nachrichten' }, eintrag.meldungen.map(meldungZeile)))
  return h('li', { class: 'kachel' }, coverKnoten(eintrag.cover), text)
}
