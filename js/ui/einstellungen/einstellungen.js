// Einstellungen als <dialog> (wird erst beim Öffnen geladen): Ecchi-Titel zeigen, Favoriten als Kalenderdatei.
import { h } from '../dom.js'
import { setzeOption } from '../../logik/merken.js'
import { aendereMerk } from '../../zustand/merk.js'

const TITEL_ID = 'einstellungen-titel'

function ecchiZeile(abhaengigkeiten) {
  const eingabe = h('input', { type: 'checkbox', checked: abhaengigkeiten.store.lies().merk.ecchi })
  eingabe.addEventListener('change', () => aendereMerk(abhaengigkeiten, (merk) => setzeOption(merk, 'ecchi', eingabe.checked)))
  return h('label', { class: 'wahl' }, eingabe, h('span', {}, 'Ecchi-Titel zeigen'))
}

function exportZeile(abhaengigkeiten) {
  const knopf = h('button', { type: 'button', class: 'panel-knopf' }, 'Favoriten als Kalenderdatei (.ics)')
  const status = h('p', { class: 'meldung', role: 'status' })
  knopf.addEventListener('click', async () => {
    status.textContent = 'Lädt …'
    try {
      const { exportiereFavoriten } = await import('../ics/export.js')
      const anzahl = await exportiereFavoriten(abhaengigkeiten)
      status.textContent = anzahl ? `${anzahl} Termine ab heute in der Datei.` : 'Keine Termine ab heute: Merke dir Titel mit „Favorit“.'
    } catch {
      status.textContent = 'Die Datei konnte nicht erstellt werden. Seite neu laden und noch einmal versuchen.'
    }
  })
  return h('div', { class: 'wahl-block' }, knopf, status)
}

export function oeffneEinstellungen(dialog, abhaengigkeiten) {
  const zu = h('button', { type: 'button', class: 'panel-knopf' }, 'Schließen')
  zu.addEventListener('click', () => dialog.close())
  dialog.setAttribute('aria-labelledby', TITEL_ID)
  dialog.replaceChildren(h('div', { class: 'panel-inhalt' }, h('h2', { id: TITEL_ID }, 'Einstellungen'), ecchiZeile(abhaengigkeiten), exportZeile(abhaengigkeiten), zu))
  if (!dialog.open) dialog.showModal()
}
