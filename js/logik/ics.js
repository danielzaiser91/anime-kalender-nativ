// Kalenderdatei (.ics) aus Terminen, Zeiten in Europe/Berlin wie die Hauptseite (UTC-Zeitstempel plus X-WR-TIMEZONE). Rein, ohne DOM.
import { berlinAlsMs } from './erschienen.js'
import { folgeZeile } from './folge.js'
import { addiereTage } from './zeit.js'
import { titelAdresse } from './woche.js'

const DAUER_MS = 30 * 60000
const kodiere = new TextEncoder()

const esc = (text) => text.replace(/([\\;,])/g, '\\$1').replace(/\r?\n/g, '\\n')

const stempel = (ms) => `${new Date(ms).toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`

const kompakt = (datum) => datum.replaceAll('-', '')

/** RFC 5545 zählt Oktette, nicht Zeichen: nach 75 gefaltet, nur zwischen zwei Zeichen. */
export function falte(zeile) {
  if (kodiere.encode(zeile).length <= 75) return zeile
  const teile = []
  let aktuell = ''
  let oktette = 0
  let grenze = 75
  for (const zeichen of zeile) {
    const n = kodiere.encode(zeichen).length
    if (oktette + n > grenze) {
      teile.push(aktuell)
      aktuell = ''
      oktette = 0
      grenze = 74
    }
    aktuell += zeichen
    oktette += n
  }
  teile.push(aktuell)
  return teile.join('\r\n ')
}

function zeitzeilen(termin) {
  if (!termin.time) return [`DTSTART;VALUE=DATE:${kompakt(termin.date)}`, `DTEND;VALUE=DATE:${kompakt(addiereTage(termin.date, 1))}`]
  const start = berlinAlsMs(termin.date, termin.time)
  return [`DTSTART:${stempel(start)}`, `DTEND:${stempel(start + DAUER_MS)}`]
}

function beschreibung(termin, ak) {
  const zeilen = [folgeZeile(termin)]
  if (!termin.time) zeilen.push('Uhrzeit noch nicht bestätigt.')
  if (termin.time && (termin.timeEstimated || termin.estimated)) zeilen.push('Uhrzeit voraussichtlich, nicht vom Anbieter bestätigt.')
  zeilen.push(`Details: ${titelAdresse(ak)}`)
  return zeilen.join('\n')
}

const uid = (termin, ak) => `${ak}-${termin.date}-${termin.time ?? 'ganztags'}-${termin.platform}-${termin.episode ?? 0}@anime-kalender-nativ`

function vevent({ ak, termin }) {
  const titel = termin.episode && !termin.katalog ? `${termin.name} – Folge ${termin.episode}` : termin.name
  return ['BEGIN:VEVENT', `UID:${uid(termin, ak)}`, 'DTSTAMP:20200101T000000Z', ...zeitzeilen(termin), `SUMMARY:${esc(titel)}`, `DESCRIPTION:${esc(beschreibung(termin, ak))}`, 'END:VEVENT']
}

/** Die ganze Datei; `eintraege` sind { ak, termin }, gleiche Termine (gleiche UID) kommen einmal vor. */
export function baueIcs(eintraege, name = 'Anime-Kalender nativ: Favoriten') {
  const einmalig = new Map(eintraege.map((e) => [uid(e.termin, e.ak), e]))
  const kopf = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//anime-kalender-nativ//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(name)}`, 'X-WR-TIMEZONE:Europe/Berlin']
  const zeilen = [...kopf, ...[...einmalig.values()].flatMap(vevent), 'END:VCALENDAR']
  return `${zeilen.map(falte).join('\r\n')}\r\n`
}
