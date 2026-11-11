// Die Ablage unter den Vorschlägen: als "Nicht interessiert" oder "Schon gesehen" gemerkte Titel, einzeln zurückholbar.
import { h } from '../dom.js'
import { ablageEintraege } from '../../logik/gucken-reise.js'

function zeile(k, liste) {
  const zurueck = h('button', { type: 'button', class: 'schalter', 'data-aktion': 'gucken-zurueckholen', 'data-liste': liste, 'data-ak': k.id, 'aria-label': `${k.n} zurückholen`, 'data-fokus': `gucken-zurueckholen-${k.id}` }, 'Zurückholen')
  return h('li', {}, h('span', {}, k.n), zurueck)
}

function gruppe({ titel, liste }, g, merk) {
  const eintraege = ablageEintraege(g.kontext, merk[liste])
  if (!eintraege.length) return null
  return h('details', { class: 'gruppe gucken-ablage' }, h('summary', {}, `${titel} (${eintraege.length})`), h('ul', { class: 'gucken-ablage-liste' }, eintraege.map((k) => zeile(k, liste))))
}

export function ablage(g, merk) {
  const gruppen = [{ titel: 'Nicht interessiert', liste: 'empfVerworfen' }, { titel: 'Schon gesehen', liste: 'empfGesehen' }]
  return h('div', {}, gruppen.map((eintrag) => gruppe(eintrag, g, merk)))
}
