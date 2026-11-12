// Verdrahtung: Store, Lader und Ablauf anlegen, bei jeder Zustandsänderung die Seite neu zeichnen.
import { erzeugeLader } from './daten/lade.js'
import { erzeugeSpeicher } from './daten/speicher.js'
import { erzeugeStore } from './zustand/store.js'
import { starteAblauf } from './zustand/ablauf.js'
import { erzeugeZeichner } from './ui/zeichnen.js'
import { verdrahteAktionen } from './ui/aktionen.js'
import { aktualisierePanel } from './ui/panel-tor.js'

const wurzel = document.getElementById('app')
const dialog = document.getElementById('panel')
// Ein gesperrter Speicher wirft schon beim Zugriff auf localStorage: dann ein leeres Lager.
const lager = (() => {
  try {
    return window.localStorage
  } catch {
    return { getItem: () => null, setItem: () => {} }
  }
})()
const speicher = erzeugeSpeicher(lager)
const store = erzeugeStore({ status: 'laedt', ort: null, heute: null, stand: null, daten: null, titel: null, panel: null, jetzt: null, katalog: null, gucken: null, merk: speicher.lies() })
const lader = erzeugeLader((adresse) => fetch(adresse))

store.abonniere(erzeugeZeichner({ wurzel, store, fenster: window }))
store.abonniere(() => aktualisierePanel(dialog, { store, lader, fenster: window }))
verdrahteAktionen({ wurzel, dialog: document.getElementById('einstellungen'), abhaengigkeiten: { store, speicher, lader, jetzt: Date.now, fenster: window } })
starteAblauf({ store, lader, fenster: window, jetzt: Date.now })
import('./ui/offline.js').then((offline) => offline.starteOffline({ store, fenster: window })).catch(() => {})
