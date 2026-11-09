// Das Tor zum Panel: lädt den Panel-Code erst, wenn ein Titel in der Adresse steht, und hält den <dialog> im Takt mit dem Store.
import { hashFuerWoche } from '../zustand/router.js'

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

const stempel = (panel) => `${panel.ak}|${panel.status}`

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
  const { zeigePanel } = await import('./panel/panel.js')
  await zeigePanel(dialog, { lies: store.lies, schliessen: () => dialog.close() })
}
