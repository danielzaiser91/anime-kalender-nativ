// Das Suchformular: Suchbegriff und, bei geöffneter Sprecher-Liste, ein Feld für einen weiteren Sprecher. Alle gesetzten Filter reisen als versteckte Felder
// mit; ui/aktionen.js macht daraus die Adresse (leere Felder fallen weg).
import { h } from '../dom.js'
import { LISTEN } from '../../logik/filter.js'

function versteckt(name, werte) {
  return werte.length ? h('input', { type: 'hidden', name, value: werte.join(',') }) : null
}

function filterFelder(filter) {
  const listen = LISTEN.flatMap((liste) => [versteckt(liste, filter.mit[liste]), versteckt(`x${liste}`, filter.ohne[liste])])
  const schnell = Object.entries(filter.schnell).filter(([, z]) => z).map(([feld, z]) => versteckt(feld, [z === 'ja' ? '1' : '0']))
  return [...listen, ...schnell, versteckt('f', filter.offen ? [filter.offen] : [])]
}

function sprecherFeld(namen) {
  return h(
    'label',
    { class: 'suchfeld' },
    h('span', {}, 'Sprecher hinzufügen'),
    h('input', { type: 'text', name: 'sp', list: 'sprecher-namen', autocomplete: 'off', placeholder: 'Name, wie in der Liste' }),
    h('datalist', { id: 'sprecher-namen' }, namen.map((name) => h('option', { value: name }))),
  )
}

export function suchformular({ filter, sprecherNamen }) {
  const suche = h('input', { type: 'search', name: 'q', value: filter.q, 'data-fokus': 'suche', placeholder: 'Titel, Studio, Genre …', autocomplete: 'off' })
  return h(
    'form',
    { class: 'suchformular', role: 'search', 'data-absenden': 'suche' },
    h('label', { class: 'suchfeld' }, h('span', {}, 'Suche'), suche),
    filter.offen === 'sp' && sprecherFeld(sprecherNamen),
    ...filterFelder(filter),
    h('button', { type: 'submit', class: 'schalter' }, 'Suchen'),
  )
}
