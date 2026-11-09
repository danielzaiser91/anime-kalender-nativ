// Zeichnet die Ansicht in die Hülle; ein Titel im Panel ändert die Ansicht dahinter nicht, dann bleibt die Bildlaufposition.
import { wochenseite } from './seiten/woche.js'

const SIGNATUR = ['ort', 'status', 'daten']

const ortText = (ort) => `${ort.art}/${ort.schluessel}`

export function erzeugeZeichner({ wurzel, fenster }) {
  return function zeichne(zustand) {
    const vorher = wurzel.gezeichnet
    if (!zustand.ort || (vorher && SIGNATUR.every((feld) => vorher[feld] === zustand[feld]))) return
    const neu = wurzel.dataset.ort !== ortText(zustand.ort)
    wurzel.replaceChildren(wochenseite(zustand))
    wurzel.dataset.ort = ortText(zustand.ort)
    wurzel.gezeichnet = zustand
    if (neu) {
      fenster.scrollTo(0, 0)
      wurzel.focus({ preventScroll: true })
    }
  }
}
