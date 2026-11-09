// Die Abschnitte des Panels unter der Bühne: Antwort-Kasten, Wege, Termine, Eckdaten. Worte kommen fertig aus logik/ (panel-sicht.js).
import { h } from '../dom.js'
import { STATUS_TEXT } from '../../logik/wege.js'

const ART_KLASSE = { laeuft: 'kasten-laeuft', fertig: 'kasten-fertig', teilweise: 'kasten-teilweise', film: 'kasten-film', filmDe: 'kasten-film', disc: 'kasten-disc', ohne: 'kasten-ohne' }
const IMMER_GUT = new Set(['belegt', 'jwDeutsch'])

export function antwortKasten({ antwort, text, luecke }) {
  const zaehl = text.zaehl && h('p', { class: 'kasten-zaehl' }, h('strong', {}, String(text.zaehl.raus)), ` ${text.zaehl.rest}`)
  return h(
    'section',
    { class: `kasten ${ART_KLASSE[antwort.art] ?? ''}`, 'aria-label': 'Auf Deutsch' },
    h('h3', { class: 'kasten-haupt' }, text.haupt),
    text.satz && h('p', { class: 'kasten-satz' }, text.satz),
    zaehl,
    text.neben && h('p', { class: 'kasten-neben' }, text.neben),
    luecke && h('p', { class: 'kasten-neben' }, `Für Folgen ${luecke} kennen wir keinen deutschen Anbieter.`),
  )
}

function wegZeile(weg) {
  const name = weg.url ? h('a', { href: weg.url, rel: 'noopener', target: '_blank' }, weg.name) : weg.name
  return h(
    'li',
    { class: 'weg' },
    h('span', { class: 'weg-name' }, name),
    weg.folgen && h('span', { class: 'weg-folgen' }, weg.folgen),
    weg.status && h('span', { class: `weg-status ${IMMER_GUT.has(weg.status) ? 'gut' : ''}` }, STATUS_TEXT[weg.status]),
    weg.hinweise.length > 0 && h('span', { class: 'weg-hinweis' }, weg.hinweise.join(' ')),
  )
}

const wegGruppe = (g) => h('div', { class: 'weg-gruppe' }, g.zeigeName && h('h4', {}, g.name), h('ul', { class: 'wege' }, g.zeilen.map(wegZeile)))

export function wegeListe(gruppen) {
  return gruppen.length ? h('section', { class: 'panel-abschnitt', 'aria-label': 'Wege' }, h('h3', {}, 'Wo ansehen'), gruppen.map(wegGruppe)) : null
}

function terminZeile(t) {
  return h('li', { class: 'termin' }, h('span', { class: 'termin-datum' }, t.datum), t.zeit && h('span', { class: 'termin-zeit' }, t.zeit), h('span', { class: 'termin-text' }, t.text), t.marke && h('span', { class: 'termin-marke' }, t.marke))
}

function terminGruppe(ueberschrift, zeilen, mehr) {
  if (!zeilen.length) return null
  return h('div', { class: 'termin-gruppe' }, h('h4', {}, ueberschrift), h('ul', { class: 'termine-liste' }, zeilen.map(terminZeile)), mehr > 0 && h('p', { class: 'leise' }, `und ${mehr} weitere`))
}

export function terminAbschnitt(termine) {
  if (!termine.kommend.length && !termine.vorbei.length) return null
  const inhalt = [terminGruppe('Kommend', termine.kommend, termine.mehrKommend), terminGruppe('Zuletzt erschienen', termine.vorbei, termine.mehrVorbei)]
  return h('section', { class: 'panel-abschnitt', 'aria-label': 'Termine' }, h('h3', {}, 'Termine'), inhalt)
}

export function eckdatenAbschnitt(daten) {
  if (!daten.length) return null
  const zeilen = daten.flatMap(([name, wert]) => [h('dt', {}, name), h('dd', {}, wert)])
  return h('section', { class: 'panel-abschnitt', 'aria-label': 'Eckdaten' }, h('h3', {}, 'Eckdaten'), h('dl', { class: 'eckdaten' }, zeilen))
}
