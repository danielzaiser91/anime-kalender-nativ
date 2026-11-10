// Sprecher-Filter: der Index (Name, Titelzahl, Gruppe) und je Gruppe nur Name → Titel-IDs aus dem Katalog (ohne Rollen).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { KATALOG_SCHEMA } from '../../js/logik/katalog.js'

const lies = (wurzel, pfad) => JSON.parse(readFileSync(join(wurzel, 'public/data', pfad), 'utf8'))

export function baueSprecher(wurzel, katalogIds) {
  const index = lies(wurzel, 'sprecher.json')
  if (!Array.isArray(index.sprecher) || index.sprecher.length < 100) throw new Error('sprecher.json: zu wenige Sprecher')
  const gruppen = new Map()
  for (const gruppe of new Set(index.sprecher.map((eintrag) => eintrag[2]))) {
    const roh = lies(wurzel, `sprecher/${gruppe}.json`)
    const namen = Object.fromEntries(Object.entries(roh).map(([name, titel]) => [name, titel.map((t) => t.id).filter((id) => katalogIds.has(id))]))
    gruppen.set(gruppe, { schema: KATALOG_SCHEMA, gruppe, namen })
  }
  return { index: { schema: KATALOG_SCHEMA, stand: index.stand, sprecher: index.sprecher }, gruppen }
}
