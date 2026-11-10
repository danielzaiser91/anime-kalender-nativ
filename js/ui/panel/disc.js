// Disc-Ausgaben (Baustein, lazy): die Varianten nach Art gruppiert, je Zeile Name, Edition, Datum je Format, Shop und Quelle (Hauptseite: disc-bereich.tsx).
import { h } from '../dom.js'
import { discAusgabenVon } from '../../logik/disc-ausgaben.js'
import { ART_NAMEN, FORMAT_NAMEN, gruppenVon, haendlerAus, istKommend, jahre, kaufText, kompaktDatum, startOffen, variantenVon } from '../../logik/disc-varianten.js'

const SICHTBAR = 6

const extern = (adresse, text, klasse = '') => h('a', { href: adresse, target: '_blank', rel: 'noopener noreferrer', class: klasse }, `${text} ↗`)

function datumKnoten(format, datum, heute) {
  const kommend = istKommend(datum, heute)
  return h('span', { class: `disc-datum ${kommend ? 'kommend' : ''}`.trim() }, `${FORMAT_NAMEN[format]} `, h('time', { datetime: datum }, kompaktDatum(datum)))
}

function links(v) {
  const shop = v.shop && extern(v.shop, kaufText(v.shop, haendlerAus(v.shop)))
  return [shop, v.quelle && extern(v.quelle, 'Quelle: aniSearch', 'leise')].filter(Boolean)
}

function zeile(v, heute) {
  const daten = v.formate.filter((f) => v.datumJe[f]).map((f) => datumKnoten(f, v.datumJe[f], heute))
  return h('li', { class: 'disc-zeile' }, h('span', { class: 'disc-name' }, v.name), v.edition && h('span', { class: 'leise' }, v.edition), h('span', { class: 'disc-daten' }, daten), h('span', { class: 'disc-links' }, links(v)))
}

/** Lange Listen zeigen sechs Zeilen, ein Knopf holt den Rest. */
function liste(varianten, heute) {
  const ul = h('ul', { class: 'disc-liste' }, varianten.slice(0, SICHTBAR).map((v) => zeile(v, heute)))
  if (varianten.length <= SICHTBAR) return ul
  const knopf = h('button', { type: 'button', class: 'panel-knopf' }, `Alle ${varianten.length} anzeigen`)
  knopf.addEventListener('click', () => {
    ul.replaceChildren(...varianten.map((v) => zeile(v, heute)))
    knopf.remove()
  })
  return h('div', {}, ul, knopf)
}

function gruppe({ art, liste: varianten }, { alle, heute }) {
  const spanne = jahre(varianten)
  const kopf = h('summary', {}, `${ART_NAMEN[art]} · ${varianten.length}${spanne ? ` · ${spanne}` : ''}`)
  return h('details', { class: 'disc-gruppe', open: startOffen(alle, art) }, kopf, liste(varianten, heute))
}

export async function discAbschnitt({ titel, lader, heute }) {
  const daten = await lader.ladeDisc(titel.ak)
  const alle = variantenVon(discAusgabenVon(daten, titel.name), { titelName: titel.name, artikelBasis: daten.artikelBasis })
  if (!alle.length) return null
  const verlag = daten.termine.map((t) => t.verlag).find(Boolean)
  const zahl = alle.length === 1 ? '1 Variante' : `${alle.length} Varianten`
  return h('section', { class: 'panel-abschnitt', 'aria-label': 'DVD und Blu-ray' }, h('h3', {}, 'DVD & Blu-ray'), h('p', { class: 'leise' }, verlag ? `${zahl} · ${verlag}` : zahl), gruppenVon(alle).map((g) => gruppe(g, { alle, heute })))
}
