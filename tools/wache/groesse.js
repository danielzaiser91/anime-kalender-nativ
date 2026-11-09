// Budgets aus CLAUDE.md Punkt 7: Start = HTML + eingebundenes CSS + statisch importiertes JS + Startdaten (stand.json und die Woche von heute),
// gzip, ohne Cover. Was erst per import() geladen wird (das Panel), zählt zum Lazy-JS-Budget, nicht zum Start.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { gzipSync } from 'node:zlib'

export const BUDGET_BYTES = 50 * 1024
export const LAZY_JS_BYTES = 20 * 1024

const gz = (pfad) => gzipSync(readFileSync(pfad), { level: 9 }).length
const summe = (liste) => liste.reduce((s, p) => s + gz(p), 0)

function sammle(ordner, endung) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const pfad = join(ordner, e.name)
    if (e.isDirectory()) return sammle(pfad, endung)
    return pfad.endsWith(endung) ? [pfad] : []
  })
}

/** Die Module, die main.js statisch (ohne import()) erreicht, samt main.js selbst. */
function startModule(einstieg) {
  const gesehen = new Set()
  const offen = [einstieg]
  while (offen.length) {
    const pfad = offen.pop()
    if (gesehen.has(pfad)) continue
    gesehen.add(pfad)
    const importe = [...readFileSync(pfad, 'utf8').matchAll(/^\s*import\b[^'"]*['"](\.[^'"]+)['"]/gm)]
    offen.push(...importe.map((m) => join(dirname(pfad), m[1])))
  }
  return [...gesehen]
}

/** Die im index.html eingebundenen Stylesheets. */
function startCss(ausgabe) {
  const html = readFileSync(join(ausgabe, 'index.html'), 'utf8')
  return [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => join(ausgabe, m[1]))
}

/** Misst eine fertige Bauausgabe (_site); `woche` ist die Startwoche, deren Datei dazuzählt. */
export function messeStart(ausgabe, woche) {
  const start = startModule(join(ausgabe, 'js', 'main.js'))
  const code = [join(ausgabe, 'index.html'), ...startCss(ausgabe), ...start]
  const daten = [join(ausgabe, 'data', 'stand.json'), join(ausgabe, 'data', 'woche', `${woche}.json`)]
  const lazyJs = sammle(join(ausgabe, 'js'), '.js').filter((p) => !start.includes(p))
  const lazyCss = sammle(join(ausgabe, 'css'), '.css').filter((p) => !startCss(ausgabe).includes(p))
  return { code: summe(code), daten: summe(daten), gesamt: summe(code) + summe(daten), lazyJs: summe(lazyJs), lazyCss: summe(lazyCss) }
}

export function pruefeBudget(messung) {
  const start = messung.gesamt > BUDGET_BYTES ? [`Start ${messung.gesamt} Byte gzip, Budget ${BUDGET_BYTES}`] : []
  const lazy = messung.lazyJs > LAZY_JS_BYTES ? [`Lazy-JS ${messung.lazyJs} Byte gzip, Budget ${LAZY_JS_BYTES}`] : []
  return [...start, ...lazy]
}
