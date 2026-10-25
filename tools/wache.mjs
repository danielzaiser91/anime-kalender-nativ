// Regelwächter (kein Test): prüft den Quelltext gegen CLAUDE.md.
// Aufruf: node tools/wache.mjs [<Bauausgabe-Ordner> [<Startwoche JJJJ-Www>]]  – mit Ordner zusätzlich das Startbudget (Standard: diese Woche).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { heuteInBerlin, wocheVon } from '../js/logik/zeit.js'
import { entschaerfe } from './wache/entschaerfen.js'
import { messeStart, pruefeBudget } from './wache/groesse.js'
import { istQuelltext, sammleDateien } from './wache/quelltext.js'
import { pruefeDateiUmfang, pruefeFunktionen } from './wache/regeln-umfang.js'
import { pruefeAussenadressen, pruefeDateiNamen, pruefePackage } from './wache/regeln-repo.js'
import { pruefeSchichten } from './wache/regeln-schichten.js'
import { pruefeDomFrei, pruefeModulvariablen, pruefeVerbote } from './wache/regeln-verbote.js'

const WURZEL = join(import.meta.dirname, '..')
const istCode = (pfad) => /\.m?js$/.test(pfad)

function pruefeCode(pfad, text) {
  const hart = entschaerfe(text)
  return [
    ...pruefeDateiUmfang(pfad, text),
    ...pruefeFunktionen(pfad, hart),
    ...pruefeSchichten(pfad, text),
    ...pruefeVerbote(pfad, hart),
    ...pruefeModulvariablen(pfad, hart),
    ...pruefeDomFrei(pfad, hart),
  ]
}

function pruefeDatei(pfad) {
  const text = readFileSync(join(WURZEL, pfad), 'utf8')
  return [...(istCode(pfad) ? pruefeCode(pfad, text) : []), ...pruefeAussenadressen(pfad, text)]
}

function main([ausgabe, woche = wocheVon(heuteInBerlin(Date.now()))]) {
  const pfade = sammleDateien(WURZEL)
  const quelltexte = pfade.filter(istQuelltext)
  const verstoesse = [...pruefeDateiNamen(pfade), ...pruefePackage(readFileSync(join(WURZEL, 'package.json'), 'utf8')), ...quelltexte.flatMap(pruefeDatei)]
  let budget = ''
  if (ausgabe) {
    const messung = messeStart(ausgabe, woche)
    verstoesse.push(...pruefeBudget(messung))
    budget = `, Start ${(messung.gesamt / 1024).toFixed(1)} KB gzip (Code ${(messung.code / 1024).toFixed(1)}, Daten ${(messung.daten / 1024).toFixed(1)})`
  }
  verstoesse.forEach((v) => console.log(`VERSTOSS ${v}`))
  console.log(`Wächter: ${quelltexte.length} Dateien, ${verstoesse.length} Verstöße${budget}`)
  process.exitCode = verstoesse.length ? 1 : 0
}

main(process.argv.slice(2))
