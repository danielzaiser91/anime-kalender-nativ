// Monatsansicht (wird erst beim ersten Öffnen geladen): Raster Montag bis Sonntag, je Tag Titel mit Uhrzeit; schmal eine Liste der Tage mit Terminen.
import { h } from '../dom.js'
import { ladeMeldung, seitenrahmen } from '../bausteine/seitenrahmen.js'
import { istFavorit, istGesehen } from '../../logik/merken.js'
import { monatsraster } from '../../logik/monat.js'
import { gruppiereNachTag } from '../../logik/woche.js'
import { zeitText } from '../../logik/folge.js'
import { wochentagName } from '../../logik/wochentext.js'
import { hashFuerTitel } from '../../zustand/router.js'

function marken(termin, { ak, merk }) {
  const gesehen = Number(termin.episode) > 0 && istGesehen(merk, ak, Number(termin.episode))
  return [ak && istFavorit(merk, ak) && h('span', { class: 'mmarke', role: 'img', 'aria-label': 'Favorit' }, '★'), gesehen && h('span', { class: 'mmarke', role: 'img', 'aria-label': 'gesehen' }, '✓')]
}

function eintrag(termin, kontext) {
  const ak = kontext.titel[termin.titleId]?.ak
  const name = ak ? h('a', { href: hashFuerTitel(kontext.ort, ak), 'aria-haspopup': 'dialog' }, termin.name) : termin.name
  return h('li', { class: 'meintrag' }, zeitText(termin) && h('span', { class: 'mzeit' }, zeitText(termin)), name, marken(termin, { ak, merk: kontext.merk }))
}

function tagesZelle(tag, kontext) {
  const klassen = ['mtag', tag.imMonat ? '' : 'fremd', tag.termine.length ? '' : 'leer', tag.datum === kontext.heute ? 'heute' : ''].filter(Boolean).join(' ')
  const kopf = h('p', { class: 'mdatum' }, h('span', { class: 'mname' }, `${wochentagName(tag.datum)} `), `${Number(tag.datum.slice(8))}.`)
  if (!tag.imMonat) return h('li', { class: klassen, 'aria-hidden': 'true' })
  return h('li', { class: klassen }, kopf, h('ul', { class: 'meintraege' }, tag.termine.map((t) => eintrag(t, kontext))))
}

function raster(zustand) {
  const kontext = { titel: zustand.daten.titel, ort: zustand.ort, merk: zustand.merk, heute: zustand.heute }
  const zeilen = monatsraster(zustand.ort.schluessel)
  const tage = gruppiereNachTag(zustand.daten.termine, zeilen.flat().map((tag) => tag.datum))
  const kopf = zeilen[0].map((tag) => h('li', {}, wochentagName(tag.datum).slice(0, 2)))
  const zellen = zeilen.flat().map((tag, i) => tagesZelle({ ...tag, termine: tage[i].termine }, kontext))
  return h('div', { class: 'monat' }, h('ul', { class: 'monat-kopf', 'aria-hidden': 'true' }, kopf), h('ol', { class: 'monat-raster' }, zellen))
}

export const monatsseite = (zustand) => seitenrahmen(zustand, ladeMeldung(zustand) ?? raster(zustand))
