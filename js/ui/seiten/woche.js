// Wochenansicht wie die Poster-Woche der Hauptseite: je Tag Kopf, Poster-Raster, "Im Handel" und "Im Fernsehen".
import { h } from '../dom.js'
import { poster } from '../bausteine/poster.js'
import { fernsehKasten, handelKasten } from '../bausteine/kaesten.js'
import { ladeMeldung, seitenrahmen } from '../bausteine/seitenrahmen.js'
import { tageDerWoche, uhrInBerlin } from '../../logik/zeit.js'
import { gruppiereNachTag } from '../../logik/woche.js'
import { teileTag, zaehlung } from '../../logik/woche-teile.js'
import { tagKurz, tagZahl } from '../../logik/wochentext.js'

function tagKopf(datum, teile, heute) {
  const name = heute ? `${tagKurz(datum)} · heute` : tagKurz(datum)
  return h('div', { class: 'tag-kopf' }, h('span', { class: 'tag-zahl' }, tagZahl(datum)), h('h2', { id: `tag-${datum}` }, name), h('span', { class: 'tag-zaehlung' }, zaehlung(teile)))
}

/** Raster der Poster; ohne Streaming-Termine nur der Hinweis, und der nur, wenn auch Fernsehen und Handel leer sind. */
function raster({ stream, tv, disc }, kontext) {
  if (stream.length) return h('ol', { class: 'poster-raster' }, stream.map((t) => poster(t, kontext)))
  return tv.length || disc.length ? null : h('p', { class: 'tag-leer' }, 'Kein Termin an diesem Tag.')
}

function tagKnoten(tag, kontext) {
  const teile = teileTag(tag.termine)
  const heute = tag.datum === kontext.heute
  const klasse = ['wtag', heute && 'wtag-heute', tag.datum < kontext.heute && 'wtag-vorbei'].filter(Boolean).join(' ')
  return h('section', { class: klasse, 'aria-labelledby': `tag-${tag.datum}` }, tagKopf(tag.datum, teile, heute), raster(teile, kontext), handelKasten(teile.disc, kontext), fernsehKasten(teile.tv, kontext))
}

function inhalt(zustand) {
  const meldung = ladeMeldung(zustand)
  if (meldung) return meldung
  const tage = gruppiereNachTag(zustand.daten.termine, tageDerWoche(zustand.ort.schluessel))
  const kontext = { titel: zustand.daten.titel, heute: zustand.heute, uhr: zustand.jetzt && uhrInBerlin(zustand.jetzt), ort: zustand.ort, merk: zustand.merk }
  return h('div', { class: 'tage' }, tage.map((tag) => tagKnoten(tag, kontext)))
}

export const wochenseite = (zustand) => seitenrahmen(zustand, inhalt(zustand))
