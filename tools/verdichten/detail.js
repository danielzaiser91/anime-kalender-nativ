// Panel-Rest: je Titel kleine Dateien (Handlung, Besetzung, Folgentitel, Disc, ähnliche Titel), je Reihe eine; dazu die Merkmale, die den Titelbaustein sagen, was es gibt.
import { baueAehnliche } from './aehnlich.js'
import { baueDisc } from './disc.js'
import { baueHandlung } from './handlung.js'
import { baueQuellen } from './quellen.js'
import { baueReihen, sammleReihen } from './reihe.js'
import { istEcchi } from './wochen.js'

const SCHEMA = 1

/** Besetzung: Rollen als [Figur, Sprecher, Herkunft] (Herkunft nur, wenn die Quelle eine nennt). */
function besetzungVon(roh) {
  if (!roh?.roles?.length && !roh?.annUrl) return null
  return { rollen: (roh.roles ?? []).map((r) => (r.von ? [r.character, r.actor, r.von] : [r.character, r.actor])), ...(roh.annUrl && { annUrl: roh.annUrl }) }
}

function folgenVon(roh, id) {
  return roh.folgen.has(id) ? roh.liesFolgen(id) : null
}

/** Dateien eines Titels; fehlt der Inhalt, fehlt die Datei und der Baustein bekommt kein Merkmal. */
function dateienDesTitels(titel, ctx) {
  const { roh, reihen, disc, aehnliche } = ctx
  const handlung = baueHandlung(titel, roh.handlungen, reihen.get(titel.franchiseId ?? titel.id) ?? [])
  const besetzung = titel.hasVoices ? besetzungVon(roh.liesBesetzung(titel.id)) : null
  return { handlung, besetzung, folgen: folgenVon(roh, titel.id), disc: disc.get(titel.id) ?? null, aehnlich: aehnliche.get(titel.id) ?? null }
}

const MERKMAL = { handlung: 'h', besetzung: 'b', folgen: 'f', disc: 'd', aehnlich: 'a' }

/** Alles, was der Bau schreibt: `dateien` (Pfad → Inhalt) und `merkmale` (AniList-ID → hat, reihe, quellen). */
export function baueDetail({ titelVoll, releases, kennungen }, roh) {
  const kennung = new Map(kennungen.titel.map((z) => [z[1], z[3] ?? z[0]]))
  const akVon = new Map(titelVoll.filter((t) => kennung.has(t.id)).map((t) => [t.id, kennung.get(t.id)]))
  const ecchi = new Set(titelVoll.filter(istEcchi).map((t) => t.id))
  const reihenTeile = sammleReihen({ titelVoll, franchises: roh.franchises })
  const reihen = baueReihen(reihenTeile, akVon, ecchi)
  const ctx = { roh, reihen: reihenTeile, disc: baueDisc(roh.discAusgaben, releases), aehnliche: baueAehnliche(titelVoll, akVon) }
  const nachTitel = Map.groupBy(releases, (r) => r.titleId)
  const dateien = new Map([...reihen].map(([wurzel, inhalt]) => [`reihe/${wurzel}`, { schema: SCHEMA, ...inhalt }]))
  const merkmale = new Map()
  for (const titel of titelVoll.filter((t) => akVon.has(t.id))) {
    const inhalte = dateienDesTitels(titel, ctx)
    let hat = ''
    for (const [art, inhalt] of Object.entries(inhalte)) {
      if (!inhalt) continue
      hat += MERKMAL[art]
      dateien.set(`${art}/${akVon.get(titel.id)}`, { schema: SCHEMA, ...(art === 'aehnlich' ? { v: inhalt } : inhalt) })
    }
    const wurzel = titel.franchiseId ?? titel.id
    merkmale.set(titel.id, { hat, ...(reihen.has(wurzel) && { reihe: wurzel }), quellen: baueQuellen(titel, nachTitel.get(titel.id) ?? [], roh.handlungen.get(titel.id)) })
  }
  return { dateien, merkmale }
}
