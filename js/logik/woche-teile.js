// Ein Tag der Woche in seine drei Töpfe zerlegt (wie WeekView der Hauptseite) und die Texte dazu. Rein, ohne DOM.
import { anbieterName } from './folge.js'

/** Anbieterfarben der Hauptseite (PLATFORMS in shared/types.ts); der Streifen unter dem Cover. */
const FARBE = {
  crunchyroll: '#f47521',
  netflix: '#e50914',
  primevideo: '#00a8e1',
  disneyplus: '#0063e5',
  paramountplus: '#0064ff',
  adn: '#0095ff',
  aniverse: '#7c3aed',
  wow: '#00b1ff',
  joyn: '#fa1b5a',
  rtlplus: '#e2001a',
  youtube: '#ff0000',
  kino: '#eab308',
}

export const anbieterFarbe = (plattform) => FARBE[plattform] ?? '#6b7280'

/** Heute schon gestartet: die Uhrzeit für "seit 18:00" (wie kachelAngabe der Hauptseite); Geschätztes und Ausgebliebenes sagen nichts. */
export function seitZeit(termin, { heute, uhr }) {
  const geschaetzt = termin.timeEstimated || termin.estimated
  if (!uhr || termin.date !== heute || !termin.time || geschaetzt || termin.verpasst) return ''
  return termin.time <= uhr ? termin.time : ''
}

/** Heute bereits gelaufen: Beginn der letzten Sendung liegt vor der Uhrzeit (wie `vorbeiBis` der Hauptseite). */
export function tvVorbei({ erster, weitere }, { heute, uhr }) {
  const letzte = weitere.at(-1) ?? erster
  return !!uhr && erster.date === heute && !!letzte.time && letzte.time < uhr
}

/** Streaming und Kino als Poster, Fernsehen und Disc je in eigenem Kasten. */
export function teileTag(termine) {
  return {
    stream: termine.filter((t) => t.platform !== 'tv' && t.releaseType !== 'disc'),
    tv: termine.filter((t) => t.platform === 'tv'),
    disc: termine.filter((t) => t.releaseType === 'disc'),
  }
}

/** "2 Termine · 13 im TV · 1 im Handel"; leer, wenn nichts da ist. */
export function zaehlung({ stream, tv, disc }) {
  const teile = []
  if (stream.length) teile.push(stream.length === 1 ? '1 Termin' : `${stream.length} Termine`)
  if (tv.length) teile.push(`${tv.length} im TV`)
  if (disc.length) teile.push(`${disc.length} im Handel`)
  return teile.join(' · ')
}

/** Wiederholungen desselben Titels beim selben Sender: eine Zeile mit "+1 um 10:00", bei mehreren "+2, zuletzt um 18:50". */
export function buendleFernsehen(termine) {
  const gruppen = []
  for (const termin of termine) {
    const gruppe = gruppen.find((g) => g[0].titleId === termin.titleId && g[0].sender === termin.sender)
    if (gruppe) gruppe.push(termin)
    else gruppen.push([termin])
  }
  return gruppen.map(([erster, ...weitere]) => ({ erster, weitere }))
}

export function buendelText(weitere) {
  const zeit = weitere.at(-1)?.time
  if (!weitere.length || !zeit) return ''
  return weitere.length === 1 ? `+1 um ${zeit}` : `+${weitere.length}, zuletzt um ${zeit}`
}

/** Sender und Folge unter dem Fernsehtitel; eine Sichtung zählt keine Folge. */
export function senderZeile(termin) {
  const folge = termin.episode && !termin.sichtung ? ` · Folge ${termin.episode}` : ''
  return `${anbieterName(termin.platform, termin.sender)}${folge}`
}
