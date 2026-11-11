// Rechenkern von "Was gucken?" (aus shared/empfehlung-kern.ts der Hauptseite): Duelle grenzen die Restmenge ein, am Ende stehen fünf Vorschläge.
// Alles reine Funktionen über den Zustand (Daten, JSON-fähig); ein Duell ist eine Funktion des Zustands, "Zurück" stellt den Vorzustand her.
import { cos, zufall } from './gucken-vektor.js'

/** Gewertete Duelle bis zu den ersten Vorschlägen, und bis "Noch vier Duelle – genauer". */
export const DUELLE_START = 6
export const DUELLE_MAX = 10
/** Gezeigte Duelle einschließlich "Egal": danach ist Schluss, auch ohne Antworten. */
export const SCHRITTE_MAX = 30
/** Die Restmenge schrumpft nie unter so viele Titel (die nächsten am Sieger). */
export const UNTERGRENZE_REST = 12
export const VORSCHLAEGE = 5
const PAAR_VERSUCHE = 40

/** Kennungen beliebiger Pool-Titel → Indizes ihrer Einstiege; Unbekanntes fällt weg. */
export function einstiegsIndizes(k, kennungen) {
  const indizes = new Set()
  for (const id of kennungen) {
    const i = k.index.get(k.datei.reihe[String(id)] ?? id)
    if (i !== undefined) indizes.add(i)
  }
  return [...indizes].sort((a, b) => a - b)
}

/** Start: alle Einstiege außer den ausgeschlossenen (Kennungen beliebiger Teile einer Reihe). */
export function neuerZustand(k, startwert, ausgeschlossen = []) {
  const aus = einstiegsIndizes(k, ausgeschlossen)
  const weg = new Set(aus)
  const rest = k.datei.einstiege.map((_, i) => i).filter((i) => !weg.has(i))
  return { startwert, schritt: 0, gewertet: 0, rest, sieger: [], gesehen: [], neutral: null, ausgeschlossen: aus }
}

const differenz = (k, a, b) => k.vektoren[a].map((x, m) => x - k.vektoren[b][m])

/** 0 = parallel zur Richtung des letzten neutralen Duells, 1 = senkrecht dazu. */
function richtungsAbstand(k, [a, b], vorher) {
  if (!vorher) return 1
  const d = differenz(k, a, b)
  const p = differenz(k, vorher[0], vorher[1])
  let punkt = 0
  let nd = 0
  let np = 0
  for (let m = 0; m < d.length; m++) {
    punkt += d[m] * p[m]
    nd += d[m] * d[m]
    np += p[m] * p[m]
  }
  return 1 - Math.abs(punkt / (Math.sqrt(nd * np) || 1))
}

/** Anteil der Restmenge, der näher an `a` als an `b` liegt. */
export function teilung(k, rest, [a, b]) {
  let naeher = 0
  for (const t of rest) if (cos(k, t, a) >= cos(k, t, b)) naeher++
  return naeher / rest.length
}

/** Paarkandidaten: nur Einstiege mit Teil 1 im Pool (`duell`), ungesehene zuerst. */
function paarKandidaten(k, z) {
  const duellfaehig = z.rest.filter((i) => k.datei.einstiege[i].duell === 1)
  const frisch = duellfaehig.filter((i) => !z.gesehen.includes(i))
  return frisch.length >= 2 ? frisch : duellfaehig
}

const punkteVon = (k, z, paar) => {
  const f = teilung(k, z.rest, paar)
  return (1 - cos(k, paar[0], paar[1])) * 4 * f * (1 - f) * richtungsAbstand(k, paar, z.neutral)
}

/** Das nächste Paar, eine reine Funktion des Zustands; `null`, wenn keins mehr zu bilden ist. */
export function naechstesPaar(k, z) {
  const kandidaten = paarKandidaten(k, z)
  if (kandidaten.length < 2) return null
  const r = zufall(z.startwert * 977 + z.schritt * 31 + 5)
  let bestes = null
  let bestePunkte = -1
  for (let versuch = 0; versuch < PAAR_VERSUCHE; versuch++) {
    const paar = [kandidaten[Math.floor(r() * kandidaten.length)], kandidaten[Math.floor(r() * kandidaten.length)]]
    if (paar[0] === paar[1]) continue
    const punkte = punkteVon(k, z, paar)
    if (punkte > bestePunkte) {
      bestePunkte = punkte
      bestes = paar
    }
  }
  return bestes ?? [kandidaten[0], kandidaten[1]]
}

