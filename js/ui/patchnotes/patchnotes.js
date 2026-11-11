// "Neu auf der Webseite" als <dialog> (wird erst beim Öffnen geladen): die Patch Notes der Hauptseite nach Tag, mit Filter und Wischen nach unten zum Schließen.
import { h } from '../dom.js'
import { ladeCss } from '../css-laden.js'
import { verdrahteWischen } from '../wischen.js'
import { hauptseiteAdresse, tageVon, tagUeberschrift, zaehleKategorien } from '../../logik/patchnotes.js'

const TITEL_ID = 'patchnotes-titel'
const SCHLIESS_WEG = 80
const KATEGORIE = { feature: 'Feature', bugfix: 'Bugfix' }
const SYMBOL = { feature: '✦', bugfix: '⚒' }
const FILTER = [['alles', 'Alles'], ['feature', 'Feature'], ['bugfix', 'Bugfix']]
const ENTWURF = 'Entwurf: Texte werden noch überarbeitet.'

const ansehen = (eintrag) => eintrag.link && [' ', h('a', { class: 'pn-link', href: hauptseiteAdresse(eintrag.link) }, 'ansehen ›')]
const symbol = (eintrag) => h('span', { class: `pn-symbol ${eintrag.kategorie}`, title: KATEGORIE[eintrag.kategorie] }, h('span', { 'aria-hidden': 'true' }, SYMBOL[eintrag.kategorie]), h('span', { class: 'sr-only' }, `${KATEGORIE[eintrag.kategorie]}:`))

function highlight(eintrag) {
  const hinweis = (eintrag.untertitel || eintrag.link) && h('div', { class: 'pn-hl-hinweis' }, eintrag.untertitel, ansehen(eintrag))
  return h('div', { class: 'pn-hl' }, symbol(eintrag), h('div', { class: 'pn-hl-text' }, h('div', { class: 'pn-hl-titel' }, eintrag.text), hinweis), h('span', { class: 'pn-marke' }, 'HIGHLIGHT'))
}

const zeile = (eintrag) => h('div', { class: 'pn-zeile' }, symbol(eintrag), h('span', { class: 't' }, eintrag.text, ansehen(eintrag)), eintrag.untertitel && h('span', { class: 'h' }, eintrag.untertitel))

function tagBlock(tag, heute) {
  const stift = tag.entwurf && h('span', { class: 'pn-entwurf', role: 'img', 'aria-label': ENTWURF, title: ENTWURF }, '✎')
  return h('section', { class: 'pn-tag' }, h('h3', { class: 'pn-tag-kopf' }, tagUeberschrift(tag.datum, heute), ' ', stift), tag.hl.map(highlight), tag.zeilen.map(zeile))
}

function listeFuer(daten, { filter, heute }) {
  const tage = tageVon(daten.eintraege, filter)
  return h('div', { class: 'pn-liste' }, tage.length ? tage.map((tag) => tagBlock(tag, heute)) : h('p', { class: 'meldung' }, 'Keine Einträge.'))
}

function filterLeiste({ daten, aktiv }, aufWahl) {
  const zahlen = zaehleKategorien(daten.eintraege)
  const knoepfe = FILTER.map(([name, text]) => {
    const knopf = h('button', { type: 'button', class: 'schalter', 'aria-pressed': String(name === aktiv) }, `${text} ${zahlen[name]}`)
    knopf.addEventListener('click', () => aufWahl(name))
    return knopf
  })
  return h('div', { class: 'pn-filter', role: 'group', 'aria-label': 'Filter' }, knoepfe)
}

function kopf(dialog, daten) {
  const zu = h('button', { type: 'button', class: 'panel-knopf' }, 'Schließen')
  zu.addEventListener('click', () => dialog.close())
  const knoten = h('header', { class: 'pn-kopf' }, h('p', { class: 'pn-kicker' }, `Patch Notes · Stand ${daten.stand.replaceAll('-', '.')}`), h('h2', { id: TITEL_ID, tabindex: '-1' }, 'Neu auf anime-kalender'), zu)
  verdrahteWischen(knoten, (richtung) => richtung === 'unten' && dialog.close(), SCHLIESS_WEG)
  return knoten
}

/** Zeichnet Kopf, Filter und Liste; ein Klick auf einen Filter zeichnet neu und behält den Fokus auf dem gewählten Knopf. */
function zeichne(innen, umfeld, filter) {
  const { dialog, daten, heute } = umfeld
  const aufWahl = (name) => {
    zeichne(innen, umfeld, name)
    innen.querySelector('.pn-filter [aria-pressed="true"]')?.focus()
  }
  innen.replaceChildren(kopf(dialog, daten), filterLeiste({ daten, aktiv: filter }, aufWahl), listeFuer(daten, { filter, heute }))
}

/** Öffnet den Dialog; `fokusZurueck` ist das Element, das den Fokus nach dem Schließen wieder bekommt. */
export async function oeffnePatchnotes(dialog, { abhaengigkeiten, fokusZurueck }) {
  const { lader, store } = abhaengigkeiten
  const [daten] = await Promise.all([lader.ladePatchnotes(), ladeCss('css/patchnotes.css')])
  const innen = h('div', { class: 'panel-inhalt patchnotes' })
  zeichne(innen, { dialog, daten, heute: store.lies().heute }, 'alles')
  dialog.setAttribute('aria-labelledby', TITEL_ID)
  dialog.replaceChildren(innen)
  dialog.addEventListener('close', () => fokusZurueck?.focus(), { once: true })
  if (!dialog.open) dialog.showModal()
  innen.querySelector('h2')?.focus({ preventScroll: true })
}
