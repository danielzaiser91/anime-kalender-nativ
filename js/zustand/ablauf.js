// Verbindet Adresse, Daten und Store; bei Titelkennung im Hash auch der Baustein fürs Panel.
import { heuteInBerlin, wocheVon } from '../logik/zeit.js'
import { gruppeVonAk } from '../logik/titel.js'
import { fuegeZusammen } from '../logik/woche.js'
import { ORTE } from '../logik/ort.js'
import { beobachteHash, leseHash, mitAbfrage } from './router.js'

async function ladeAnsicht(abhaengigkeiten, ort) {
  const { lader } = abhaengigkeiten
  if (ort.art === 'suche') return (await import('./katalog-lauf.js')).ladeKatalogAnsicht(abhaengigkeiten, ort)
  if (mitAbfrage(ort.art)) return (await import('./seiten-lauf.js')).ladeSeitenAnsicht(abhaengigkeiten, ort)
  const stand = await lader.ladeStand()
  const wochen = ORTE[ort.art].wochen(ort.schluessel).filter((woche) => woche >= stand.von && woche <= stand.bis)
  return { stand, daten: fuegeZusammen(await Promise.all(wochen.map(lader.ladeWoche))) }
}

const gleich = (a, b) => a?.art === b.art && a?.schluessel === b.schluessel

async function zeigeOrt(abhaengigkeiten, ort, heute) {
  const { store, jetzt } = abhaengigkeiten
  store.setze({ ort, heute, jetzt: jetzt(), status: 'laedt', daten: null })
  const heutig = () => gleich(store.lies().ort, ort)
  try {
    const ansicht = await ladeAnsicht(abhaengigkeiten, ort)
    if (heutig()) store.setze({ ...ansicht, status: 'bereit' })
  } catch (fehler) {
    if (heutig()) store.setze({ status: 'fehler', fehler: fehler.message })
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

/** Die Ansicht der Adresse: ohne Schlüssel die von heute, ein Titel ohne Ansicht bleibt über der gerade gezeigten. */
function ortDerRoute(route, aktuell, heute) {
  if (route.art) return { art: route.art, schluessel: route.schluessel ?? ORTE[route.art].von(heute) }
  return route.titel && aktuell.ort ? aktuell.ort : { art: 'woche', schluessel: wocheVon(heute) }
}

async function zeigeRoute(abhaengigkeiten, route, heute) {
  const { store } = abhaengigkeiten
  const ort = ortDerRoute(route, store.lies(), heute)
  const neu = !gleich(store.lies().ort, ort) || store.lies().status === 'fehler'
  const geladen = neu ? zeigeOrt(abhaengigkeiten, ort, heute) : Promise.resolve()
  await Promise.all([geladen, zeigeTitel(abhaengigkeiten, route.titel)])
}

export function starteAblauf({ store, lader, fenster, jetzt }) {
  const heute = heuteInBerlin(jetzt())
  const abhaengigkeiten = { store, lader, jetzt }
  beobachteHash(fenster, (route) => zeigeRoute(abhaengigkeiten, route, heute))
  return zeigeRoute(abhaengigkeiten, leseHash(fenster.location.hash), heute)
}
