// Ist ein Termin schon durch, nach Datum und Uhrzeit? Regel wie shared/logic.ts istErschienen der Hauptseite. Rein, ohne DOM.
const BERLIN = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })

const teileVon = (ms) => Object.fromEntries(BERLIN.formatToParts(ms).map((t) => [t.type, t.value]))

/** Jetzt als "JJJJ-MM-TTTHH:MM" in Berliner Ortszeit, die Form der Zeitfenster im Datensatz. */
export function berlinText(ms) {
  const t = teileVon(ms)
  return `${t.year}-${t.month}-${t.day}T${t.hour}:${t.minute}`
}

function versatz(ms) {
  const t = Object.fromEntries(Object.entries(teileVon(ms)).map(([k, v]) => [k, Number(v)]))
  return (Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second) - ms) / 60000
}

/** Berliner Ortszeit als UTC-Millisekunden; zwei Durchläufe, damit es an der Zeitumstellung stimmt. */
export function berlinAlsMs(datum, zeit = '00:00') {
  const [j, m, t] = datum.split('-').map(Number)
  const [h, min] = zeit.split(':').map(Number)
  const roh = Date.UTC(j, m - 1, t, h, min)
  return roh - versatz(roh - versatz(roh) * 60000) * 60000
}

export const katalogstartOhneUhrzeit = (e) => !e.time && e.releaseType === 'batch' && e.platform !== 'tv'

export function istErschienen(e, jetztMs) {
  const zeit = e.time ?? (katalogstartOhneUhrzeit(e) ? '00:00' : '23:59')
  return berlinAlsMs(e.date, zeit) <= jetztMs
}
