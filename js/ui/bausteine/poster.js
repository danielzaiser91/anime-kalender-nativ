// Poster-Karte der Woche (Hauptseite: PosterKarte.tsx): Cover im Hochformat mit Uhrzeit-Pille und Anbieterstreifen, darunter Titel und "Anbieter · Folge".
// Die ganze Karte öffnet das Panel (der Titellink spannt sich darüber); Stern und "Gesehen" liegen darüber.
import { h } from '../dom.js'
import { folgeZeile, marke, zeitText } from '../../logik/folge.js'
import { istFavorit, istGesehen } from '../../logik/merken.js'
import { anbieterFarbe, seitZeit } from '../../logik/woche-teile.js'
import { hashFuerTitel } from '../../zustand/router.js'
import { schalter } from './schalter.js'

function cover(termin, info, { merk, seit }) {
  const zeit = seit ? `seit ${seit}` : zeitText(termin)
  const bild = info.cover ? h('img', { src: info.cover, alt: '', width: '160', height: '240', loading: 'lazy', decoding: 'async' }) : h('span', { class: 'poster-leer' }, termin.name)
  const stern = info.ak && schalter({ text: '★', name: `Favorit: ${termin.name}`, an: istFavorit(merk, info.ak), aktion: 'favorit', fokus: `fav-${info.ak}-${termin.date}-${termin.time ?? ''}`, klasse: 'poster-stern', daten: { ak: info.ak } })
  return h('div', { class: 'poster-cover' }, bild, zeit && h('span', { class: 'poster-zeit' }, zeit), stern, h('span', { class: 'poster-streifen', style: `background:${anbieterFarbe(termin.platform)}` }))
}

/** "Gesehen" je Folge; ohne Kennung oder Folgennummer (Film, Katalog) gibt es den Knopf nicht. */
function gesehen(termin, ak, { merk }) {
  const folge = !termin.katalog && Number(termin.episode) > 0 ? Number(termin.episode) : 0
  if (!ak || !folge) return null
  return schalter({ text: 'Gesehen', name: `Folge ${folge} gesehen: ${termin.name}`, an: istGesehen(merk, ak, folge), aktion: 'gesehen', fokus: `gesehen-${ak}-${folge}`, klasse: 'poster-gesehen', daten: { ak, folge } })
}

function titel(termin, { ak }, ort) {
  return h('h3', { class: 'poster-titel' }, ak ? h('a', { href: hashFuerTitel(ort, ak), 'aria-haspopup': 'dialog' }, termin.name) : termin.name)
}

export function poster(termin, kontext) {
  const info = kontext.titel[termin.titleId] ?? {}
  const zusatz = marke(termin)
  const seit = seitZeit(termin, kontext)
  return h(
    'li',
    { class: seit ? 'poster poster-vorbei' : 'poster' },
    cover(termin, info, { ...kontext, seit }),
    titel(termin, info, kontext.ort),
    h('p', { class: 'poster-unter' }, folgeZeile(termin)),
    zusatz && h('p', { class: 'poster-marke' }, zusatz),
    gesehen(termin, info.ak, kontext),
  )
}
