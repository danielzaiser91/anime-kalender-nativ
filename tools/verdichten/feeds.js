// Kalender-Feeds (ICS) und der News-Feed (RSS) der Hauptseite: Dateien unverändert mitnehmen, dazu eine Liste für die Abo-Seite.
// Bei jedem Zweifel eine Ausnahme: ein leerer oder kaputter Feed wird nicht veröffentlicht.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { anbieterName } from '../../js/logik/folge.js'

export const FEEDS_SCHEMA = 1
const MIN_FEEDS = 40
const MIN_TERMINE_ALLE = 100
const NAME_PRAEFIX = 'Anime-Kalender DE – '

const zaehleTermine = (text) => text.split('\n').filter((zeile) => zeile.trim() === 'BEGIN:VEVENT').length
const kalenderName = (text) => /^X-WR-CALNAME:(.*)$/m.exec(text)?.[1]?.trim() ?? ''

/** Anzeigename: Plattformen heißen wie in der Woche, Genres tragen ihren Namen schon im Feed. */
function anzeigeName(datei, text) {
  if (datei === 'all.ics') return 'Alle Termine'
  const name = kalenderName(text).replace(NAME_PRAEFIX, '')
  return datei.startsWith('platform-') ? anbieterName(datei.slice('platform-'.length, -'.ics'.length)) : name
}

const art = (datei) => (datei === 'all.ics' ? 'alle' : datei.startsWith('platform-') ? 'plattform' : 'genre')

/** Liest alle .ics und den RSS-Feed aus public/data/feeds des Altrepos; `dateien` sind Name und Text. */
export function ladeFeeds(wurzel) {
  const ordner = join(wurzel, 'public/data/feeds')
  const dateien = readdirSync(ordner).filter((name) => name.endsWith('.ics') || name === 'news.xml').map((name) => ({ name, text: readFileSync(join(ordner, name), 'utf8') }))
  const kalender = dateien.filter((d) => d.name.endsWith('.ics'))
  if (kalender.length < MIN_FEEDS) throw new Error(`feeds: ${kalender.length} Kalender, erwartet mindestens ${MIN_FEEDS}`)
  for (const d of kalender) if (!d.text.startsWith('BEGIN:VCALENDAR') || !d.text.trimEnd().endsWith('END:VCALENDAR')) throw new Error(`feeds/${d.name}: kein vollständiger Kalender`)
  const alle = kalender.find((d) => d.name === 'all.ics')
  if (!alle || zaehleTermine(alle.text) < MIN_TERMINE_ALLE) throw new Error('feeds/all.ics fehlt oder hat zu wenige Termine')
  if (!dateien.some((d) => d.name === 'news.xml' && d.text.includes('<rss'))) throw new Error('feeds/news.xml fehlt oder ist kein RSS')
  return dateien
}

/** Die Liste der Abos: alle zuerst, dann Plattformen, dann Genres, je nach Name. */
export function baueFeedListe(dateien) {
  const rang = { alle: 0, plattform: 1, genre: 2 }
  const feeds = dateien
    .filter((d) => d.name.endsWith('.ics'))
    .map((d) => ({ datei: d.name, name: anzeigeName(d.name, d.text), art: art(d.name), termine: zaehleTermine(d.text) }))
    .sort((a, b) => rang[a.art] - rang[b.art] || a.name.localeCompare(b.name, 'de'))
  return { schema: FEEDS_SCHEMA, feeds }
}
