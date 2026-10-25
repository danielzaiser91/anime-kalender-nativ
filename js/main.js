// Verdrahtung: Store, Lader und Ablauf anlegen, bei jeder Zustandsänderung die Seite neu zeichnen.
import { erzeugeLader } from './daten/lade.js'
import { erzeugeStore } from './zustand/store.js'
import { starteAblauf } from './zustand/ablauf.js'
import { wochenseite } from './ui/seiten/woche.js'

const wurzel = document.getElementById('app')
const store = erzeugeStore({ status: 'laedt', woche: null, heute: null, stand: null, daten: null })
const lader = erzeugeLader((adresse) => fetch(adresse))

function zeichne(zustand) {
  if (!zustand.woche) return
  const neueWoche = wurzel.dataset.woche !== zustand.woche
  wurzel.replaceChildren(wochenseite(zustand))
  wurzel.dataset.woche = zustand.woche
  if (neueWoche) {
    window.scrollTo(0, 0)
    wurzel.focus({ preventScroll: true })
  }
}

store.abonniere(zeichne)
starteAblauf({ store, lader, fenster: window, jetzt: Date.now })
