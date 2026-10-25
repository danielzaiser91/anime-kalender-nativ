// Datums- und Wochenrechnung als Text "JJJJ-MM-TT" und "JJJJ-Www" (ISO-Woche, Montag zuerst). Rein, ohne DOM.
const TAG_MS = 86400000

const zweistellig = (n) => String(n).padStart(2, '0')

export function inDatum(ms) {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${zweistellig(d.getUTCMonth() + 1)}-${zweistellig(d.getUTCDate())}`
}

export const ausDatum = (datum) => Date.parse(`${datum}T00:00:00Z`)

export const addiereTage = (datum, n) => inDatum(ausDatum(datum) + n * TAG_MS)

/** Der Montag der Woche, in der das Datum liegt. */
function montagVon(datum) {
  const wochentag = (new Date(ausDatum(datum)).getUTCDay() + 6) % 7
  return addiereTage(datum, -wochentag)
}

export function wocheVon(datum) {
  const donnerstag = addiereTage(montagVon(datum), 3)
  const jahr = Number(donnerstag.slice(0, 4))
  const tageSeitNeujahr = (ausDatum(donnerstag) - ausDatum(`${jahr}-01-01`)) / TAG_MS
  return `${jahr}-W${zweistellig(Math.floor(tageSeitNeujahr / 7) + 1)}`
}

export function montagDerWoche(woche) {
  const [jahr, nummer] = woche.split('-W').map(Number)
  return addiereTage(montagVon(`${jahr}-01-04`), (nummer - 1) * 7)
}

/** Die sieben Tage der Woche, Montag bis Sonntag. */
export const tageDerWoche = (woche) => Array.from({ length: 7 }, (_, i) => addiereTage(montagDerWoche(woche), i))

export const verschiebeWoche = (woche, n) => wocheVon(addiereTage(montagDerWoche(woche), n * 7))

export const istWochenschluessel = (text) => /^\d{4}-W\d{2}$/.test(text) && wocheVon(montagDerWoche(text)) === text

/** Heutiges Datum in Berlin; die Daten kennen nur Berliner Zeit. */
export function heuteInBerlin(jetztMs) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(jetztMs)
}
