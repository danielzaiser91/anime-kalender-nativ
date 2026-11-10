// Datenschritt: node tools/verdichten.mjs <Altrepo-Ordner> <Ausgabe-Ordner> [Quell-SHA]
// Liest public/data des Altrepos, prüft es und schreibt <Ausgabe>/stand.json, woche, titel, sprecher, news, katalog, saison, feeds (siehe CLAUDE.md, Ordner).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { ladeQuelle } from './verdichten/quelle.js'
import { baueKatalog, baueSynonyme } from './verdichten/katalog.js'
import { baueSprecher } from './verdichten/sprecher.js'
import { baueDetail } from './verdichten/detail.js'
import { ladeDetailRoh } from './verdichten/detail-lesen.js'
import { baueTitelGruppen } from './verdichten/titel.js'
import { baueTitelKarte, baueWochen, wochenBereich, SCHEMA } from './verdichten/wochen.js'
import { baueNews, newsKontext } from './verdichten/news.js'
import { baueSaison } from './verdichten/saison.js'
import { kennungenMitPanel } from './verdichten/kennung.js'
import { baueFeedListe, ladeFeeds } from './verdichten/feeds.js'

function schreibeJson(pfad, daten) {
  writeFileSync(pfad, JSON.stringify(daten))
}

/** Eine Datei `<Ordner>/<Name>` unter der Ausgabe, der Ordner entsteht bei Bedarf. */
function schreibeJsonIn(ausgabe, pfad, inhalt) {
  mkdirSync(join(ausgabe, dirname(pfad)), { recursive: true })
  schreibeJson(join(ausgabe, `${pfad}.json`), inhalt)
}

function schreibeGruppe(ausgabe, unterordner, dateien) {
  mkdirSync(join(ausgabe, unterordner), { recursive: true })
  for (const [name, inhalt] of dateien) schreibeJson(join(ausgabe, unterordner, `${name}.json`), inhalt)
}

/** News (je Monat), Saison und Kalender-Feeds: die Dateien der Ansichten News, Saison und Abo. */
function schreibeSeiten({ altrepo, ausgabe, quelle, gruppen }) {
  const akVon = kennungenMitPanel(quelle.kennungen, gruppen)
  const news = baueNews(quelle.news, newsKontext(quelle, akVon))
  schreibeGruppe(ausgabe, 'news', news.wochen)
  schreibeJson(join(ausgabe, 'news', 'index.json'), news.index)
  schreibeJson(join(ausgabe, 'saison.json'), baueSaison(quelle, akVon))
  const feeds = ladeFeeds(altrepo)
  mkdirSync(join(ausgabe, 'feeds'), { recursive: true })
  for (const datei of feeds) writeFileSync(join(ausgabe, 'feeds', datei.name), datei.text)
  schreibeJson(join(ausgabe, 'feeds.json'), baueFeedListe(feeds))
  return news.index.wochen.length
}

function main([altrepo, ausgabe, sha = null]) {
  if (!altrepo || !ausgabe) throw new Error('Aufruf: node tools/verdichten.mjs <Altrepo-Ordner> <Ausgabe-Ordner> [Quell-SHA]')
  const quelle = ladeQuelle(altrepo)
  const bereich = wochenBereich(quelle.events, Date.parse(quelle.meta.generatedAt))
  const wochen = baueWochen(quelle.events, baueTitelKarte(quelle), bereich)
  const detail = baueDetail(quelle, ladeDetailRoh(altrepo))
  const gruppen = baueTitelGruppen(quelle, detail.merkmale)
  const stand = { schema: SCHEMA, erzeugt: quelle.meta.generatedAt, quelle: sha, ...bereich }
  const katalog = baueKatalog(quelle)
  const sprecher = baueSprecher(altrepo, new Set(katalog.titel.map((zeile) => zeile[1])))
  schreibeGruppe(ausgabe, 'woche', wochen)
  schreibeGruppe(ausgabe, 'titel', gruppen)
  schreibeGruppe(ausgabe, 'sprecher', sprecher.gruppen)
  for (const [pfad, inhalt] of detail.dateien) schreibeJsonIn(ausgabe, pfad, inhalt)
  schreibeJson(join(ausgabe, 'katalog.json'), katalog)
  schreibeJson(join(ausgabe, 'synonyme.json'), baueSynonyme(quelle.synonyme, quelle.titelVoll, katalog))
  schreibeJson(join(ausgabe, 'sprecher.json'), sprecher.index)
  const wochenNews = schreibeSeiten({ altrepo, ausgabe, quelle, gruppen })
  schreibeJson(join(ausgabe, 'stand.json'), stand)
  console.log(`verdichtet: ${wochen.size} Wochen ${bereich.von} bis ${bereich.bis}, ${quelle.events.length} Termine, ${gruppen.size} Titelgruppen, ${katalog.titel.length} Katalogtitel, ${wochenNews} Newswochen, Stand ${stand.erzeugt}`)
}

main(process.argv.slice(2))
