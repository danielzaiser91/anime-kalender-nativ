// Die Suche (wird erst beim ersten Öffnen geladen): Suchbegriff und Filter aus der Adresse, Treffer aus dem Katalog.
import { h } from '../dom.js'
import { fussnote } from '../bausteine/seitenrahmen.js'
import { aktiveZeile, listenZeile, schnellZeile, werteZeile } from '../bausteine/filter-leiste.js'
import { suchformular } from '../bausteine/suchformular.js'
import { trefferliste } from '../bausteine/trefferliste.js'
import { filtere, sichtbareTitel, sprecherAuswahl } from '../../logik/filter.js'
import { leseFilter, schreibeFilter } from '../../logik/filter-adresse.js'
import { suche } from '../../logik/suche.js'
import { hashFuerOrt } from '../../zustand/router.js'

const ziel = (filter) => hashFuerOrt({ art: 'suche', schluessel: schreibeFilter(filter) })

/** Die Treffer: erst die Filter, dann die Suche über das, was übrig bleibt (wie auf der Hauptseite). */
function trefferVon({ katalog, merk }, filter) {
  const umfeld = { favoriten: merk.favoriten, ecchi: merk.ecchi, sprecher: sprecherAuswahl(filter, (name) => katalog.sprecher.get(name) ?? []) }
  return suche(filtere(katalog.titel, filter, umfeld), filter.q)
}

function nachtraege(katalog) {
  return !katalog.weitere && h('p', { class: 'leer', role: 'status' }, 'Weitere Namen und Sprecher werden geladen …')
}

function inhalt(zustand) {
  const { katalog, ort, merk } = zustand
  const filter = leseFilter(ort.schluessel)
  const kontext = { filter, ziel, titel: sichtbareTitel(katalog.titel, merk.ecchi) }
  const treffer = trefferVon(zustand, filter)
  return [
    suchformular({ filter, sprecherNamen: katalog.sprecherNamen }),
    schnellZeile(kontext),
    aktiveZeile(kontext),
    listenZeile(kontext),
    werteZeile(kontext),
    nachtraege(katalog),
    h('p', { class: 'treffer-zahl', role: 'status' }, `${treffer.length} Treffer`),
    trefferliste(treffer, { ort, merk }),
  ]
}

function navigation() {
  const link = (art, text, aktuell) => h('a', { class: 'ansicht', href: `#/${art}`, 'aria-current': aktuell ? 'page' : undefined }, text)
  return h('nav', { class: 'ansichten', 'aria-label': 'Ansicht' }, link('woche', 'Woche'), link('monat', 'Monat'), link('suche', 'Suche', true))
}

export function katalogseite(zustand) {
  const geladen = zustand.katalog && zustand.status !== 'fehler'
  const rumpf = geladen ? inhalt(zustand) : h('p', { class: 'meldung', role: 'status' }, zustand.status === 'fehler' ? `Die Daten konnten nicht geladen werden (${zustand.fehler}).` : 'Lädt …')
  return h('div', { class: 'wochenseite katalogseite', 'aria-busy': zustand.status === 'laedt' ? 'true' : 'false' }, h('div', { class: 'leiste' }, navigation()), rumpf, fussnote(zustand.stand))
}
