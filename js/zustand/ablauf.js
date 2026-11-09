// Verbindet Adresse, Daten und Store: Woche laden, bei einer Titelkennung im Hash auch den Titelbaustein fürs Panel.
import { heuteInBerlin, wocheVon } from '../logik/zeit.js'
import { gruppeVonAk } from '../logik/titel.js'
import { beobachteHash, leseHash } from './router.js'

const LEERE_WOCHE = { termine: [], titel: {} }

async function ladeAnsicht(lader, woche) {
  const stand = await lader.ladeStand()
  const imBereich = woche >= stand.von && woche <= stand.bis
  return { stand, daten: imBereich ? await lader.ladeWoche(woche) : LEERE_WOCHE }
}

async function zeigeWoche({ store, lader }, woche, heute) {
  store.setze({ woche, heute, status: 'laedt', daten: null })
  try {
    const ansicht = await ladeAnsicht(lader, woche)
    if (store.lies().woche === woche) store.setze({ ...ansicht, status: 'bereit' })
  } catch (fehler) {
    if (store.lies().woche === woche) store.setze({ status: 'fehler', fehler: fehler.message })
  }
}

/** Das Panel eines Titels: erst "lädt", dann der Baustein aus der Gruppendatei; ein Wechsel unterwegs verwirft die alte Antwort. */
async function zeigeTitel({ store, lader, jetzt }, ak) {
  if (!ak) return store.setze({ titel: null, panel: null })
  store.setze({ titel: ak, panel: { ak, status: 'laedt' }, jetzt: jetzt() })
  const heutig = () => store.lies().titel === ak
  try {
    const gruppe = await lader.ladeTitelGruppe(gruppeVonAk(ak))
    const baustein = gruppe.titel[ak]
    if (heutig()) store.setze({ panel: baustein ? { ak, status: 'bereit', titel: baustein } : { ak, status: 'fehler', fehler: 'Titel nicht gefunden' } })
  } catch (fehler) {
    if (heutig()) store.setze({ panel: { ak, status: 'fehler', fehler: fehler.message } })
  }
}

/** Die Woche der Adresse; ein Titel ohne Woche bleibt über der gerade gezeigten. */
function wocheDerRoute(route, aktuell, heute) {
  return route.woche ?? (route.titel ? aktuell.woche : null) ?? wocheVon(heute)
}

async function zeigeRoute(abhaengigkeiten, route, heute) {
  const { store } = abhaengigkeiten
  const woche = wocheDerRoute(route, store.lies(), heute)
  const neueWoche = woche !== store.lies().woche || store.lies().status === 'fehler'
  const geladen = neueWoche ? zeigeWoche(abhaengigkeiten, woche, heute) : Promise.resolve()
  await Promise.all([geladen, zeigeTitel(abhaengigkeiten, route.titel)])
}

export function starteAblauf({ store, lader, fenster, jetzt }) {
  const heute = heuteInBerlin(jetzt())
  const abhaengigkeiten = { store, lader, jetzt }
  beobachteHash(fenster, (route) => zeigeRoute(abhaengigkeiten, route, heute))
  return zeigeRoute(abhaengigkeiten, leseHash(fenster.location.hash), heute)
}
