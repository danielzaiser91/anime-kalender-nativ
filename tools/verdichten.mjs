// Datenschritt: node tools/verdichten.mjs <Altrepo-Ordner> <Ausgabe-Ordner> [Quell-SHA]
// Liest public/data des Altrepos, prüft es und schreibt <Ausgabe>/stand.json und <Ausgabe>/woche/*.json.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ladeQuelle } from './verdichten/quelle.js'
import { baueTitelKarte, baueWochen, wochenBereich, SCHEMA } from './verdichten/wochen.js'

function schreibeJson(pfad, daten) {
  writeFileSync(pfad, JSON.stringify(daten))
}

function schreibe(ausgabe, wochen, stand) {
  mkdirSync(join(ausgabe, 'woche'), { recursive: true })
  for (const [schluessel, woche] of wochen) schreibeJson(join(ausgabe, 'woche', `${schluessel}.json`), woche)
  schreibeJson(join(ausgabe, 'stand.json'), stand)
}

function main([altrepo, ausgabe, sha = null]) {
  if (!altrepo || !ausgabe) throw new Error('Aufruf: node tools/verdichten.mjs <Altrepo-Ordner> <Ausgabe-Ordner> [Quell-SHA]')
  const quelle = ladeQuelle(altrepo)
  const bereich = wochenBereich(quelle.events, Date.parse(quelle.meta.generatedAt))
  const wochen = baueWochen(quelle.events, baueTitelKarte(quelle), bereich)
  const stand = { schema: SCHEMA, erzeugt: quelle.meta.generatedAt, quelle: sha, ...bereich }
  schreibe(ausgabe, wochen, stand)
  console.log(`verdichtet: ${wochen.size} Wochen ${bereich.von} bis ${bereich.bis}, ${quelle.events.length} Termine, Stand ${stand.erzeugt}`)
}

main(process.argv.slice(2))
