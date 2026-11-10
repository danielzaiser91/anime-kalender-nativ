// Ein Bereich im Panel, dessen Code und Daten erst nach dem Öffnen kommen: erst ein unsichtbarer Platz, dann der Baustein; ohne Inhalt bleibt er unsichtbar.
import { h } from '../dom.js'

/** `laden` liefert einen Knoten oder null; ein Fehler zeigt einen Satz mit dem Namen des Bereichs. */
export function lazyBereich(name, laden) {
  const platz = h('div', { class: 'panel-lazy', 'data-baustein': name, hidden: true })
  const zeige = (knoten) => {
    platz.replaceChildren(knoten)
    platz.hidden = false
  }
  laden().then(
    (knoten) => knoten && zeige(knoten),
    () => zeige(h('p', { class: 'leise panel-lazy-fehler' }, `${name} konnte nicht geladen werden.`)),
  )
  return platz
}
