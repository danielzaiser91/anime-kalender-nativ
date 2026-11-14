// Schreibt huelle.json: die Dateien, die der Service Worker beim Installieren legt (Start-HTML, alles unter css/ und js/, Manifest).
// Aufruf: node tools/huelle.mjs <Bauausgabe-Ordner>; endet mit Exit 1, wenn ein Pfad fehlt oder die Liste auffallend kurz ist.
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MINDESTENS = 50
const EINZELN = ['./', 'index.html', 'manifest.webmanifest']

function sammle(wurzel, ordner) {
  return readdirSync(join(wurzel, ordner), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sammle(wurzel, `${ordner}/${e.name}`) : [`${ordner}/${e.name}`]))
}

function huelleListe(wurzel) {
  return [...EINZELN, ...sammle(wurzel, 'css').sort(), ...sammle(wurzel, 'js').sort()]
}

function main([wurzel]) {
  const dateien = huelleListe(wurzel)
  const fehlt = dateien.filter((p) => p !== './' && !existsSync(join(wurzel, p)))
  writeFileSync(join(wurzel, 'huelle.json'), JSON.stringify({ schema: 1, dateien }))
  console.log(`Hülle: ${dateien.length} Dateien${fehlt.length ? `, FEHLT ${fehlt.join(', ')}` : ''}`)
  process.exitCode = fehlt.length || dateien.length < MINDESTENS ? 1 : 0
}

main(process.argv.slice(2))
