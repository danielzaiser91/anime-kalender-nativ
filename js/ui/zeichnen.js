// Zeichnet die Ansicht in die Hülle; Monat und Suche werden erst beim ersten Öffnen geladen. Der Fokus eines Knopfs überlebt das Neuzeichnen.
import { h } from './dom.js'
import { wochenseite } from './seiten/woche.js'
import { sichtbareTermine } from '../logik/merken.js'
import { mitAbfrage } from '../zustand/router.js'

/** News, Saison und Abo teilen ein Stylesheet, das erst mit der ersten dieser Ansichten kommt (der Start bleibt klein). */
const mitCss = async (laden) => {
  await (await import('./css-laden.js')).ladeCss('css/seiten.css')
  return laden()
}

const SEITEN = {
  woche: async () => wochenseite,
  monat: async () => (await import('./seiten/monat.js')).monatsseite,
  suche: async () => (await import('./seiten/katalog.js')).katalogseite,
  news: () => mitCss(async () => (await import('./seiten/news.js')).newsseite),
  saison: () => mitCss(async () => (await import('./seiten/saison.js')).saisonseite),
  abo: () => mitCss(async () => (await import('./seiten/abo.js')).aboseite),
}

const SIGNATUR = ['ort', 'status', 'daten', 'merk', 'katalog']

// Suche, News, Saison und Abo bleiben eine Ansicht, auch wenn sich ihre Abfrage in der Adresse ändert: kein Sprung nach oben.
const ortText = (ort) => (mitAbfrage(ort.art) ? ort.art : `${ort.art}/${ort.schluessel}`)

/** Ecchi und "nur Favoriten" wirken auf beide Ansichten gleich: hier einmal, vor der Seite. */
function ansichtVon(zustand) {
  if (!zustand.daten?.termine) return zustand
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
