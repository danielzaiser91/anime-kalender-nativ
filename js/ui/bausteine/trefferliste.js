// Die Treffer der Suche als Liste von Links zum Panel; mehr als MAX Titel werden nicht gezeichnet, der Hinweis nennt den Rest.
import { h } from '../dom.js'
import { istFavorit } from '../../logik/merken.js'
import { metaText } from '../../logik/filter-texte.js'
import { hashFuerTitel } from '../../zustand/router.js'

const MAX = 200

function eintrag(t, { ort, merk }) {
  const favorit = istFavorit(merk, t.ak) && h('span', { class: 'mmarke', role: 'img', 'aria-label': 'Favorit' }, '★')
  const link = h('a', { href: hashFuerTitel(ort, t.ak), 'aria-haspopup': 'dialog' }, t.name)
  return h('li', { class: 'treffer' }, link, h('span', { class: 'treffer-meta' }, metaText(t)), favorit)
}

export function trefferliste(treffer, kontext) {
  const rest = treffer.length - MAX
  const hinweis = rest > 0 && h('p', { class: 'leer' }, `${rest} weitere Treffer: Suche oder Filter verfeinern.`)
  if (!treffer.length) return h('p', { class: 'leer' }, 'Keine Treffer. Suchbegriff kürzen oder Filter abwählen.')
  return h('div', {}, h('ol', { class: 'treffer-liste' }, treffer.slice(0, MAX).map((t) => eintrag(t, kontext))), hinweis)
}
