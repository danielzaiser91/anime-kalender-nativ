// Das Panel eines Titels als <dialog>; wird erst beim ersten Öffnen geladen (panel-tor.js).
import { h } from '../dom.js'
import { meldung } from '../bausteine/meldung.js'
import { heuteInBerlin } from '../../logik/zeit.js'
import { panelSicht } from '../../logik/panel-sicht.js'
import { buehne, TITEL_ID } from './buehne.js'
import { antwortKasten, eckdatenAbschnitt, terminAbschnitt, wegeListe } from './abschnitte.js'

function ladeMeldung(panel, schliessen) {
  const text = panel.status === 'fehler' ? `Der Titel konnte nicht geladen werden (${panel.fehler}).` : 'Lädt …'
  return meldung(text, schliessen, h('h2', { id: TITEL_ID }, 'Titel'))
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
  dialog.replaceChildren(panel.status === 'bereit' ? inhalt({ ...zustand, panel }, schliessen) : ladeMeldung(panel, schliessen))
  if (!dialog.open) dialog.showModal()
}