/** Restmenge nach einem Duell: wer dem Sieger näher liegt als dem Verlierer; nie unter die Untergrenze. */
function eingrenzen(k, rest, [sieger, verlierer]) {
  const bleibt = rest.filter((t) => cos(k, t, sieger) >= cos(k, t, verlierer))
  if (bleibt.length >= UNTERGRENZE_REST) return bleibt
  return rest.slice().sort((p, q) => cos(k, q, sieger) - cos(k, p, sieger) || p - q).slice(0, UNTERGRENZE_REST)
}

/** Antwort ('A', 'B' oder 'N' für egal) auf das aktuelle Paar; der alte Zustand bleibt unverändert. Ohne Paar bleibt der Zustand, wie er ist. */
export function antworte(k, z, antwort) {
  const paar = naechstesPaar(k, z)
  if (!paar) return z
  const gesehen = [...z.gesehen, ...paar.filter((i) => !z.gesehen.includes(i))]
  const neu = { ...z, schritt: z.schritt + 1, gesehen }
  if (antwort === 'N') return { ...neu, neutral: paar }
  const [sieger, verlierer] = antwort === 'A' ? paar : [paar[1], paar[0]]
  return { ...neu, gewertet: z.gewertet + 1, neutral: null, sieger: [...z.sieger, sieger], rest: eingrenzen(k, z.rest, [sieger, verlierer]) }
}

/** Fertig: Ziel an gewerteten Duellen erreicht, zu viele "egal" oder kein Paar mehr. */
export const istFertig = (k, z, ziel) => z.gewertet >= ziel || z.schritt >= SCHRITTE_MAX || naechstesPaar(k, z) === null

/** "Duell n von 6" und "Noch ca. m von N Titeln". */
export function fortschritt(k, z, ziel) {
  return { gewertet: z.gewertet, ziel, rest: z.rest.length, gesamt: k.datei.einstiege.length - z.ausgeschlossen.length, fertig: istFertig(k, z, ziel) }
}

const tie = (i, startwert) => ((i * 2654435761 + startwert * 40503) % 1000) / 1e7

/**
 * Die besten Vorschläge: Restmenge vor dem Rest, darin nach mittlerer Nähe zu den Siegern. Duell-Titel, Ausgeschlossene und Verworfene
 * (Kennungen beliebiger Teile) kommen nie vor; weniger als `anzahl`, wenn nicht mehr übrig sind. `optionen`: `verworfen`, `anzahl`.
 */
export function vorschlaege(k, z, { verworfen = [], anzahl = VORSCHLAEGE } = {}) {
  const weg = new Set([...z.gesehen, ...z.ausgeschlossen, ...einstiegsIndizes(k, verworfen)])
  const imRest = new Set(z.rest)
  const punkte = (i) => {
    const nah = z.sieger.length ? z.sieger.reduce((s, w) => s + cos(k, w, i), 0) / z.sieger.length : 0
    return (imRest.has(i) ? 10 : 0) + nah + tie(i, z.startwert)
  }
  return k.datei.einstiege
    .map((_, i) => i)
    .filter((i) => !weg.has(i))
    .sort((a, b) => punkte(b) - punkte(a) || a - b)
    .slice(0, anzahl)
    .map((i) => k.datei.einstiege[i])
}

/** Zustand mit allen früheren, damit "Zurück" den Vorzustand exakt herstellt. */
export const neueSitzung = (z) => ({ zustand: z, verlauf: [] })

export function antworteSitzung(k, s, antwort) {
  const neu = antworte(k, s.zustand, antwort)
  return neu === s.zustand ? s : { zustand: neu, verlauf: [...s.verlauf, s.zustand] }
}

/** Ein Duell zurück: derselbe Zustand wie davor, also dasselbe Paar. Am Anfang bleibt alles, wie es ist. */
export function zurueck(s) {
  const vorher = s.verlauf.at(-1)
  return vorher ? { zustand: vorher, verlauf: s.verlauf.slice(0, -1) } : s
}
