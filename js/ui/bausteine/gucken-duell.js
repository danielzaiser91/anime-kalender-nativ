// Ein Duell in "Was gucken?": zwei Karten nebeneinander (Tippen oder zur Seite des Titels wischen), Zwischenstand, Zurück und "Andere Vorschläge".
import { h } from '../dom.js'
import { verdrahteWischen } from '../wischen.js'
import { naechstesPaar } from '../../logik/gucken-kern.js'
import { stand } from '../../logik/gucken-reise.js'

const ANTWORT_KNOPF = { links: 'gucken-a', rechts: 'gucken-b' }

export function coverKnoten(k, klasse) {
  if (!k.c) return h('div', { class: `${klasse} cover-leer`, 'aria-hidden': 'true' })
  return h('img', { class: klasse, src: k.c, alt: '', width: '185', height: '278', loading: 'lazy', decoding: 'async' })
}

function karte(k, { seite, genres }) {
  const chips = genres.map((g) => h('i', { class: 'gucken-chip' }, g))
  const name = h('span', { class: 'gucken-name' }, k.n, h('span', { class: 'gucken-chips' }, chips))
  return h('button', { type: 'button', class: 'gucken-karte', 'data-aktion': `gucken-${seite}`, 'data-fokus': `gucken-${seite}` }, coverKnoten(k, 'gucken-cover'), name)
}

function fortschrittsPunkte(g) {
  const punkte = Array.from({ length: g.ziel }, (_, i) => h('i', { class: i < g.sitzung.zustand.gewertet ? 'punkt an' : 'punkt' }))
  return h('div', { class: 'gucken-punkte', 'aria-hidden': 'true' }, punkte)
}

function zahlenText(s) {
  if (s.rest === null) return 'Deine Auswahl hilft uns, die Vorschläge auf die passendsten Titel einzuschränken'
  if (s.rest === s.gesamt) return `${s.gesamt} mögliche Vorschläge`
  return `Deine Auswahl hilft uns, die Vorschläge auf ca. ${s.rest} von ${s.gesamt} Titeln einzuschränken`
}

function paarKnoten(g, paar) {
  const genres = (k) => k.g.slice(0, 2).map((i) => g.kontext.datei.genres[i])
  const [a, b] = paar.map((i) => g.kontext.datei.einstiege[i])
  const knoten = h('div', { class: 'gucken-paar' }, karte(a, { seite: 'a', genres: genres(a) }), h('span', { class: 'gucken-oder' }, 'oder'), karte(b, { seite: 'b', genres: genres(b) }))
  verdrahteWischen(knoten, (richtung) => knoten.querySelector(`[data-aktion="${ANTWORT_KNOPF[richtung]}"]`)?.click())
  return knoten
}

function leiste(g) {
  const zurueck = h('button', { type: 'button', class: 'schalter', 'data-aktion': 'gucken-zurueck', 'data-fokus': 'gucken-zurueck', disabled: g.sitzung.verlauf.length === 0 }, '← Zurück')
  const egal = h('button', { type: 'button', class: 'schalter', 'data-aktion': 'gucken-n', 'data-fokus': 'gucken-n' }, 'Andere Vorschläge')
  return h('div', { class: 'gucken-leiste' }, zurueck, egal)
}

export function duellAnsicht(g) {
  const paar = naechstesPaar(g.kontext, g.sitzung.zustand)
  const s = stand(g.kontext, g.sitzung.zustand, g.ziel)
  return h(
    'section',
    { class: 'gucken-duell', 'aria-live': 'polite' },
    fortschrittsPunkte(g),
    h('h2', { class: 'seiten-titel' }, 'Was gefällt dir mehr?'),
    h('p', { class: 'hinweis-zeile' }, `Duell ${s.nr} von ${s.ziel} · Tippe auf einen Titel oder wische zu ihm.`),
    paarKnoten(g, paar),
    h('p', { class: 'hinweis-zeile' }, zahlenText(s)),
    leiste(g),
  )
}
