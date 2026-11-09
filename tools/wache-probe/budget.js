// Probefälle für die Budgetmessung (groesse.js): Lazy über Budget, statisch erreichbares Panel zählt zum Start, per import() nicht.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { groessenText, messeStart, pruefeBudget } from '../wache/groesse.js'

const KB = 1024
const marken = (m) => (groessenText({ code: 1, daten: 1, lazyCss: 0, ...m }).match(/über Ziel/g) ?? []).length

const WOCHE = '2026-W46'

function baue(hauptJs) {
  const wurzel = mkdtempSync(join(tmpdir(), 'wache-budget-'))
  for (const ordner of ['js', 'css', 'data/woche']) mkdirSync(join(wurzel, ordner), { recursive: true })
  writeFileSync(join(wurzel, 'index.html'), '<link rel="stylesheet" href="css/a.css">')
  writeFileSync(join(wurzel, 'css', 'a.css'), 'a{}')
  writeFileSync(join(wurzel, 'data', 'stand.json'), '{}')
  writeFileSync(join(wurzel, 'data', 'woche', `${WOCHE}.json`), '{}')
  writeFileSync(join(wurzel, 'js', 'main.js'), hauptJs)
  writeFileSync(join(wurzel, 'js', 'panel.js'), Array.from({ length: 200 }, (_, i) => `export const z${i} = ${i * 7919 % 1009}`).join('\n'))
  return wurzel
}

function lazyBytes(hauptJs) {
  const wurzel = baue(hauptJs)
  const lazy = messeStart(wurzel, WOCHE).lazyJs
  rmSync(wurzel, { recursive: true, force: true })
  return lazy
}

export const FAELLE_BUDGET = [
  ['Lazy genau am Budget', () => pruefeBudget({ gesamt: 1, lazyJs: 20480 }).length, 0],
  ['Lazy ein Byte über Budget', () => pruefeBudget({ gesamt: 1, lazyJs: 20481 }).length, 1],
  ['Start ein Byte über Budget', () => pruefeBudget({ gesamt: 51201, lazyJs: 1 }).length, 1],
  ['Panel per import() zählt als Lazy', () => (lazyBytes("const p = () => import('./panel.js')") > 0 ? 0 : 1), 0],
  ['Panel statisch importiert zählt zum Start', () => (lazyBytes("import { z1 } from './panel.js'") === 0 ? 0 : 1), 0],
  ['Minifizierter statischer Import zählt zum Start', () => (lazyBytes('const a=1;import{z1}from"./panel.js";') === 0 ? 0 : 1), 0],
  ['Gesamtsumme nennt Start, Lazy-JS und CSS zusammen', () => (groessenText({ code: 1, daten: 1, gesamt: 3 * KB, lazyJs: 2 * KB, lazyCss: KB }).includes('Gesamt 6.0 KB') ? 0 : 1), 0],
  ['Lazy genau am Ziel: keine Marke', () => marken({ gesamt: KB, lazyJs: 12 * KB }), 0],
  ['Lazy ein Byte über Ziel: eine Marke', () => marken({ gesamt: KB, lazyJs: 12 * KB + 1 }), 1],
  ['Start ein Byte über Ziel: eine Marke', () => marken({ gesamt: 30 * KB + 1, lazyJs: KB }), 1],
  ['Start und Lazy über Ziel: drei Marken (Start, Lazy, Gesamt)', () => marken({ gesamt: 31 * KB, lazyJs: 13 * KB }), 3],
  ['Über Ziel, unter Grenze ist kein Verstoß', () => pruefeBudget({ gesamt: 40 * KB, lazyJs: 15 * KB }).length, 0],
  ['Minifizierter import() zählt als Lazy', () => (lazyBytes('const p=()=>import("./panel.js");') > 0 ? 0 : 1), 0],
]
