// Tor zum Panel: lädt den Code erst, wenn ein Titel in der Adresse steht.
import { hashFuerWoche } from '../zustand/router.js'
import { h } from './dom.js'

function verdrahte(dialog, { store, fenster }) {
  if (dialog.dataset.verdrahtet) return
  dialog.dataset.verdrahtet = 'ja'
  dialog.addEventListener('close', () => {
    const { titel, woche } = store.lies()
    if (titel) fenster.location.hash = hashFuerWoche(woche)
  })
  dialog.addEventListener('click', (ereignis) => {
    if (ereignis.target === dialog) dialog.close()
  })
}

function zeigeFehler(dialog) {
  const zu = h('button', { type: 'button', class: 'panel-knopf' }, 'Schließen')
  zu.addEventListener('click', () => dialog.close())
  dialog.replaceChildren(h('div', { class: 'panel-inhalt' }, h('p', { class: 'meldung', role: 'status' }, 'Das Panel konnte nicht geladen werden. Seite neu laden und noch einmal versuchen.'), zu))
  if (!dialog.open) dialog.showModal()
}

const stempel =(panel) => `${panel.ak}|${panel.status}`

export async function aktualisierePanel(dialog, abhaengigkeiten) {
  const { store } = abhaengigkeiten
  const { panel } = store.lies()
  if (!panel) {
    delete dialog.dataset.zeigt
    if (dialog.open) dialog.close()
    return
  }
  if (dialog.dataset.zeigt === stempel(panel)) return
  dialog.dataset.zeigt = stempel(panel)
  verdrahte(dialog, abhaengigkeiten)
  try {
    const { zeigePanel } = await import('./panel/panel.js')
    await zeigePanel(dialog, { lies: store.lies, schliessen: () => dialog.close() })
  } catch {
    delete dialog.dataset.zeigt
    zeigeFehler(dialog)
  }
}
