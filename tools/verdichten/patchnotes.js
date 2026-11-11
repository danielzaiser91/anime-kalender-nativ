// "Neu auf der Webseite": die Liste der Hauptseite (public/data/patchnotes.json) unverändert, nur mit den Feldern, die die Seite zeigt.
export const PATCHNOTES_SCHEMA = 1

const FELDER = ['datum', 'kategorie', 'text', 'highlight', 'untertitel', 'symbol', 'link', 'entwurf']
const DATUM = /^\d{4}-\d{2}-\d{2}$/

function pruefe(eintrag, i) {
  const fehler = (was) => new Error(`patchnotes.json[${i}]: ${was}`)
  if (!DATUM.test(eintrag.datum ?? '')) throw fehler(`datum "${eintrag.datum}"`)
  if (eintrag.kategorie !== 'feature' && eintrag.kategorie !== 'bugfix') throw fehler(`kategorie "${eintrag.kategorie}"`)
  if (typeof eintrag.text !== 'string' || !eintrag.text) throw fehler('text fehlt')
}

const behalte = (eintrag) => Object.fromEntries(FELDER.filter((feld) => eintrag[feld] !== undefined).map((feld) => [feld, eintrag[feld]]))

/** Die Einträge stehen wie in der Quelle (neueste Tage zuerst, im Tag Highlights vor Features vor Bugfixes); `stand` ist der Tag des ersten. */
export function bauePatchnotes(roh) {
  roh.forEach(pruefe)
  return { schema: PATCHNOTES_SCHEMA, stand: roh[0].datum, eintraege: roh.map(behalte) }
}
