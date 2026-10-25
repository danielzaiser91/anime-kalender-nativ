// Kopf der Wochenansicht: Spanne, Blättern, "Diese Woche". Blättern sind echte Links (Hash).
import { h } from '../dom.js'
import { hashFuerWoche } from '../../zustand/router.js'
import { verschiebeWoche, wocheVon } from '../../logik/zeit.js'
import { kalenderwoche, wochenSpanne } from '../../logik/wochentext.js'

// Schmal zeigt nur der Pfeil; der Name für Screenreader kommt aus aria-label.
function blaettern({ pfeil, wort, name, ziel, erlaubt, klasse }) {
  const inhalt = klasse === 'zurueck' ? [pfeil, h('span', { class: 'wort' }, ` ${wort}`)] : [h('span', { class: 'wort' }, `${wort} `), pfeil]
  const attribute = { class: `blaettern ${klasse}`, 'aria-label': name }
  if (!erlaubt) return h('span', { ...attribute, 'aria-disabled': 'true' }, inhalt)
  return h('a', { ...attribute, href: hashFuerWoche(ziel) }, inhalt)
}

export function wochenkopf({ woche, heute, stand }) {
  const vorher = verschiebeWoche(woche, -1)
  const nachher = verschiebeWoche(woche, 1)
  const imBereich = (schluessel) => !stand || (schluessel >= stand.von && schluessel <= stand.bis)
  return h(
    'nav',
    { class: 'wochenkopf', 'aria-label': 'Woche wählen' },
    blaettern({ pfeil: '‹', wort: 'Vorherige', name: 'Vorherige Woche', ziel: vorher, erlaubt: imBereich(vorher), klasse: 'zurueck' }),
    h('div', { class: 'spanne' }, h('h2', {}, wochenSpanne(woche)), h('p', {}, kalenderwoche(woche))),
    blaettern({ pfeil: '›', wort: 'Nächste', name: 'Nächste Woche', ziel: nachher, erlaubt: imBereich(nachher), klasse: 'vor' }),
    woche !== wocheVon(heute) && h('a', { class: 'heute', href: '#/woche' }, 'Diese Woche'),
  )
}
