// Liest die Rohdateien des Panel-Rests aus dem Altrepo: Handlung, Besetzung, Folgentitel, Disc-Ausgaben, Reihen. Fehlt eine Datei, bleibt der Baustein leer (kein Fehler).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const GRUPPEN_ALT = 32
const lies = (altrepo, pfad) => JSON.parse(readFileSync(join(altrepo, 'public/data', pfad), 'utf8'))
const liesWennDa = (altrepo, pfad, leer) => (existsSync(join(altrepo, 'public/data', pfad)) ? lies(altrepo, pfad) : leer)

/** Handlungen aller Titel: Map AniList-ID → { de, en, deSource, asUrl, eigen } (ohne die Plakat-Angaben `cg`). */
function ladeHandlungen(altrepo) {
  const karte = new Map()
  for (let gruppe = 0; gruppe < GRUPPEN_ALT; gruppe++) {
    const datei = liesWennDa(altrepo, `synopses/${gruppe}.json`, {})
    for (const [id, roh] of Object.entries(datei)) {
      const { cg, deFolgen, ...text } = roh
      karte.set(Number(id), text)
    }
  }
  return karte
}

/** Disc-Ausgaben aus aniSearch: Map AniList-ID → Zeilen [Name, Format, Art, Datum, Artikel]. */
function ladeDiscAusgaben(altrepo) {
  const karte = new Map()
  for (let gruppe = 0; gruppe < GRUPPEN_ALT; gruppe++) {
    const datei = liesWennDa(altrepo, `disc/${gruppe}.json`, {})
    for (const [id, zeilen] of Object.entries(datei)) karte.set(Number(id), zeilen)
  }
  return karte
}

const folgenIds = (altrepo) => new Set(liesWennDa(altrepo, 'folgen/index.json', []))

export function ladeDetailRoh(altrepo) {
  return {
    handlungen: ladeHandlungen(altrepo),
    discAusgaben: ladeDiscAusgaben(altrepo),
    folgen: folgenIds(altrepo),
    franchises: lies(altrepo, 'franchises.json'),
    liesFolgen: (id) => lies(altrepo, `folgen/${id}.json`),
    liesBesetzung: (id) => liesWennDa(altrepo, `voices/${id}.json`, null),
  }
}

