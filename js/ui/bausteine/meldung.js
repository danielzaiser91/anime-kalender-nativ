// Meldung im Dialog mit Schließen-Knopf (Panel lädt, Titel fehlt, Panel-Code nicht ladbar); `kopf` ist optional die Überschrift.
import { h } from '../dom.js'

export function meldung(text, schliessen, kopf = null) {
  const zu = h('button', { type: 'button', class: 'panel-knopf' }, 'Schließen')
  zu.addEventListener('click', schliessen)
  return h('div', { class: 'panel-inhalt' }, kopf, h('p', { class: 'meldung', role: 'status' }, text), zu)
}
