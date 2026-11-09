// Kopf der Woche oder des Monats: Spanne, Blättern, Rücksprung auf heute. Blättern sind echte Links (Hash).
import { h } from '../dom.js'
import { hashFuerOrt } from '../../zustand/router.js'
import { imBereich, ORTE } from '../../logik/ort.js'

// Schmal zeigt nur der Pfeil; der Name für Screenreader kommt aus aria-label.
function blaettern({ pfeil, wort, name, ziel, erlaubt, klasse }) {
  const inhalt = klasse === 'zurueck' ? [pfeil, h('span', { class: 'wort' }, ` ${wort}`)] : [h('span', { class: 'wort' }, `${wort} `), pfeil]
  const attribute = { class: `blaettern ${klasse}`, 'aria-label': name }
  if (!erlaubt) return h('span', { ...attribute, 'aria-disabled': 'true' }, inhalt)
  return h('a', { ...attribute, href: hashFuerOrt(ziel) }, inhalt)
}

export function zeitkopf({ ort, heute, stand }) {
  const art = ORTE[ort.art]
  const nachbar = (n) => ({ art: ort.art, schluessel: art.verschiebe(ort.schluessel, n) })
  const { texte } = art
  const unter = art.unter(ort.schluessel)
  return h(
    'nav',
    { class: 'zeitkopf', 'aria-label': `${art.name} wählen` },
    blaettern({ pfeil: '‹', wort: texte.wortZurueck, name: texte.zurueck, ziel: nachbar(-1), erlaubt: imBereich(nachbar(-1), stand), klasse: 'zurueck' }),
    h('div', { class: 'spanne' }, h('h2', {}, art.titel(ort.schluessel)), unter && h('p', {}, unter)),
    blaettern({ pfeil: '›', wort: texte.wortVor, name: texte.vor, ziel: nachbar(1), erlaubt: imBereich(nachbar(1), stand), klasse: 'vor' }),
    ort.schluessel !== art.von(heute) && h('a', { class: 'heute', href: `#/${ort.art}` }, texte.heute),
  )
}
