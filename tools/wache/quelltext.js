// Quelltext lesen und von Kommentaren und Zeichenketteninhalt befreien, damit Regeln nur echten Code sehen.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ENDUNGEN = /\.(js|mjs|css|html)$/
const AUSGESCHLOSSEN = new Set(['.git', 'node_modules', '_site', 'altrepo'])

export function sammleDateien(wurzel, ordner = wurzel) {
  const funde = []
  for (const name of readdirSync(ordner)) {
    if (AUSGESCHLOSSEN.has(name)) continue
    const pfad = join(ordner, name)
    if (statSync(pfad).isDirectory()) funde.push(...sammleDateien(wurzel, pfad))
    else funde.push(relative(wurzel, pfad).replaceAll('\\', '/'))
  }
  return funde
}

export const istQuelltext = (pfad) => ENDUNGEN.test(pfad)

