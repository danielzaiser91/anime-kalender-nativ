// Wie weit wir die deutsche Fassung einer Serie kennen (Hauptseite: web/src/lib/saison.ts, saison-termin.ts). Rein, ohne DOM.
// Eine Zeile aus saison.json trägt Rohwerte; Stufe und "erschienen" gelten für den Tag `heute`.

export const STUFEN = {
  'auf-deutsch': 'Auf Deutsch',
  bestaetigt: 'Deutsch bestätigt',
  angekuendigt: 'Deutsch angekündigt',
  termin: 'Termin angekündigt',
  ungeklaert: 'Sprache ungeklärt',
  offen: 'noch offen',
}

/** Katalogtitel: "Auf Deutsch" nur mit belegter deutscher Folge, deren Tag verstrichen ist. */
function stufeKatalog(z, heute) {
  if (!z.deutsch) return z.angek ? 'angekuendigt' : 'offen'
  return z.de !== undefined && z.de <= heute ? 'auf-deutsch' : 'bestaetigt'
}

/**
 * Ein Termin im Kalender ist ein deutscher Termin; ein nur abgeleiteter (`geschaetzt`: Simulcast-Tag statt Ankündigung der Synchro) zählt nicht.
 * Auf Deutsch = erschienen; bestätigt = Tonspur belegt, noch nicht erschienen; angekündigt = Termin ohne Tonspur-Beleg; Termin = nur abgeleitet;
 * ungeklärt = abgeleiteter Termin verstrichen; offen = kein Termin.
 */
function stufeTitel(z, heute) {
  if (z.de === undefined) return z.deutsch ? 'bestaetigt' : z.angek ? 'angekuendigt' : 'offen'
  const erschienen = z.de <= heute
  if (z.deutsch || !z.geschaetzt) return erschienen ? 'auf-deutsch' : z.deutsch ? 'bestaetigt' : 'angekuendigt'
  return z.angek ? 'angekuendigt' : erschienen ? 'ungeklaert' : 'termin'
}

export const stufeVon = (z, heute) => (z.katalog ? stufeKatalog(z, heute) : stufeTitel(z, heute))

/** Der erste deutsche Termin liegt heute oder davor; ein verstrichener, nur abgeleiteter Termin zählt nicht als Erscheinungstag. */
export function erschienenVon(z, heute) {
  if (z.de === undefined || z.de > heute) return false
  return z.katalog ? z.deutsch : !(z.geschaetzt && !z.deutsch)
}

const tag = (datum) => `${datum.slice(8, 10)}.${datum.slice(5, 7)}.`
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const TAG_MS = 86_400_000
const ganzerTag = (datum) => datum?.length === 10

/** Der Japan-Start im Ausblick so genau wie bekannt; Saison und Jahr stehen schon in der Gruppenüberschrift. */
function jpDatum(z) {
  if (z.genau === 'tag') return tag(z.jp)
  return z.genau === 'monat' ? MONATE[Number(z.jp.slice(5, 7)) - 1] : undefined
}

/** Japan und Deutschland liegen zeitzonenbedingt höchstens einen Tag auseinander, wenn die Folge am selben Tag startet. */
const gleicherStart = (z) => ganzerTag(z.jp) && ganzerTag(z.de) && !z.geschaetzt && Math.abs(Date.parse(z.jp) - Date.parse(z.de)) <= TAG_MS

/** Die Terminzeile einer Karte ohne Verb: "Japan 25.09. · Deutsch 02.10."; `ausblick`: ohne "Termin offen", Jahr nur bei anderem Jahr. */
export function terminText({ zeile: z, ausblick, jahr, erschienen }) {
  const mitJahr = (datum) => (ausblick && datum.slice(0, 4) !== jahr ? `${tag(datum)}${datum.slice(0, 4)}` : tag(datum))
  const jp = ausblick ? jpDatum(z) : z.jp && tag(z.jp)
  if (jp && gleicherStart(z)) return `Japan und Deutsch ab ${mitJahr(z.jp < z.de ? z.jp : z.de)}`
  const teile = [jp && `Japan ${jp}`]
  if (z.de) teile.push(`Deutsch ${z.geschaetzt ? 'ca. ' : ''}${mitJahr(z.de)}`)
  else if (!ausblick && !erschienen) teile.push('Deutsch: Termin offen')
  return teile.filter(Boolean).join(' · ') || undefined
}
