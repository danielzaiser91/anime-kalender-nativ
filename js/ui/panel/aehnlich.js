// Ähnliche Titel (Baustein, lazy): geholt erst, wenn der Bereich ins Bild kommt; je Vorschlag Cover, Name und die gemeinsamen Merkmale (Hauptseite: weitere.tsx).
import { h } from '../dom.js'
import { hashFuerTitel } from '../../zustand/router.js'

/** `g:Action` ist ein Genre, `k:Mecha` ein Schlagwort; die Oberfläche hält beide auseinander. */
const merkmalKnoten = (merkmal) => h('span', { class: `merkmal ${merkmal.startsWith('g:') ? 'genre' : 'schlagwort'}` }, merkmal.slice(2))

function kachel([ak, name, cover, gemeinsam], ort) {
  const bild = cover ? h('img', { class: 'aehnlich-cover', src: cover, alt: '', width: '88', height: '132', loading: 'lazy', decoding: 'async' }) : h('span', { class: 'aehnlich-cover aehnlich-leer', 'aria-hidden': 'true' })
  const text = h('span', { class: 'aehnlich-text' }, h('span', { class: 'aehnlich-name' }, name), h('span', { class: 'merkmale' }, [...new Set(gemeinsam)].map(merkmalKnoten)))
  return h('li', {}, h('a', { class: 'aehnlich-kachel', href: hashFuerTitel(ort, ak), 'aria-haspopup': 'dialog' }, bild, text))
}

async function zeige(platz, { titel, lader, ort, ecchi }) {
  const daten = await lader.ladeAehnliche(titel.ak).catch(() => ({ v: [] }))
  const sichtbar = daten.v.filter((zeile) => ecchi || !zeile[4])
  platz.replaceChildren(sichtbar.length ? h('ul', { class: 'aehnlich-liste' }, sichtbar.map((zeile) => kachel(zeile, ort))) : h('p', { class: 'leise' }, 'Keine ähnlichen Titel gefunden.'))
}

/** Der Rahmen steht sofort; die Daten holt ein Beobachter, sobald er sichtbar wird. */
export function aehnlicheAbschnitt(ctx) {
  const platz = h('div', { class: 'aehnlich-platz' })
  const beobachter = new IntersectionObserver((eintraege) => {
    if (!eintraege.some((e) => e.isIntersecting)) return
    beobachter.disconnect()
    platz.replaceChildren(h('p', { class: 'leise' }, 'Wird geladen …'))
    zeige(platz, ctx)
  })
  beobachter.observe(platz)
  return h('section', { class: 'panel-abschnitt', 'aria-label': 'Ähnliche Titel' }, h('h3', {}, 'Ähnliche Titel'), platz)
}
