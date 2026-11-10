// Katalog für Suche und Filter: je Titel mit Kennung eine Zeile (Reihenfolge js/logik/katalog.js FELDER), Listen als Nummern in Tabellen.
// Dazu die weiteren Namen (synonyme.json), nur für Titel des Katalogs.
import { berlinText } from '../../js/logik/erschienen.js'
import { FELDER, KATALOG_SCHEMA } from '../../js/logik/katalog.js'
import { heuteInBerlin } from '../../js/logik/zeit.js'
import { hatKostenlos, herkunft, istStreambar, titelStatus } from './katalog-felder.js'

/** Eine Tabelle, die Werte beim ersten Auftreten nummeriert. */
function tabelle() {
  const liste = []
  const nummern = new Map()
  const nummer = (wert) => {
    if (!nummern.has(wert)) nummern.set(wert, liste.push(wert) - 1)
    return nummern.get(wert)
  }
  return { liste, nummer, nummeriere: (werte) => [...new Set(werte)].map(nummer) }
}

const letzteTermineVon = (events) => {
  const letzte = new Map()
  for (const e of events) if (!(letzte.get(e.releaseSlug) >= e.date)) letzte.set(e.releaseSlug, e.date)
  return letzte
}

/** Ein Name, der schon früher in der Reihe steht, entfällt (leer); die Suche findet ihn dort, der Anzeigename bleibt gleich. */
const ohneDoppelte = (namen) => namen.map((name, i) => (name && !namen.slice(0, i).includes(name) ? name : ''))

function zeileVon(titel, kontext) {
  const plaene = kontext.plaene.get(titel.id) ?? []
  const { tabellen: t } = kontext
  return {
    ak: kontext.ak.get(titel.id),
    id: titel.id,
    namen: ohneDoppelte([titel.titleDe, titel.titleEn, titel.titleRomaji]),
    format: titel.format ?? null,
    jahr: titel.jpYear ?? null,
    fsk: titel.fsk ?? null,
    herkunft: herkunft(titel),
    status: titelStatus(titel, plaene, kontext.zeit),
    stream: istStreambar(titel, plaene) ? 1 : 0,
    kostenlos: hatKostenlos(titel, kontext.zeit.jetzt) ? 1 : 0,
    genres: t.genre.nummeriere(titel.genres ?? []),
    keywords: t.keyword.nummeriere(titel.keywords ?? []),
    studios: t.studio.nummeriere(titel.studios ?? []),
    plattformen: t.plattform.nummeriere([...plaene.map((p) => p.platform), ...(titel.streams ?? []).map((s) => s.platform)]),
    anbieter: t.anbieter.nummeriere((titel.watchLinks ?? []).map((w) => w.name)),
    jahre: [...new Set(plaene.length ? plaene.map((p) => p.year) : titel.jpYear ? [titel.jpYear] : [])],
    arten: [...new Set(plaene.map((p) => p.releaseType))],
  }
}

export function baueKatalog({ titelVoll, releases, events, kennungen, meta }) {
  const ms = Date.parse(meta.generatedAt)
  const tabellen = { genre: tabelle(), keyword: tabelle(), studio: tabelle(), plattform: tabelle(), anbieter: tabelle() }
  const kontext = {
    tabellen,
    ak: new Map(kennungen.titel.map((z) => [z[1], z[3] ?? z[0]])),
    plaene: Map.groupBy(releases, (r) => r.titleId),
    zeit: { heute: heuteInBerlin(ms), jetzt: berlinText(ms), letzteTermine: letzteTermineVon(events) },
  }
  const zeilen = titelVoll.filter((t) => kontext.ak.has(t.id)).map((t) => zeileVon(t, kontext))
  const datei = { schema: KATALOG_SCHEMA, erzeugt: meta.generatedAt, heute: kontext.zeit.heute, titel: zeilen.map((z) => FELDER.map((feld) => z[feld])) }
  for (const [name, t] of Object.entries(tabellen)) datei[name] = t.liste
  return datei
}

/** Weitere Namen je Titel-ID für Titel im Katalog: der Name in Originalschrift, dann die Synonyme. */
export function baueSynonyme(synonyme, titelVoll, katalog) {
  const ids = new Set(katalog.titel.map((zeile) => zeile[FELDER.indexOf('id')]))
  const namen = {}
  for (const titel of titelVoll) {
    const liste = [titel.titleNative, ...(synonyme[titel.id] ?? [])].filter(Boolean)
    if (ids.has(titel.id) && liste.length) namen[titel.id] = liste
  }
  return { schema: KATALOG_SCHEMA, namen }
}
