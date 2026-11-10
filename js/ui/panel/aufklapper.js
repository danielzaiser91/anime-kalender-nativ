// Aufklapper (<details>), dessen Inhalt erst beim ersten Öffnen geholt wird.
import { h } from '../dom.js'

/** `fuelle(innen, kopf)` läuft einmal, beim ersten Öffnen; `kopf` ist die Überschrift, die sich nachträglich ergänzen lässt. */
export function aufklapper({ titel, klasse = '' }, fuelle) {
  const kopf = h('summary', {}, titel)
  const innen = h('div', { class: 'aufklapp-inhalt' })
  const knoten = h('details', { class: `panel-abschnitt aufklapper ${klasse}`.trim() }, kopf, innen)
  let gefuellt = false
  knoten.addEventListener('toggle', () => {
    if (!knoten.open || gefuellt) return
    gefuellt = true
    fuelle(innen, kopf)
  })
  return knoten
}

/** Eine Zeile Text im Inhalt eines Aufklappers: Laden, Fehler, leer. */
export const hinweis = (text) => h('p', { class: 'leise' }, text)
