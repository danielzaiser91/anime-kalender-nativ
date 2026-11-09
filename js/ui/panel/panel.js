// Das Panel eines Titels als <dialog>: Bühne, Antwort-Kasten, Wege, Termine, Eckdaten. Wird erst beim ersten Öffnen geladen (panel-tor.js).
import { h } from '../dom.js'
import { heuteInBerlin } from '../../logik/zeit.js'
import { panelSicht } from '../../logik/panel-sicht.js'
import { buehne, TITEL_ID } from './buehne.js'
import { antwortKasten, eckdatenAbschnitt, terminAbschnitt, wegeListe } from './abschnitte.js'

function meldung(panel, schliessen) {
  const zu = h('button', { type: 'button', class: 'panel-knopf', autofocus: true }, 'Schließen')
  zu.addEventListener('click', schliessen)
  const text = panel.status === 'fehler' ? `Der Titel konnte nicht geladen werden (${panel.fehler}).` : 'Lädt …'
  return h('div', { class: 'panel-inhalt' }, h('h2', { id: TITEL_ID }, 'Titel'), h('p', { class: 'meldung', role: 'status' }, text), zu)
}

function inhalt(zustand, schliessen) {
  const { titel } = zustand.panel
  const sicht = panelSicht(titel, { heute: heuteInBerlin(zustand.jetzt), jetzt: zustand.jetzt })
  const adresse = () => document.location.href
  return h('article', { class: 'panel-inhalt' }, buehne(titel, { schliessen, adresse }), antwortKasten(sicht), wegeListe(sicht.wege), terminAbschnitt(sicht.termine), eckdatenAbschnitt(sicht.daten))
}

/** Zeichnet das Panel des jetzigen Zustands (`lies`) neu und öffnet den Dialog, falls er zu ist. */
export function zeigePanel(dialog, { lies, schliessen }) {
  const { panel, ...zustand } = lies()
  if (!panel) return
  dialog.setAttribute('aria-labelledby', TITEL_ID)
  dialog.replaceChildren(panel.status === 'bereit' ? inhalt({ ...zustand, panel }, schliessen) : meldung(panel, schliessen))
  if (!dialog.open) dialog.showModal()
}
