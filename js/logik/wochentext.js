// Datumstexte auf Deutsch (Intl, ohne Zusatzdaten). Rein, ohne DOM.
import { ausDatum, montagDerWoche, addiereTage } from './zeit.js'

const format = (optionen) => new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', ...optionen })
const TAG_LANG = format({ weekday: 'long', day: 'numeric', month: 'long' })
const TAG_MONAT = format({ day: 'numeric', month: 'long' })
const VOLL = format({ day: 'numeric', month: 'long', year: 'numeric' })

export const tagUeberschrift = (datum) => TAG_LANG.format(ausDatum(datum))

/** "19.–25. Oktober 2026"; über Monats- und Jahresgrenzen mit beiden Enden ausgeschrieben. */
export function wochenSpanne(woche) {
  const von = montagDerWoche(woche)
  const bis = addiereTage(von, 6)
  if (von.slice(0, 4) !== bis.slice(0, 4)) return `${VOLL.format(ausDatum(von))} – ${VOLL.format(ausDatum(bis))}`
  if (von.slice(5, 7) !== bis.slice(5, 7)) return `${TAG_MONAT.format(ausDatum(von))} – ${VOLL.format(ausDatum(bis))}`
  return `${Number(von.slice(8))}.–${VOLL.format(ausDatum(bis))}`
}

export const kalenderwoche = (woche) => `KW ${Number(woche.slice(-2))}`

const STAND = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' })

export const standText = (iso) => STAND.format(Date.parse(iso))
