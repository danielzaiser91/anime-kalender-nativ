// Umfangsregeln aus CLAUDE.md Punkt 3: Modul höchstens 200 Zeilen, Funktion höchstens 40, höchstens 3 Parameter.
import { findeFunktionen } from './funktionen.js'

export const MAX_ZEILEN = 200
export const MAX_FUNKTION = 40
export const MAX_PARAMETER = 3

export function pruefeDateiUmfang(pfad, text) {
  const zeilen = text.replace(/\n$/, '').split('\n').length
  return zeilen > MAX_ZEILEN ? [`${pfad}: ${zeilen} Zeilen, erlaubt ${MAX_ZEILEN}`] : []
}

function pruefeFunktion(pfad, f) {
  const funde = []
  const stelle = `${pfad}:${f.zeile} ${f.name}`
  if (f.zeilen > MAX_FUNKTION) funde.push(`${stelle}: ${f.zeilen} Zeilen, erlaubt ${MAX_FUNKTION}`)
  if (f.parameter > MAX_PARAMETER) funde.push(`${stelle}: ${f.parameter} Parameter, erlaubt ${MAX_PARAMETER}`)
  return funde
}

export function pruefeFunktionen(pfad, entschaerft) {
  return findeFunktionen(entschaerft).flatMap((f) => pruefeFunktion(pfad, f))
}
