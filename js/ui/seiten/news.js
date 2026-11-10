// Die News (wird erst beim ersten Öffnen geladen): Meldungen je Tag, Filter nach Art, ältere auf Knopfdruck, dazu der RSS-Feed.
import { h } from '../dom.js'
import { ansichtsrahmen, ladeMeldung } from '../bausteine/seitenrahmen.js'
import { wahlLink } from '../bausteine/filter-wahl.js'
import { newsEintrag } from '../bausteine/news-eintrag.js'
import { nachArt, sichtbareTage, TAGE_SCHRITT, teileGleichmelder, zaehleArten, leseNewsAbfrage, schreibeNewsAbfrage, newsGrenze } from '../../logik/news.js'
import { tagUeberschrift, datumKurz } from '../../logik/wochentext.js'
import { hashFuerOrt } from '../../zustand/router.js'

const ziel = (abfrage) => hashFuerOrt({ art: 'news', schluessel: schreibeNewsAbfrage(abfrage) })

function artenLeiste(arten, abfrage) {
  const alle = wahlLink({ text: 'Alles', zustand: abfrage.art ? 'nichts' : 'mit', ziel: ziel({ ...abfrage, art: null }), fokus: 'news-alles' })
  const links = arten.map((a) => wahlLink({ text: `${a.label} ${a.zahl}`, zustand: abfrage.art === a.art ? 'mit' : 'nichts', ziel: ziel({ ...abfrage, art: abfrage.art === a.art ? null : a.art }), fokus: `news-${a.art}` }))
  return h('div', { class: 'wahl-zeile', role: 'group', 'aria-label': 'Nach Art filtern' }, alle, links)
}

function tagKnoten(tag, kontext) {
  const { normal, gleich } = teileGleichmelder(tag.eintraege)
  const liste = (eintraege) => h('ol', { class: 'termine' }, eintraege.map((e) => newsEintrag(e, kontext)))
  const jahr = tag.am.slice(0, 4) === kontext.heute.slice(0, 4) ? '' : ` ${tag.am.slice(0, 4)}`
  const ueberschrift = h('h2', { id: `news-${tag.am}` }, `${tagUeberschrift(tag.am)}${jahr}`, tag.am === kontext.heute && h('span', { class: 'heute-marke' }, 'heute'))
  const weitere = gleich.length > 0 && h('details', { class: 'gleich' }, h('summary', {}, `${gleich.length} weitere „auch bei …“-Meldungen`), liste(gleich))
  return h('section', { class: 'tag', 'aria-labelledby': `news-${tag.am}` }, ueberschrift, normal.length > 0 && liste(normal), weitere)
}

function kopf(news) {
  const rss = h('a', { class: 'rss', href: 'data/feeds/news.xml', type: 'application/rss+xml' }, 'RSS-Feed')
  return h('div', { class: 'seitenkopf' }, h('h2', { class: 'seiten-titel' }, 'Was sich getan hat'), h('p', {}, `seit ${datumKurz(news.grenze)} · `, rss))
}

function aeltere(news, abfrage, heute) {
  if (!news.aelteres) return null
  const tage = abfrage.tage + TAGE_SCHRITT
  return h('a', { class: 'schalter aeltere', href: ziel({ ...abfrage, tage }) }, `Ältere News (bis ${datumKurz(newsGrenze(heute, tage))})`)
}

function inhalt(zustand) {
  const meldung = ladeMeldung(zustand)
  if (meldung) return meldung
  const { news } = zustand.daten
  const abfrage = leseNewsAbfrage(zustand.ort.schluessel)
  const sichtbar = sichtbareTage(news.tage, { grenze: news.grenze, ecchi: zustand.merk.ecchi })
  const tage = nachArt(sichtbar, abfrage.art)
  const kontext = { ort: zustand.ort, heute: zustand.heute }
  return h(
    'div',
    {},
    kopf(news),
    artenLeiste(zaehleArten(sichtbar), abfrage),
    tage.length > 0 ? tage.map((tag) => tagKnoten(tag, kontext)) : h('p', { class: 'leer' }, 'Keine Meldungen in diesem Zeitraum.'),
    aeltere(news, abfrage, zustand.heute),
  )
}

export const newsseite = (zustand) => ansichtsrahmen(zustand, 'newsseite', inhalt(zustand))
