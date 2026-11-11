// Handlungen der Oberfläche über Ereignisse an der Hülle: Knöpfe mit data-aktion (Favorit, Gesehen, nur Favoriten, Einstellungen, Patch Notes, Was gucken?) und Formulare mit data-absenden (Datum-Sprung, Suche).
import { schalteFavorit, schalteGesehen, setzeOption } from '../logik/merken.js'
import { sprungOrt } from '../logik/ort.js'
import { aendereMerk } from '../zustand/merk.js'
import { hashFuerOrt } from '../zustand/router.js'

const AENDERUNGEN = {
  favorit: (daten) => (merk) => schalteFavorit(merk, daten.ak),
  gesehen: (daten) => (merk) => schalteGesehen(merk, daten.ak, Number(daten.folge)),
  'nur-favoriten': () => (merk) => setzeOption(merk, 'nurFavoriten', !merk.nurFavoriten),
}

/** Die Ziel-Adresse eines abgeschickten Formulars (leer: nichts tun). Die Suche nimmt alle nicht leeren Felder in die Abfrage. */
const ABSENDEN = {
  sprung: (daten, formular) => daten.get('datum') && hashFuerOrt(sprungOrt(formular.dataset.art, daten.get('datum'))),
  suche: (daten) => {
    const abfrage = new URLSearchParams(daten)
    for (const [name, wert] of [...abfrage]) if (!wert.trim()) abfrage.delete(name)
    return `#/suche${abfrage.size ? `?${abfrage}` : ''}`
  },
}

async function oeffneEinstellungen(knopf, { dialog, abhaengigkeiten }) {
  try {
    const { oeffneEinstellungen: oeffne } = await import('./einstellungen/einstellungen.js')
    oeffne(dialog, abhaengigkeiten)
  } catch {
    knopf.textContent = 'Nicht ladbar, Seite neu laden'
  }
}

/** "Neu auf der Webseite" in demselben Dialog wie die Einstellungen; nach dem Schließen bekommt der Knopf den Fokus zurück. */
async function oeffnePatchnotes(knopf, { dialog, abhaengigkeiten }) {
  try {
    const { oeffnePatchnotes: oeffne } = await import('./patchnotes/patchnotes.js')
    await oeffne(dialog, { abhaengigkeiten, fokusZurueck: knopf })
  } catch {
    knopf.textContent = 'Nicht ladbar, Seite neu laden'
  }
}

/** Die Handlungen von "Was gucken?" (data-aktion "gucken-<name>") liegen in zustand/gucken.js und kommen erst mit der ersten. */
async function fuehreGucken(knopf, abhaengigkeiten) {
  try {
    const { fuehreGuckenAus } = await import('../zustand/gucken.js')
    fuehreGuckenAus(abhaengigkeiten, { aktion: knopf.dataset.aktion.slice('gucken-'.length), daten: knopf.dataset })
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
    else if (aktion === 'patchnotes') oeffnePatchnotes(knopf, { dialog, abhaengigkeiten })
    else if (aktion?.startsWith('gucken-')) fuehreGucken(knopf, abhaengigkeiten)
    else if (AENDERUNGEN[aktion]) aendereMerk(abhaengigkeiten, AENDERUNGEN[aktion](knopf.dataset))
  })
  wurzel.addEventListener('submit', (ereignis) => {
    const formular = ereignis.target.closest('form[data-absenden]')
    if (!formular) return
    ereignis.preventDefault()
    const ziel = ABSENDEN[formular.dataset.absenden](new FormData(formular), formular)
    if (ziel) abhaengigkeiten.fenster.location.hash = ziel
  })
}
