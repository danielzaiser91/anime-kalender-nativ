// Datenschritt: node tools/verdichten.mjs <Altrepo-Ordner> <Ausgabe-Ordner> [Quell-SHA]
// Liest public/data des Altrepos, prüft es und schreibt <Ausgabe>/stand.json, <Ausgabe>/woche/*.json und <Ausgabe>/titel/*.json.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ladeQuelle } from './verdichten/quelle.js'
import { baueKatalog, baueSynonyme } from './verdichten/katalog.js'
import { baueSprecher } from './verdichten/sprecher.js'
import { baueTitelGruppen } from './verdichten/titel.js'
import { baueTitelKarte, baueWochen, wochenBereich, SCHEMA } from './verdichten/wochen.js'

function schreibeJson(pfad, daten) {
  writeFileSync(pfad, JSON.stringify(daten))
}

function schreibeGruppe(ausgabe, unterordner, dateien) {
  mkdirSync(join(ausgabe, unterordner), { recursive: true })
  for (const [name, inhalt] of dateien) schreibeJson(join(ausgabe, unterordner, `${name}.json`), inhalt)
}

function main([altrepo, ausgabe, sha = null]) {
  if (!altrepo || !ausgabe) throw new Error('Aufruf: node tools/verdichten.mjs <Altrepo-Ordner> <Ausgabe-Ordner> [Quell-SHA]')
  const quelle = ladeQuelle(altrepo)
  const bereich = wochenBereich(quelle.events, Date.parse(quelle.meta.generatedAt))
  const wochen = baueWochen(quelle.events, baueTitelKarte(quelle), bereich)
  const gruppen = baueTitelGruppen(quelle)
  const stand = { schema: SCHEMA, erzeugt: quelle.meta.generatedAt, quelle: sha, ...bereich }
  const katalog = baueKatalog(quelle)
  const sprecher = baueSprecher(altrepo, new Set(katalog.titel.map((zeile) => zeile[1])))
  schreibeGruppe(ausgabe, 'woche', wochen)
  schreibeGruppe(ausgabe, 'titel', gruppen)
  schreibeGruppe(ausgabe, 'sprecher', sprecher.gruppen)
  schreibeJson(join(ausgabe, 'katalog.json'), katalog)
  schreibeJson(join(ausgabe, 'synonyme.json'), baueSynonyme(quelle.synonyme, quelle.titelVoll, katalog))
  schreibeJson(join(ausgabe, 'sprecher.json'), sprecher.index)
  schreibeJson(join(ausgabe, 'stand.json'), stand)
  console.log(`verdichtet: ${wochen.size} Wochen ${bereich.von} bis ${bereich.bis}, ${quelle.events.length} Termine, ${gruppen.size} Titelgruppen, ${katalog.titel.length} Katalogtitel, Stand ${stand.erzeugt}`)
}

main(process.argv.slice(2))
