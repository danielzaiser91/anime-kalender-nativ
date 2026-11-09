// Zeichnet die Ansicht in die Hülle; die Monatsansicht wird erst beim ersten Öffnen geladen. Der Fokus eines Knopfs überlebt das Neuzeichnen.
import { h } from './dom.js'
import { wochenseite } from './seiten/woche.js'
import { sichtbareTermine } from '../logik/merken.js'

const SEITEN = {
  woche: async () => wochenseite,
  monat: async () => (await import('./seiten/monat.js')).monatsseite,
}

const SIGNATUR = ['ort', 'status', 'daten', 'merk']

const ortText = (ort) => `${ort.art}/${ort.schluessel}`

/** Ecchi und "nur Favoriten" wirken auf beide Ansichten gleich: hier einmal, vor der Seite. */
function ansichtVon(zustand) {
  if (!zustand.daten) return zustand
  const { termine, titel } = zustand.daten
  return { ...zustand, daten: { ...zustand.daten, termine: sichtbareTermine(termine, titel, zustand.merk) } }
}

function zeigeFehler(wurzel) {
  wurzel.replaceChildren(h('p', { class: 'meldung', role: 'status' }, 'Die Ansicht konnte nicht geladen werden. Seite neu laden und noch einmal versuchen.'))
  delete wurzel.gezeichnet
}

export function erzeugeZeichner({ wurzel, store, fenster }) {
  return async function zeichne(zustand) {
    const vorher = wurzel.gezeichnet
    if (!zustand.ort || (vorher && SIGNATUR.every((feld) => vorher[feld] === zustand[feld]))) return
    try {
      const seite = await SEITEN[zustand.ort.art]()
      if (store.lies() !== zustand) return
      const fokus = wurzel.contains(document.activeElement) ? document.activeElement.dataset.fokus : null
      const neu = wurzel.dataset.ort !== ortText(zustand.ort)
      wurzel.replaceChildren(seite(ansichtVon(zustand)))
      wurzel.dataset.ort = ortText(zustand.ort)
      wurzel.gezeichnet = zustand
      if (neu) {
        fenster.scrollTo(0, 0)
        wurzel.focus({ preventScroll: true })
      } else if (fokus) {
        wurzel.querySelector(`[data-fokus="${fokus}"]`)?.focus({ preventScroll: true })
      }
    } catch {
      zeigeFehler(wurzel)
    }
  }
}
