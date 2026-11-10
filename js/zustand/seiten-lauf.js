// Laden für News, Saison und Abo (wird erst beim Öffnen einer dieser Ansichten geladen): die Dateien der Ansicht, dazu der Stand für die Fußnote.
import { benoetigteWochen, gibtAelteres, leseNewsAbfrage, newsGrenze } from '../logik/news.js'

/** Die Wochen ab der Grenze (neueste zuerst); `aelteres` sagt, ob es dahinter noch Meldungen gibt. */
async function ladeNews({ lader, store }, ort) {
  const { tage } = leseNewsAbfrage(ort.schluessel)
  const grenze = newsGrenze(store.lies().heute, tage)
  const index = await lader.ladeNewsIndex()
  const wochen = await Promise.all(benoetigteWochen(index, grenze).map(lader.ladeNewsWoche))
  const liste = wochen.flatMap((woche) => woche.tage)
  return { news: { tage: liste, grenze, aelteres: gibtAelteres(index, liste, grenze) } }
}

const DATEN = {
  news: ladeNews,
  saison: async ({ lader }) => ({ saison: await lader.ladeSaison() }),
  abo: async ({ lader }) => ({ feeds: await lader.ladeFeeds() }),
}

export async function ladeSeitenAnsicht(abhaengigkeiten, ort) {
  const [stand, daten] = await Promise.all([abhaengigkeiten.lader.ladeStand(), DATEN[ort.art](abhaengigkeiten, ort)])
  return { stand, daten }
}
