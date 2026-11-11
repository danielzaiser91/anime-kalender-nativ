// Handlungen von "Was gucken?": der Ablauf liegt als Zustand `gucken` im Store (Logik in logik/gucken-*.js), Gesehenes und Verworfenes im Speicher.
// Die Pool-Datei kommt mit der Ansicht (`daten.pool`); der Merkmalsraum wird bei jedem Start gerechnet, damit "Ecchi zeigen" gilt, wie es gerade steht.
import { baueKontext } from '../logik/gucken-vektor.js'
import { antworten, duellZurueck, entfernen, genauerMachen, neueReise } from '../logik/gucken-ablauf.js'
import { ausgeschlossenFuerReise, ohneEcchiEinstiege, wegVon } from '../logik/gucken-reise.js'
import { holeZurueck, merkeEmpfehlung } from '../logik/merken.js'

const START_MAX = 1e6
const ANTWORT = { a: 'A', b: 'B', n: 'N' }

/** Startwert aus der Adresse (`?s=123`, dasselbe Duell wie beim Teilen), sonst zufällig. */
function startwertVon(abfrage, zufall) {
  const roh = new URLSearchParams(abfrage).get('s')
  return /^\d{1,9}$/.test(roh ?? '') ? Number(roh) : Math.floor(zufall() * START_MAX)
}

function startWerte({ store, zufall }) {
  const { daten, merk, ort } = store.lies()
  const kontext = baueKontext(ohneEcchiEinstiege(daten.pool, merk.ecchi))
  return { kontext, startwert: startwertVon(ort.schluessel, zufall), ausgeschlossen: ausgeschlossenFuerReise(merk), weg: wegVon(merk) }
}

/** Gesehen und "Nein" legen den Titel in die jeweilige Menge und lassen den nächsten der Rangliste nachrücken. */
function markiere({ store, speicher }, { liste, ak }) {
  const zustand = store.lies()
  const merk = merkeEmpfehlung(zustand.merk, { liste, ak })
  speicher.speichere(merk)
  store.setze({ merk, gucken: entfernen(zustand.gucken, { id: Number(ak), weg: wegVon(merk) }) })
}

function zurueckholen({ store, speicher }, daten) {
  const merk = holeZurueck(store.lies().merk, daten)
  speicher.speichere(merk)
  store.setze({ merk })
}

const UEBERGANG = {
  zurueckholen,
  los: (abh) => abh.store.setze({ gucken: neueReise(abh.store.lies().gucken, startWerte(abh)) }),
  zurueck: ({ store }) => store.setze({ gucken: duellZurueck(store.lies().gucken) }),
  genauer: ({ store }) => store.setze({ gucken: genauerMachen(store.lies().gucken) }),
  gesehen: (abh, daten) => markiere(abh, { liste: 'empfGesehen', ak: daten.ak }),
  nein: (abh, daten) => markiere(abh, { liste: 'empfVerworfen', ak: daten.ak }),
}

function antworte({ store }, antwort) {
  const { gucken, merk } = store.lies()
  if (gucken?.phase === 'duell') store.setze({ gucken: antworten(gucken, { antwort, weg: wegVon(merk) }) })
}

/** `aktion` ist der Teil nach "gucken-" aus data-aktion, `daten` das dataset des Knopfs; `zufall` ist Math.random, in der Verdrahtung gesetzt. */
export function fuehreGuckenAus(abhaengigkeiten, { aktion, daten }) {
  const abh = { ...abhaengigkeiten, zufall: abhaengigkeiten.zufall ?? Math.random }
  if (ANTWORT[aktion]) antworte(abh, ANTWORT[aktion])
  else UEBERGANG[aktion]?.(abh, daten)
}
