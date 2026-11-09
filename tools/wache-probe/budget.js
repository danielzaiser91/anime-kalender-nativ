// Probefälle für die Budgetmessung (groesse.js): Grenzen je Baustein, statisch erreichbares Modul zählt zum Start, per import() nicht, verschachtelte Bausteine zählen eigen.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { groessenText, messeStart, pruefeBudget } from '../wache/groesse.js'

const KB = 1024
const messung = (extra) => ({ code: 1, daten: 1, gesamt: 1, lazyJs: 0, lazyCss: 0, bausteine: [], ...extra })
const baustein = (bytes, name = 'a.js') => [{ name, bytes }]
const marken = (m) => (groessenText(messung(m)).match(/über Ziel/g) ?? []).length

const WOCHE = '2026-W46'
const MODUL = Array.from({ length: 200 }, (_, i) => `export const z${i} = ${(i * 7919) % 1009}`).join('\n')

function baue(dateien) {
  const wurzel = mkdtempSync(join(tmpdir(), 'wache-budget-'))
  for (const ordner of ['js', 'css', 'data/woche']) mkdirSync(join(wurzel, ordner), { recursive: true })
  writeFileSync(join(wurzel, 'index.html'), '<link rel="stylesheet" href="css/a.css">')
  writeFileSync(join(wurzel, 'css', 'a.css'), 'a{}')
  writeFileSync(join(wurzel, 'data', 'stand.json'), '{}')
  writeFileSync(join(wurzel, 'data', 'woche', `${WOCHE}.json`), '{}')
  for (const [name, inhalt] of Object.entries(dateien)) writeFileSync(join(wurzel, 'js', name), inhalt)
  return wurzel
}

function gemessen(dateien) {
  const wurzel = baue({ 'panel.js': MODUL, ...dateien })
  const ergebnis = messeStart(wurzel, WOCHE)
  rmSync(wurzel, { recursive: true, force: true })
  return ergebnis
}

const lazyBytes = (hauptJs) => gemessen({ 'main.js': hauptJs }).lazyJs
const anzahl = (dateien) => gemessen(dateien).bausteine.length

/** Äußerer (panel.js) und innerer (tief.js) Baustein haben gleich große Module; zählt der äußere den inneren mit, ist er fast doppelt so groß. */
function verschachtelt(urteil) {
  const { bausteine } = gemessen({ 'main.js': "import('./panel.js')", 'panel.js': `import('./tief.js')\n${MODUL}`, 'tief.js': MODUL })
  const groesse = (name) => bausteine.find((b) => b.name === name).bytes
  return urteil(groesse('panel.js'), groesse('tief.js'))
}

export const FAELLE_BUDGET = [
  ['Baustein genau am Budget', () => pruefeBudget(messung({ bausteine: baustein(20480) })).length, 0],
  ['Baustein ein Byte über Budget', () => pruefeBudget(messung({ bausteine: baustein(20481) })).length, 1],
  ['Zwei Bausteine je unter Budget, Summe darüber: kein Verstoß', () => pruefeBudget(messung({ bausteine: [...baustein(15 * KB), ...baustein(15 * KB, 'b.js')] })).length, 0],
  ['Zwei Bausteine über Budget: zwei Verstöße', () => pruefeBudget(messung({ bausteine: [...baustein(20481), ...baustein(20481, 'b.js')] })).length, 2],
  ['Start ein Byte über Budget', () => pruefeBudget(messung({ gesamt: 51201 })).length, 1],
  ['Panel per import() zählt als Lazy', () => (lazyBytes("const p = () => import('./panel.js')") > 0 ? 0 : 1), 0],
  ['Panel statisch importiert zählt zum Start', () => (lazyBytes("import { z1 } from './panel.js'") === 0 ? 0 : 1), 0],
  ['Minifizierter statischer Import zählt zum Start', () => (lazyBytes('const a=1;import{z1}from"./panel.js";') === 0 ? 0 : 1), 0],
  ['Minifizierter import() zählt als Lazy', () => (lazyBytes('const p=()=>import("./panel.js");') > 0 ? 0 : 1), 0],
  ['Ein import() ist ein Baustein', () => anzahl({ 'main.js': "const p = () => import('./panel.js')" }), 1],
  ['Verschachtelter import() ist ein eigener Baustein', () => anzahl({ 'main.js': "import('./panel.js')", 'panel.js': "import('./tief.js')", 'tief.js': MODUL }), 2],
  ['Verschachtelter Baustein zählt nicht in den äußeren', () => verschachtelt((aussen, innen) => (aussen < innen * 1.5 ? 0 : 1)), 0],
  ['Gesamtsumme nennt Start, Lazy-JS und CSS zusammen', () => (groessenText(messung({ gesamt: 3 * KB, lazyJs: 2 * KB, lazyCss: KB, bausteine: baustein(2 * KB) })).includes('Gesamt 6.0 KB') ? 0 : 1), 0],
  ['Baustein genau am Ziel: keine Marke', () => marken({ gesamt: KB, bausteine: baustein(12 * KB) }), 0],
  ['Baustein ein Byte über Ziel: eine Marke', () => marken({ gesamt: KB, bausteine: baustein(12 * KB + 1) }), 1],
  ['Zwei Bausteine, einer über Ziel: eine Marke', () => marken({ gesamt: KB, bausteine: [...baustein(13 * KB), ...baustein(KB, 'b.js')] }), 1],
  ['Start ein Byte über Ziel: eine Marke', () => marken({ gesamt: 30 * KB + 1, bausteine: baustein(KB) }), 1],
  ['Start und Baustein über Ziel: drei Marken (Start, Baustein, Gesamt)', () => marken({ gesamt: 31 * KB, lazyJs: 13 * KB, bausteine: baustein(13 * KB) }), 3],
  ['Über Ziel, unter Grenze ist kein Verstoß', () => pruefeBudget(messung({ gesamt: 40 * KB, bausteine: baustein(15 * KB) })).length, 0],
]
