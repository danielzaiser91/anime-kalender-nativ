// Holt die eigenen Datendateien. Kennt nur Adressen; ein Fehler wandert als Ausnahme zum Aufrufer.
const SCHEMA = 1

export function erzeugeLader(holeFn) {
  const gemerkt = new Map()

  function ladeJson(adresse) {
    if (!gemerkt.has(adresse)) gemerkt.set(adresse, holeFn(adresse).then(lesen))
    return gemerkt.get(adresse)
  }

  return {
    ladeStand: () => ladeJson('data/stand.json'),
    ladeWoche: (schluessel) => ladeJson(`data/woche/${schluessel}.json`),
    ladeTitelGruppe: (gruppe) => ladeJson(`data/titel/${gruppe}.json`),
    ladeHandlung: (ak) => ladeJson(`data/handlung/${ak}.json`),
    ladeBesetzung: (ak) => ladeJson(`data/besetzung/${ak}.json`),
    ladeFolgen: (ak) => ladeJson(`data/folgen/${ak}.json`),
    ladeDisc: (ak) => ladeJson(`data/disc/${ak}.json`),
    ladeReihe: (reihe) => ladeJson(`data/reihe/${reihe}.json`),
    ladeAehnliche: (ak) => ladeJson(`data/aehnlich/${ak}.json`),
    ladeKatalog: () => ladeJson('data/katalog.json'),
    ladeSynonyme: () => ladeJson('data/synonyme.json'),
    ladeSprecherIndex: () => ladeJson('data/sprecher.json'),
    ladeSprecherGruppe: (gruppe) => ladeJson(`data/sprecher/${gruppe}.json`),
    ladeNewsIndex: () => ladeJson('data/news/index.json'),
    ladeNewsWoche: (woche) => ladeJson(`data/news/${woche}.json`),
    ladeSaison: () => ladeJson('data/saison.json'),
    ladeFeeds: () => ladeJson('data/feeds.json'),
  }
}

async function lesen(antwort) {
  if (!antwort.ok) throw new Error(`${antwort.url}: ${antwort.status}`)
  const daten = await antwort.json()
  if (daten.schema !== SCHEMA) throw new Error(`${antwort.url}: Schema ${daten.schema}, erwartet ${SCHEMA}`)
  return daten
}
