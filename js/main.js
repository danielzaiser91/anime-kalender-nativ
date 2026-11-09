// Verdrahtung: Store, Lader und Ablauf anlegen, bei jeder Zustandsänderung die Seite neu zeichnen.
import { erzeugeLader } from './daten/lade.js'
import { erzeugeStore } from './zustand/store.js'
import { starteAblauf } from './zustand/ablauf.js'
import { wochenseite } from './ui/seiten/woche.js'
import { aktualisierePanel } from './ui/panel-tor.js'

const wurzel = document.getElementById('app')
const dialog = document.getElementById('panel')
const store = erzeugeStore({ status: 'laedt', woche: null, heute: null, stand: null, daten: null, titel: null, panel: null, jetzt: null })
const lader = erzeugeLader((adresse) => fetch(adresse))

function zeichne(zustand) {
  if (!zustand.woche) return
  const neueWoche = wurzel.dataset.woche !== zustand.woche
  // Ein Titel im Panel ändert die Woche dahinter nicht: dann nicht neu zeichnen (Bildlaufposition bleibt).
  if (!neueWoche && wurzel.dataset.status === zustand.status && wurzel.gezeichnet === zustand.daten) return
  wurzel.replaceChildren(wochenseite(zustand))
  wurzel.dataset.woche = zustand.woche
  wurzel.dataset.status = zustand.status
  wurzel.gezeichnet = zustand.daten
  if (neueWoche) {
    window.scrollTo(0, 0)
    wurzel.focus({ preventScroll: true })
  }
}

store.abonniere(zeichne)
store.abonniere(() => aktualisierePanel(dialog, { store, fenster: window }))
starteAblauf({ store, lader, fenster: window, jetzt: Date.now })
