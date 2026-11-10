// Laden für die Suche (wird erst beim Öffnen der Suche geladen): Katalog, danach im Hintergrund weitere Namen und Sprecher-Index,
// dazu die Gruppen der Sprecher, die der Filter nennt. Der Katalog liegt im Store (`katalog`) und überlebt Filterwechsel.
import { leseFilter } from '../logik/filter-adresse.js'
import { entpackeKatalog } from '../logik/katalog.js'

const namenDes = (filter) => [...filter.mit.sp, ...filter.ohne.sp]

/** Lädt Index und Gruppen der genannten Sprecher; liefert die IDs je Name (ein Name ohne Eintrag hat keine). */
async function ladeSprecherIds(lader, namen) {
  const index = new Map((await lader.ladeSprecherIndex()).sprecher.map(([name, , gruppe]) => [name, gruppe]))
  const gruppen = await Promise.all([...new Set(namen.map((name) => index.get(name)).filter(Boolean))].map(lader.ladeSprecherGruppe))
  const nachName = Object.assign({}, ...gruppen.map((g) => g.namen))
  return new Map(namen.map((name) => [name, nachName[name] ?? []]))
}

const setzeKatalog = (store, teil) => store.setze({ katalog: { ...store.lies().katalog, ...teil } })

/**
 * Weitere Namen (Originalschrift, Synonyme) und Sprecher-Index nachladen. `weitere` ist 'laedt', true oder 'fehler' (dann bleibt die Suche
 * auf den Katalognamen, die Seite sagt es); ein zweiter Aufruf stößt nichts neu an, auch nicht nach einem Fehler.
 */
async function ladeNachtraege({ store, lader }) {
  if (store.lies().katalog.weitere) return
  setzeKatalog(store, { weitere: 'laedt' })
  try {
    const [synonyme, sprecher] = await Promise.all([lader.ladeSynonyme(), lader.ladeSprecherIndex()])
    const titel = store.lies().katalog.titel.map((t) => ({ ...t, weitere: synonyme.namen[t.id] ?? [] }))
    setzeKatalog(store, { titel, weitere: true, sprecherNamen: sprecher.sprecher.map((eintrag) => eintrag[0]) })
  } catch {
    setzeKatalog(store, { weitere: 'fehler' })
  }
}

/** Die Ansicht der Suche: Katalog und Sprecher des Filters da, dann die Nachträge anstoßen. */
export async function ladeKatalogAnsicht(abhaengigkeiten, ort) {
  const { store, lader } = abhaengigkeiten
  const [stand, datei] = await Promise.all([lader.ladeStand(), lader.ladeKatalog()])
  const vorhanden = store.lies().katalog ?? { titel: entpackeKatalog(datei), weitere: false, sprecherNamen: [], sprecher: new Map() }
  const namen = namenDes(leseFilter(ort.schluessel))
  const sprecher = namen.length ? new Map([...vorhanden.sprecher, ...(await ladeSprecherIds(lader, namen))]) : vorhanden.sprecher
  // Die Nachträge können inzwischen eingetroffen sein: auf dem aktuellen Stand aufsetzen.
  store.setze({ katalog: { ...(store.lies().katalog ?? vorhanden), sprecher } })
  ladeNachtraege(abhaengigkeiten)
  return { stand, daten: { suche: true } }
}
