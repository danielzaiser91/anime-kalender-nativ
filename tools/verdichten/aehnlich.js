// Ähnliche Titel je Titel, gerechnet wie auf der Hauptseite (shared/aehnlich.ts): Genres und Schlagworte, seltene zählen mehr.
// Der Browser bekommt nur die fünf Vorschläge je Titel, nicht den ganzen Bestand.
import { anzeigeName } from '../../js/logik/titel.js'
import { vorschauCover } from './vorschau-cover.js'

const ANZAHL = 5
const MINDESTANTEIL = 0.15
const UNBELEGT_FAKTOR = 0.6
const GEMEINSAM_MAX = 3

const synchroBelegt = (titel) => titel.dubConfidence === 'high' || titel.dubConfidence === 'very-high'
const rang = (v) => v.anteil * (synchroBelegt(v.titel) ? 1 : UNBELEGT_FAKTOR)

/** Genres und Schlagworte; ein Schlagwort, das schon als Genre dasteht, zählt nicht doppelt. */
export function merkmale(titel) {
  const genres = (titel.genres ?? []).map((g) => `g:${g}`)
  const schon = new Set((titel.genres ?? []).map((g) => g.toLowerCase()))
  const keywords = (titel.keywords ?? []).filter((k) => !schon.has(k.toLowerCase())).map((k) => `k:${k}`)
  return [...new Set([...genres, ...keywords])]
}

/** Gewicht je Merkmal: log(Titelzahl / Titel mit diesem Merkmal). */
function gewichte(merkmalListen) {
  const haeufigkeit = new Map()
  for (const liste of merkmalListen) for (const m of liste) haeufigkeit.set(m, (haeufigkeit.get(m) ?? 0) + 1)
  return new Map([...haeufigkeit].map(([m, df]) => [m, Math.log(merkmalListen.length / df)]))
}

function vergleiche(eigene, fremde, w) {
  let schnitt = 0
  let verein = eigene.gewicht
  const gemeinsam = []
  for (const m of fremde) {
    const g = w.get(m) ?? 0
    if (eigene.menge.has(m)) {
      schnitt += g
      gemeinsam.push(m)
    } else verein += g
  }
  return { schnitt, verein, gemeinsam }
}

function vorschlaegeFuer(titel, alle, kontext) {
  const { listen, w } = kontext
  const eigene = { menge: new Set(listen.get(titel)), gewicht: 0 }
  for (const m of eigene.menge) eigene.gewicht += w.get(m) ?? 0
  const wurzel = titel.franchiseId ?? titel.id
  const besteJeReihe = new Map()
  for (const b of alle) {
    const reihe = b.franchiseId ?? b.id
    if (reihe === wurzel) continue
    const { schnitt, verein, gemeinsam } = vergleiche(eigene, listen.get(b), w)
    if (!schnitt || !verein || schnitt / verein < MINDESTANTEIL) continue
    const neu = { titel: b, anteil: schnitt / verein, gemeinsam }
    const bisher = besteJeReihe.get(reihe)
    if (!bisher || rang(bisher) < rang(neu)) besteJeReihe.set(reihe, neu)
  }
  return [...besteJeReihe.values()].sort((a, b) => rang(b) - rang(a)).slice(0, ANZAHL)
}

/** Zeile fürs Panel: [Kennung, Name, Cover, gemeinsame Merkmale, Ecchi]. */
function zeile(v, ak, w) {
  const gemeinsam = v.gemeinsam.sort((x, y) => (w.get(y) ?? 0) - (w.get(x) ?? 0)).slice(0, GEMEINSAM_MAX)
  return [ak, anzeigeName(v.titel), vorschauCover(v.titel.coverImage), gemeinsam, v.titel.genres?.includes('Ecchi') ? 1 : 0]
}

/** Map AniList-ID → Zeilen; nur Titel mit Kennung (`akVon`) sind Ziel und Quelle eines Vorschlags. */
export function baueAehnliche(titelVoll, akVon) {
  const alle = titelVoll.filter((t) => akVon.has(t.id))
  const listen = new Map(alle.map((t) => [t, merkmale(t)]))
  const w = gewichte([...listen.values()])
  const ergebnis = new Map()
  for (const titel of alle) {
    if (!listen.get(titel).length) continue
    const vorschlaege = vorschlaegeFuer(titel, alle, { listen, w })
    if (vorschlaege.length) ergebnis.set(titel.id, vorschlaege.map((v) => zeile(v, akVon.get(v.titel.id), w)))
  }
  return ergebnis
}
