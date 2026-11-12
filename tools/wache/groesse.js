// Budgets aus CLAUDE.md Punkt 7: Start = HTML + eingebundenes CSS + statisch importiertes JS + Startdaten (stand.json und die Woche von heute),
// gzip, ohne Cover. Was erst per import() geladen wird, ist ein Baustein und zählt je Baustein zum Lazy-JS-Budget, nicht zum Start.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { gzipSync } from 'node:zlib'

export const BUDGET_BYTES = 50 * 1024
export const LAZY_JS_BYTES = 20 * 1024
// Ziele sind keine Fehler: eine Zahl darüber wird markiert, bis gekürzt ist.
export const ZIEL_START_BYTES = 30 * 1024
export const ZIEL_LAZY_JS_BYTES = 12 * 1024

const FEST = /(?:^|[;}\s])import\s*(?:[^'"()]*from)?\s*['"](\.[^'"]+)['"]/g
const DYNAMISCH = /\bimport\(\s*['"](\.[^'"]+)['"]/g

const gz = (pfad) => gzipSync(readFileSync(pfad), { level: 9 }).length
const summe = (liste) => liste.reduce((s, p) => s + gz(p), 0)

function sammle(ordner, endung) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const pfad = join(ordner, e.name)
    if (e.isDirectory()) return sammle(pfad, endung)
    return pfad.endsWith(endung) ? [pfad] : []
  })
}

const importe = (pfad, muster) => [...readFileSync(pfad, 'utf8').matchAll(muster)].map((m) => join(dirname(pfad), m[1]))

/** Die Module, die ein Einstieg statisch (ohne import()) erreicht, samt ihm selbst. */
function statischeModule(einstieg) {
  const gesehen = new Set()
  const offen = [einstieg]
  while (offen.length) {
    const pfad = offen.pop()
    if (gesehen.has(pfad)) continue
    gesehen.add(pfad)
    offen.push(...importe(pfad, FEST))
  }
  return [...gesehen]
}

/** Jedes Ziel eines import() ist ein Baustein: seine statisch erreichbaren Module ohne die des Starts; ein import() darin ist ein eigener Baustein. */
function bausteine(start) {
  const module = new Set(start)
  const ziele = new Map()
  const offen = [...start]
  while (offen.length) {
    for (const ziel of importe(offen.pop(), DYNAMISCH)) {
      if (ziele.has(ziel)) continue
      const eigene = statischeModule(ziel).filter((m) => !start.includes(m))
      ziele.set(ziel, eigene)
      for (const m of eigene) {
        if (module.has(m)) continue
        module.add(m)
        offen.push(m)
      }
    }
  }
  return ziele
}

/** Die im index.html eingebundenen Stylesheets. */
function startCss(ausgabe) {
  const html = readFileSync(join(ausgabe, 'index.html'), 'utf8')
  return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => join(ausgabe, m[1]))
}

// Dateien, die erst beim Öffnen der Suche kommen: sie zählen nicht zum Start, ihre Größe steht aber in der Zeile.
const LAZY_DATEIEN = ['katalog.json', 'synonyme.json', 'sprecher.json']

// Der Service Worker liegt im Wurzelordner (sonst gälte sein Geltungsbereich nur für einen Unterordner) und zählt zum Gesamt-JS.
const swDatei = (ausgabe) => [join(ausgabe, 'sw.js')].filter(existsSync)

/** Misst eine fertige Bauausgabe (_site); `woche` ist die Startwoche, deren Datei dazuzählt. */
export function messeStart(ausgabe, woche) {
  const start = statischeModule(join(ausgabe, 'js', 'main.js'))
  const code = [join(ausgabe, 'index.html'), ...startCss(ausgabe), ...start]
  const daten = [join(ausgabe, 'data', 'stand.json'), join(ausgabe, 'data', 'woche', `${woche}.json`)]
  const lazyJs = [...sammle(join(ausgabe, 'js'), '.js').filter((p) => !start.includes(p)), ...swDatei(ausgabe)]
  const lazyCss = sammle(join(ausgabe, 'css'), '.css').filter((p) => !startCss(ausgabe).includes(p))
  const baustein = [...bausteine(start)].map(([ziel, module]) => ({ name: relative(join(ausgabe, 'js'), ziel).replaceAll('\\', '/'), bytes: summe(module) }))
  const lazyDaten = LAZY_DATEIEN.filter((name) => existsSync(join(ausgabe, 'data', name))).map((name) => ({ name, bytes: gz(join(ausgabe, 'data', name)) }))
  return { code: summe(code), daten: summe(daten), gesamt: summe(code) + summe(daten), lazyJs: summe(lazyJs), lazyCss: summe(lazyCss), bausteine: baustein, lazyDaten }
}

const kb = (bytes) => (bytes / 1024).toFixed(1)
const zahl = (bytes, grenze, ziel) => `${kb(bytes)} von ${grenze / 1024} KB (Ziel ${ziel / 1024})${bytes > ziel ? ' über Ziel' : ''}`
const bausteinText = (b) => `${b.name} ${kb(b.bytes)}${b.bytes > ZIEL_LAZY_JS_BYTES ? ' über Ziel' : ''}`

/** Die Größenzeile des Wächters: Start, je Baustein (Ziel 12, hart 20 KB), Gesamtsumme (Start + alles Nachgeladene) mit Marke "über Ziel". */
export function groessenText(m) {
  const gesamt = m.gesamt + m.lazyJs + m.lazyCss
  const ziel = ZIEL_START_BYTES + ZIEL_LAZY_JS_BYTES
  const liste = m.bausteine.map(bausteinText).join(', ')
  const dateien = (m.lazyDaten ?? []).map((d) => `${d.name} ${kb(d.bytes)}`).join(', ')
  return `Start ${zahl(m.gesamt, BUDGET_BYTES, ZIEL_START_BYTES)} gzip (Code ${kb(m.code)}, Daten ${kb(m.daten)}), Bausteine lazy JS (je Ziel ${ZIEL_LAZY_JS_BYTES / 1024}, hart ${LAZY_JS_BYTES / 1024} KB): ${liste}, CSS ${kb(m.lazyCss)} KB, Gesamt ${kb(gesamt)} KB${gesamt > ziel ? ' über Ziel' : ''}${dateien ? `, Daten der Suche gzip: ${dateien} KB` : ''}`
}

export function pruefeBudget(messung) {
  const start = messung.gesamt > BUDGET_BYTES ? [`Start ${messung.gesamt} Byte gzip, Budget ${BUDGET_BYTES}`] : []
  const lazy = messung.bausteine.filter((b) => b.bytes > LAZY_JS_BYTES).map((b) => `Baustein ${b.name} ${b.bytes} Byte gzip, Budget ${LAZY_JS_BYTES}`)
  return [...start, ...lazy]
}
