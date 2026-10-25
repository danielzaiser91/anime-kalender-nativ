// Schichtenregel aus CLAUDE.md Punkt 4: ui → zustand → logik → daten, nie zurück; Seiten kennen einander nicht.
import { dirname, join } from 'node:path'

const ERLAUBT = {
  daten: ['daten'],
  logik: ['logik'],
  zustand: ['zustand', 'logik', 'daten'],
  ui: ['ui', 'zustand', 'logik', 'daten'],
}

export function schichtVon(pfad) {
  return pfad.match(/^js\/(daten|logik|zustand|ui)\//)?.[1] ?? null
}

export function leseImporte(text) {
  const fest = [...text.matchAll(/^\s*import\b[^'"]*['"]([^'"]+)['"]/gm)]
  const dynamisch = [...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]/g)]
  return [...fest, ...dynamisch].map((m) => m[1])
}

const loese = (pfad, ziel) => join(dirname(pfad), ziel).replaceAll('\\', '/')

function pruefeImport(pfad, ziel) {
  if (!ziel.startsWith('.')) return pfad.startsWith('tools/') && ziel.startsWith('node:') ? [] : [`${pfad}: Import "${ziel}" ist keine eigene Datei (keine Abhängigkeiten)`]
  const aufgeloest = loese(pfad, ziel)
  const von = schichtVon(pfad)
  const nach = schichtVon(aufgeloest)
  if (von && nach && !ERLAUBT[von].includes(nach)) return [`${pfad}: Schicht ${von} importiert ${nach} (${ziel})`]
  if (von && !nach) return [`${pfad}: Import "${ziel}" führt aus den Schichten heraus`]
  if (pfad.startsWith('tools/') && aufgeloest.startsWith('js/') && nach !== 'logik') return [`${pfad}: Werkzeuge dürfen aus js/ nur logik/ nutzen (${ziel})`]
  const seiten = /^js\/ui\/seiten\//
  if (seiten.test(aufgeloest) && seiten.test(pfad) && aufgeloest !== pfad) return [`${pfad}: Seite importiert Seite (${ziel})`]
  if (seiten.test(aufgeloest) && /^js\/ui\/bausteine\//.test(pfad)) return [`${pfad}: Baustein importiert Seite (${ziel})`]
  return []
}

export function pruefeSchichten(pfad, text) {
  return leseImporte(text).flatMap((ziel) => pruefeImport(pfad, ziel))
}
