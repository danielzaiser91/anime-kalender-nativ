// Die Suche (wird erst beim ersten Öffnen geladen): Suchbegriff und Filter aus der Adresse, Treffer aus dem Katalog.
import { h } from '../dom.js'
import { ansichten } from '../bausteine/ansichten.js'
import { fussnote } from '../bausteine/seitenrahmen.js'
import { aktiveZeile, listenZeile, schnellZeile, werteZeile } from '../bausteine/filter-leiste.js'
import { suchformular } from '../bausteine/suchformular.js'
import { trefferliste } from '../bausteine/trefferliste.js'
import { filtere, sichtbareTitel, sprecherAuswahl } from '../../logik/filter.js'
import { leseFilter, schreibeFilter } from '../../logik/filter-adresse.js'
import { suche } from '../../logik/suche.js'
import { hashFuerOrt } from '../../zustand/router.js'

const ziel = (filter) => hashFuerOrt({ art: 'suche', schluessel: schreibeFilter(filter) })
const meldung = (text) => h('p', { class: 'leer', role: 'status' }, text)

/** Die Treffer: erst die Filter, dann die Suche über das, was übrig bleibt (wie auf der Hauptseite). */
function trefferVon({ katalog, merk }, filter) {
  const umfeld = { favoriten: merk.favoriten, ecchi: merk.ecchi, sprecher: sprecherAuswahl(filter, (name) => katalog.sprecher.get(name) ?? []) }
  return suche(filtere(katalog.titel, filter, umfeld), filter.q)
}

/** Was fehlt oder nicht stimmt: Nachträge noch unterwegs oder gescheitert, ein Sprecher-Name, den es nicht gibt (dann 0 Treffer). */
function hinweis(katalog, filter) {
  if (katalog.weitere === 'fehler') return meldung('Weitere Namen und Sprecher konnten nicht geladen werden: die Suche nutzt nur die Katalognamen, der Sprecher-Filter fehlt.')
  if (katalog.weitere !== true) return meldung('Weitere Namen und Sprecher werden geladen …')
  const unbekannt = [...filter.mit.sp, ...filter.ohne.sp].filter((name) => !katalog.sprecherNamen.includes(name))
  return unbekannt.length > 0 && meldung(`Kein Sprecher mit diesem Namen: ${unbekannt.join(', ')}. Einen Namen aus der Liste wählen.`)
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
    hinweis(katalog, filter),
    h('p', { class: 'treffer-zahl', role: 'status' }, `${treffer.length} Treffer`),
    trefferliste(treffer, { ort, merk }),
  ]
}

export function katalogseite(zustand) {
  const geladen = zustand.katalog && zustand.status !== 'fehler'
  const rumpf = geladen ? inhalt(zustand) : h('p', { class: 'meldung', role: 'status' }, zustand.status === 'fehler' ? `Die Daten konnten nicht geladen werden (${zustand.fehler}).` : 'Lädt …')
  return h('div', { class: 'wochenseite katalogseite', 'aria-busy': zustand.status === 'laedt' ? 'true' : 'false' }, h('div', { class: 'leiste' }, ansichten(zustand)), rumpf, fussnote(zustand.stand))
}
