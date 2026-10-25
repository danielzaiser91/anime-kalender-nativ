// Liest und prüft die Quelldateien des Altrepos. Bei jedem Zweifel eine Ausnahme: dann gibt es keinen Deploy.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MIN_TERMINE = 1000
const MIN_TITEL = 300
const MIN_KENNUNGEN = 1000
const DATUM = /^\d{4}-\d{2}-\d{2}$/

const lies = (wurzel, pfad) => JSON.parse(readFileSync(join(wurzel, pfad), 'utf8'))

function pruefeTermin(termin, i) {
  const fehler = (was) => new Error(`events.json[${i}]: ${was}`)
  if (!Number.isInteger(termin.titleId)) throw fehler('titleId fehlt')
  if (!DATUM.test(termin.date ?? '')) throw fehler(`date "${termin.date}"`)
  if (typeof termin.platform !== 'string') throw fehler('platform fehlt')
  if (typeof termin.name !== 'string' || !termin.name) throw fehler('name fehlt')
}

function pruefeMengen({ events, titel, kennungen, meta }) {
  if (!Array.isArray(events) || events.length < MIN_TERMINE) throw new Error(`events.json: ${events?.length} Termine, erwartet mindestens ${MIN_TERMINE}`)
  if (!Array.isArray(titel) || titel.length < MIN_TITEL) throw new Error(`titles-core.json: ${titel?.length} Titel, erwartet mindestens ${MIN_TITEL}`)
  if (!Array.isArray(kennungen.titel) || kennungen.titel.length < MIN_KENNUNGEN) throw new Error('kennungen.json: zu wenige Zeilen')
  if (Number.isNaN(Date.parse(meta.generatedAt))) throw new Error('meta.json: generatedAt fehlt')
}

export function ladeQuelle(wurzel) {
  const quelle = {
    events: lies(wurzel, 'public/data/events.json'),
    titel: lies(wurzel, 'public/data/titles-core.json'),
    kennungen: lies(wurzel, 'data/kennungen.json'),
    meta: lies(wurzel, 'public/data/meta.json'),
  }
  pruefeMengen(quelle)
  quelle.events.forEach(pruefeTermin)
  return quelle
}
