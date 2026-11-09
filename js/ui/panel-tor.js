// Tor zum Panel: lädt den Code erst, wenn ein Titel in der Adresse steht.
import { hashFuerOrt } from '../zustand/router.js'
import { meldung } from './bausteine/meldung.js'

function verdrahte(dialog, { store, fenster }) {
  if (dialog.dataset.verdrahtet) return
  dialog.dataset.verdrahtet = 'ja'
  dialog.addEventListener('close', () => {
    const { titel, ort } = store.lies()
    if (titel) fenster.location.hash = hashFuerOrt(ort)
  })
  dialog.addEventListener('click', (ereignis) => {
    if (ereignis.target === dialog) dialog.close()
  })
}

function zeigeFehler(dialog) {
  dialog.replaceChildren(meldung('Das Panel konnte nicht geladen werden. Seite neu laden und noch einmal versuchen.', () => dialog.close()))
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
