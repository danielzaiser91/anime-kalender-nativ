// Liest und prüft die Quelldateien des Altrepos. Bei jedem Zweifel eine Ausnahme: dann gibt es keinen Deploy.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const MIN_TERMINE = 1000
const MIN_TITEL = 300
const MIN_TITEL_VOLL = 1500
const MIN_RELEASES = 300
const MIN_KENNUNGEN = 1000
const MIN_EINSTIEGE = 300
const MIN_PATCHNOTES = 5
const DATUM = /^\d{4}-\d{2}-\d{2}$/

const lies = (wurzel, pfad) => JSON.parse(readFileSync(join(wurzel, pfad), 'utf8'))

function pruefeTermin(termin, i) {
  const fehler = (was) => new Error(`events.json[${i}]: ${was}`)
  if (!Number.isInteger(termin.titleId)) throw fehler('titleId fehlt')
  if (!DATUM.test(termin.date ?? '')) throw fehler(`date "${termin.date}"`)
  if (typeof termin.platform !== 'string') throw fehler('platform fehlt')
  if (typeof termin.name !== 'string' || !termin.name) throw fehler('name fehlt')
}

function pruefeMengen({ events, titel, titelVoll, releases, kennungen, meta, saison, ausblick }) {
  if (!Array.isArray(titelVoll) || titelVoll.length < MIN_TITEL_VOLL) throw new Error(`titles.json: ${titelVoll?.length} Titel, erwartet mindestens ${MIN_TITEL_VOLL}`)
  if (!Array.isArray(releases) || releases.length < MIN_RELEASES) throw new Error(`releases.json: ${releases?.length} Releases, erwartet mindestens ${MIN_RELEASES}`)
  if (!Array.isArray(events) || events.length < MIN_TERMINE) throw new Error(`events.json: ${events?.length} Termine, erwartet mindestens ${MIN_TERMINE}`)
  if (!Array.isArray(titel) || titel.length < MIN_TITEL) throw new Error(`titles-core.json: ${titel?.length} Titel, erwartet mindestens ${MIN_TITEL}`)
  if (!Array.isArray(kennungen.titel) || kennungen.titel.length < MIN_KENNUNGEN) throw new Error('kennungen.json: zu wenige Zeilen')
  if (Number.isNaN(Date.parse(meta.generatedAt))) throw new Error('meta.json: generatedAt fehlt')
  if (!Array.isArray(saison?.katalog) || !Array.isArray(ausblick?.katalog) || typeof saison.jp !== 'object') throw new Error('saison.json / saison-ausblick.json: Form unerwartet')
}

/** "Was gucken?" und "Neu auf der Webseite": ohne Pool oder ohne Einträge wäre die Ansicht leer, also kein Deploy. */
function pruefeGucken({ empfehlung, patchnotes }) {
  if (!Array.isArray(empfehlung?.einstiege) || empfehlung.einstiege.length < MIN_EINSTIEGE) throw new Error(`empfehlung.json: ${empfehlung?.einstiege?.length} Einstiege, erwartet mindestens ${MIN_EINSTIEGE}`)
  if (!Array.isArray(patchnotes) || patchnotes.length < MIN_PATCHNOTES) throw new Error(`patchnotes.json: ${patchnotes?.length} Einträge, erwartet mindestens ${MIN_PATCHNOTES}`)
}

export function ladeQuelle(wurzel) {
  const quelle = {
    events: lies(wurzel, 'public/data/events.json'),
    titel: lies(wurzel, 'public/data/titles-core.json'),
    titelVoll: lies(wurzel, 'public/data/titles.json'),
    releases: lies(wurzel, 'public/data/releases.json'),
    synonyme: lies(wurzel, 'public/data/synonyme.json'),
    kennungen: lies(wurzel, 'data/kennungen.json'),
    meta: lies(wurzel, 'public/data/meta.json'),
    news: lies(wurzel, 'public/data/news.json'),
    saison: lies(wurzel, 'public/data/saison.json'),
    ausblick: lies(wurzel, 'public/data/saison-ausblick.json'),
    empfehlung: lies(wurzel, 'public/data/empfehlung.json'),
    patchnotes: lies(wurzel, 'public/data/patchnotes.json'),
  }
  pruefeMengen(quelle)
  pruefeGucken(quelle)
  quelle.events.forEach(pruefeTermin)
  return quelle
}
