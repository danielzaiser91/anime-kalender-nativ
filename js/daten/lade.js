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
  }
}

async function lesen(antwort) {
  if (!antwort.ok) throw new Error(`${antwort.url}: ${antwort.status}`)
  const daten = await antwort.json()
  if (daten.schema !== SCHEMA) throw new Error(`${antwort.url}: Schema ${daten.schema}, erwartet ${SCHEMA}`)
  return daten
}
