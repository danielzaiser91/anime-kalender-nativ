// Verdrahtung: Store, Lader und Ablauf anlegen, bei jeder Zustandsänderung die Seite neu zeichnen.
import { erzeugeLader } from './daten/lade.js'
import { erzeugeStore } from './zustand/store.js'
import { starteAblauf } from './zustand/ablauf.js'
import { erzeugeZeichner } from './ui/zeichnen.js'
import { aktualisierePanel } from './ui/panel-tor.js'

const wurzel = document.getElementById('app')
const dialog = document.getElementById('panel')
const store = erzeugeStore({ status: 'laedt', ort: null, heute: null, stand: null, daten: null, titel: null, panel: null, jetzt: null })
const lader = erzeugeLader((adresse) => fetch(adresse))

store.abonniere(erzeugeZeichner({ wurzel, fenster: window }))
store.abonniere(() => aktualisierePanel(dialog, { store, fenster: window }))
starteAblauf({ store, lader, fenster: window, jetzt: Date.now })
