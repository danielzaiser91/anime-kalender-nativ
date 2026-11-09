// Handlungen der Oberfläche über Ereignisse an der Hülle: Knöpfe mit data-aktion (Favorit, Gesehen, nur Favoriten, Einstellungen) und der Datum-Sprung.
import { schalteFavorit, schalteGesehen, setzeOption } from '../logik/merken.js'
import { sprungOrt } from '../logik/ort.js'
import { aendereMerk } from '../zustand/merk.js'
import { hashFuerOrt } from '../zustand/router.js'

const AENDERUNGEN = {
  favorit: (daten) => (merk) => schalteFavorit(merk, daten.ak),
  gesehen: (daten) => (merk) => schalteGesehen(merk, daten.ak, Number(daten.folge)),
  'nur-favoriten': () => (merk) => setzeOption(merk, 'nurFavoriten', !merk.nurFavoriten),
}

async function oeffneEinstellungen(knopf, { dialog, abhaengigkeiten }) {
  try {
    const { oeffneEinstellungen: oeffne } = await import('./einstellungen/einstellungen.js')
    oeffne(dialog, abhaengigkeiten)
  } catch {
    knopf.textContent = 'Nicht ladbar, Seite neu laden'
  }
}

export function verdrahteAktionen({ wurzel, dialog, abhaengigkeiten }) {
  dialog.addEventListener('close', () => wurzel.querySelector('[data-fokus="einstellungen"]')?.focus())
  dialog.addEventListener('click', (ereignis) => {
    if (ereignis.target === dialog) dialog.close()
  })
  wurzel.addEventListener('click', (ereignis) => {
    const knopf = ereignis.target.closest('[data-aktion]')
    const aktion = knopf?.dataset.aktion
    if (aktion === 'einstellungen') oeffneEinstellungen(knopf, { dialog, abhaengigkeiten })
    else if (AENDERUNGEN[aktion]) aendereMerk(abhaengigkeiten, AENDERUNGEN[aktion](knopf.dataset))
  })
  wurzel.addEventListener('submit', (ereignis) => {
    const formular = ereignis.target.closest('form.sprung')
    if (!formular) return
    ereignis.preventDefault()
    const datum = new FormData(formular).get('datum')
    if (datum) abhaengigkeiten.fenster.location.hash = hashFuerOrt(sprungOrt(formular.dataset.art, datum))
  })
}
