// Pool für "Was gucken?": die Datei der Hauptseite (public/data/empfehlung.json) mit Kennung ak statt AniList-ID, dazu das Cover.
// Bewertung und Trailer entfallen (die Seite braucht sie nicht), Anbieter bleiben als Liste der Plattformen.
import { vorschauCover } from './vorschau-cover.js'

export const EMPFEHLUNG_SCHEMA = 1

function einstieg(k, kontext) {
  const neu = { id: kontext.akVon.get(k.id), n: k.n, f: k.f, y: k.y, e: k.e, g: k.g, k: k.k, fsk: k.fsk, p: [...new Set(k.p.map(([plattform]) => plattform))] }
  const cover = kontext.covers.get(k.id)
  if (cover) neu.c = cover
  if (k.duell) neu.duell = 1
  if (k.ab !== undefined) neu.ab = k.ab
  return neu
}

/** Pool-Kennung → Kennung des Einstiegs ihrer Reihe, beides als ak; was keine Kennung mit Panel hat, fällt weg. */
function reiheVon(reihe, akVon) {
  const karte = {}
  for (const [id, ziel] of Object.entries(reihe)) {
    if (akVon.has(Number(id)) && akVon.has(ziel)) karte[akVon.get(Number(id))] = akVon.get(ziel)
  }
  return karte
}

export function baueEmpfehlung({ empfehlung, titelVoll }, akVon) {
  const covers = new Map(titelVoll.map((t) => [t.id, vorschauCover(t.coverImage)]))
  const kontext = { akVon, covers }
  const einstiege = empfehlung.einstiege.filter((k) => akVon.has(k.id)).map((k) => einstieg(k, kontext))
  return { schema: EMPFEHLUNG_SCHEMA, genres: empfehlung.genres, keywords: empfehlung.keywords, einstiege, reihe: reiheVon(empfehlung.reihe, akVon) }
}
