// Startbudget aus CLAUDE.md Punkt 7: HTML + CSS + JS + Startdaten (stand.json und die Woche von heute), gzip, ohne Cover.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

export const BUDGET_BYTES = 50 * 1024

const gz = (pfad) => gzipSync(readFileSync(pfad), { level: 9 }).length

function sammle(ordner, endung) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const pfad = join(ordner, e.name)
    if (e.isDirectory()) return sammle(pfad, endung)
    return pfad.endsWith(endung) ? [pfad] : []
  })
}

/** Misst eine fertige Bauausgabe (_site); `woche` ist die Startwoche, deren Datei dazuzählt. */
export function messeStart(ausgabe, woche) {
  const code = [join(ausgabe, 'index.html'), ...sammle(join(ausgabe, 'css'), '.css'), ...sammle(join(ausgabe, 'js'), '.js')]
  const daten = [join(ausgabe, 'data', 'stand.json'), join(ausgabe, 'data', 'woche', `${woche}.json`)]
  const summe = (liste) => liste.reduce((s, p) => s + gz(p), 0)
  return { code: summe(code), daten: summe(daten), gesamt: summe(code) + summe(daten) }
}

export function pruefeBudget(messung) {
  return messung.gesamt > BUDGET_BYTES ? [`Start ${messung.gesamt} Byte gzip, Budget ${BUDGET_BYTES}`] : []
}
