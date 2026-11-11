// Merkmalsraum für "Was gucken?" (aus shared/empfehlung-vektor.ts der Hauptseite): je Einstieg ein normierter Vektor aus Genres, Schlagwörtern
// und Gruppen (Film, Jahrfünft, FSK, Länge), dazu die Cosinus-Ähnlichkeit aller Paare. Rein, einmal je Datei gebaut, danach nur gelesen.

/** Genres und Schlagwörter mit mindestens so vielen Einstiegen werden Dimensionen. */
export const MIN_TITEL_JE_MERKMAL = 5

/** Gewicht der Gruppen Film, Jahrfünft, FSK und Länge gegenüber Genre und Schlagwort. */
const GRUPPEN_GEWICHT = 0.5

const GRUPPEN = ['film', 'j<2005', 'j2005', 'j2010', 'j2015', 'j2020', 'fsk<=6', 'fsk12', 'fsk16+', 'fskNA', 'kurz', 'mittel', 'lang']

function jahrGruppe(jahr) {
  if (jahr === undefined) return 'j2020'
  return jahr < 2005 ? 'j<2005' : jahr < 2010 ? 'j2005' : jahr < 2015 ? 'j2010' : jahr < 2020 ? 'j2015' : 'j2020'
}

function fskGruppe(fsk) {
  if (fsk == null) return 'fskNA'
  return fsk <= 6 ? 'fsk<=6' : fsk === 12 ? 'fsk12' : 'fsk16+'
}

function laengeGruppe(folgen) {
  const n = folgen || 1
  return n <= 13 ? 'kurz' : n <= 26 ? 'mittel' : 'lang'
}

const namenVon = (k, datei) => [...k.g.map((i) => datei.genres[i]), ...k.k.map((i) => datei.keywords[i])]

/** Namen beider Wörterbücher zusammengeführt (ein Name in Genre und Schlagwort ist eine Dimension), nach Häufigkeit gefiltert. */
function merkmalsNamen(datei) {
  const zaehler = new Map()
  for (const k of datei.einstiege) {
    for (const n of new Set(namenVon(k, datei))) zaehler.set(n, (zaehler.get(n) ?? 0) + 1)
  }
  return [...zaehler].filter(([, anzahl]) => anzahl >= MIN_TITEL_JE_MERKMAL).map(([n]) => n).sort()
}

function vektorVon(k, datei, dim) {
  const v = new Float64Array(dim.size)
  for (const n of namenVon(k, datei)) {
    const stelle = dim.get(n)
    if (stelle !== undefined) v[stelle] = 1
  }
  const gruppen = [jahrGruppe(k.y), fskGruppe(k.fsk), laengeGruppe(k.e)]
  if (k.f === 'MOVIE') gruppen.push('film')
  for (const g of gruppen) v[dim.get(g)] = GRUPPEN_GEWICHT
  const norm = Math.sqrt(v.reduce((summe, a) => summe + a * a, 0)) || 1
  return v.map((a) => a / norm)
}

function aehnlichkeiten(vektoren) {
  const n = vektoren.length
  const tabelle = new Float64Array(n * n)
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let s = 0
      for (let m = 0; m < vektoren[i].length; m++) s += vektoren[i][m] * vektoren[j][m]
      tabelle[i * n + j] = s
      tabelle[j * n + i] = s
    }
  }
  return tabelle
}

export function baueKontext(datei) {
  const namen = [...merkmalsNamen(datei), ...GRUPPEN]
  const dim = new Map(namen.map((n, i) => [n, i]))
  const vektoren = datei.einstiege.map((k) => vektorVon(k, datei, dim))
  return { datei, index: new Map(datei.einstiege.map((k, i) => [k.id, i])), vektoren, aehnlichkeit: aehnlichkeiten(vektoren) }
}

export const cos = (k, i, j) => k.aehnlichkeit[i * k.vektoren.length + j]

/** Zufall aus einem Startwert (mulberry32): gleicher Wert, gleiche Folge. */
export function zufall(startwert) {
  let s = startwert | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
