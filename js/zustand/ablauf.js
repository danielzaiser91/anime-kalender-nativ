// Verbindet Adresse, Daten und Store: bei jeder Woche laden und das Ergebnis in den Store legen.
import { heuteInBerlin, wocheVon } from '../logik/zeit.js'
import { beobachteHash, leseHash } from './router.js'

const LEERE_WOCHE = { termine: [], titel: {} }

async function ladeAnsicht(lader, woche) {
  const stand = await lader.ladeStand()
  const imBereich = woche >= stand.von && woche <= stand.bis
  return { stand, daten: imBereich ? await lader.ladeWoche(woche) : LEERE_WOCHE }
}

async function zeigeWoche({ store, lader }, wunsch, heute) {
  const woche = wunsch ?? wocheVon(heute)
  store.setze({ woche, heute, status: 'laedt', daten: null })
  try {
    const ansicht = await ladeAnsicht(lader, woche)
    if (store.lies().woche === woche) store.setze({ ...ansicht, status: 'bereit' })
  } catch (fehler) {
    if (store.lies().woche === woche) store.setze({ status: 'fehler', fehler: fehler.message })
  }
}

export function starteAblauf({ store, lader, fenster, jetzt }) {
  const heute = heuteInBerlin(jetzt())
  const abhaengigkeiten = { store, lader }
  beobachteHash(fenster, (route) => zeigeWoche(abhaengigkeiten, route.woche, heute))
  return zeigeWoche(abhaengigkeiten, leseHash(fenster.location.hash).woche, heute)
}
