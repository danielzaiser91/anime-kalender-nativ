// Reihe des Titels (Baustein, lazy): alle Teile in Gruppen (Hauptserie, Filme, Specials), Teile ohne Synchro oder noch nicht erschienen hinter einem Aufklapper (Hauptseite: reihen-liste.tsx).
import { h } from '../dom.js'
import { angabenZeile, hauptstaffeln, reihenGruppen, reihenName, reihenZeile, teilName } from '../../logik/reihe.js'
import { erscheintErst } from '../../logik/start.js'
import { hashFuerTitel } from '../../zustand/router.js'

const eingeklappt = (m, kontext) => (Boolean(m.ohneSynchro) || erscheintErst(m, kontext.heute)) && m.ak !== kontext.ak

function marke(m, heute) {
  if (erscheintErst(m, heute)) return h('span', { class: 'reihe-marke geplant', title: 'Das Original ist noch nicht erschienen' }, 'Geplant')
  return m.ohneSynchro ? h('span', { class: 'reihe-marke ohne', title: 'Keine deutsche Synchro' }, 'DE ✕') : null
}

function cover(m) {
  return m.cover ? h('img', { class: 'reihe-cover', src: m.cover, alt: '', width: '36', height: '54', loading: 'lazy', decoding: 'async' }) : h('span', { class: 'reihe-cover reihe-cover-leer', 'aria-hidden': 'true' })
}

function inhalt(m, kontext) {
  const name = teilName(m, { name: kontext.name, haupt: kontext.haupt.has(m) })
  return [cover(m), h('span', { class: 'reihe-text' }, h('span', { class: 'reihe-name' }, name), h('span', { class: 'leise' }, angabenZeile(m, kontext.heute))), marke(m, kontext.heute)]
}

function zeile(m, kontext) {
  const aktuell = m.ak === kontext.ak
  if (aktuell || !m.ak) return h('li', { class: `reihe-teil ${aktuell ? 'aktuell' : ''}`.trim(), 'aria-current': aktuell ? 'true' : undefined }, inhalt(m, kontext))
  return h('li', { class: 'reihe-teil' }, h('a', { href: hashFuerTitel(kontext.ort, m.ak), 'aria-haspopup': 'dialog' }, inhalt(m, kontext)))
}

const liste = (teile, kontext) => h('ul', { class: 'reihe-liste' }, teile.map((m) => zeile(m, kontext)))

function eingeklapptBlock(teile, kontext) {
  if (!teile.length) return null
  return h('details', { class: 'reihe-ohne' }, h('summary', {}, `Teile ohne Synchro zeigen (${teile.length})`), liste(teile, kontext))
}

function gruppe({ titel, teile }, kontext) {
  const sichtbar = teile.filter((m) => !eingeklappt(m, kontext))
  if (!sichtbar.length) return null
  return h('div', { class: 'reihe-gruppe' }, h('h4', {}, titel), liste(sichtbar, kontext))
}

export async function reiheAbschnitt({ titel, lader, ort, heute, ecchi }) {
  const daten = await lader.ladeReihe(titel.reihe)
  const teile = daten.teile.filter((m) => ecchi || !m.ecchi || m.ak === titel.ak)
  if (teile.length < 2) return null
  const kontext = { ak: titel.ak, ort, heute, name: reihenName(teile), haupt: new Set(hauptstaffeln(teile)) }
  const gruppen = reihenGruppen(teile)
  const ohne = gruppen.flatMap((g) => g.teile).filter((m) => eingeklappt(m, kontext))
  return h('section', { class: 'panel-abschnitt', 'aria-label': 'Reihe' }, h('h3', {}, `Reihe (${teile.length})`), h('p', { class: 'leise' }, reihenZeile(teile)), gruppen.map((g) => gruppe(g, kontext)), eingeklapptBlock(ohne, kontext))
}
