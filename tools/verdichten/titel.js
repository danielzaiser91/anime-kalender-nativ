// Titelbausteine fürs Panel: je Gruppe eine Datei mit allem, was Antwort, Wege, Termine und Eckdaten brauchen. Werte bleiben unverändert.
import { anzeigeName, gruppeVonAk } from '../../js/logik/titel.js'
import { kuerzeTermin } from './wochen.js'

export const TITEL_SCHEMA = 1

const WEG = ['platform', 'url', 'zugang', 'dub', 'dubRanges', 'dubAbgeleitet', 'kanal', 'dubQuelle', 'dubStand', 'dubHintOnly', 'fenster', 'seite']
const KAUFWEG = ['name', 'url', 'kind', 'zugang', 'dubRanges', 'dubAbgeleitet', 'ueberTmdb']
const PLAN = ['slug', 'name', 'publisher', 'sprache', 'platform', 'releaseType', 'automatisch', 'tvLetzteSichtung', 'sender']
const SCHEDULE = ['firstEpisodeDate', 'lastEpisodeDate', 'episodeCount', 'episodeCountAssumed', 'episodeCountNurGesichtet', 'firstEpisodeNumber', 'wochentage']
const ECKDATEN = ['format', 'episodes', 'jpYear', 'jpSeason', 'jpStart', 'jpStatus', 'jpEnd', 'fsk', 'runtimeMin', 'genres', 'studios', 'hasVoices', 'deErstausgabe', 'dubConfidence', 'einzelquelle', 'ankuendigung']

const nur = (quelle, felder) => Object.fromEntries(felder.filter((f) => quelle?.[f] !== undefined).map((f) => [f, quelle[f]]))

// TMDB liefert feste Breiten: Poster 342 und Banner 780 reichen für die Bühne.
const bild = (url, von, nach) => (typeof url === 'string' && url.startsWith('https://') ? url.replace(von, nach) : null)

// Adressen kommen als Link ins Panel: nur http(s), sonst entfällt das Feld (kein javascript: aus den Daten).
const ADRESSFELDER = ['url', 'seite']
const mitSicherenAdressen = (weg) => Object.fromEntries(Object.entries(weg).filter(([f, v]) => !ADRESSFELDER.includes(f) || v === '' || /^https?:\/\//.test(v)))

const plan = (release) => ({ ...nur(release, PLAN), ...nur(release.schedule, SCHEDULE) })

function baustein(titel, ak, { termine, plaene, merkmal }) {
  return {
    id: titel.id,
    ak,
    name: anzeigeName(titel),
    cover: bild(titel.coverImage, '/t/p/w500/', '/t/p/w342/'),
    banner: bild(titel.bannerImage, '/t/p/w1280/', '/t/p/w780/'),
    ...nur(titel, ECKDATEN),
    streams: (titel.streams ?? []).map((s) => mitSicherenAdressen(nur(s, WEG))),
    kaufwege: (titel.watchLinks ?? []).map((w) => mitSicherenAdressen(nur(w, KAUFWEG))),
    termine: termine.map((e) => ({ releaseSlug: e.releaseSlug, ...kuerzeTermin(e) })),
    plaene: plaene.map(plan),
    ...merkmal,
  }
}

/** Alle Titel von `titles.json`, nach Gruppe der Kennung geteilt: Map Gruppe → Dateiinhalt. */
export function baueTitelGruppen({ titelVoll, events, releases, kennungen }, merkmale) {
  const ak = new Map(kennungen.titel.map((z) => [z[1], z[3] ?? z[0]]))
  const termine = Map.groupBy(events, (e) => e.titleId)
  const plaene = Map.groupBy(releases, (r) => r.titleId)
  const gruppen = new Map()
  for (const titel of titelVoll) {
    const kennung = ak.get(titel.id)
    if (!kennung) continue
    const gruppe = gruppeVonAk(kennung)
    const datei = gruppen.get(gruppe) ?? { schema: TITEL_SCHEMA, gruppe, titel: {} }
    datei.titel[kennung] = baustein(titel, kennung, { termine: termine.get(titel.id) ?? [], plaene: plaene.get(titel.id) ?? [], merkmal: merkmale.get(titel.id) })
    gruppen.set(gruppe, datei)
  }
  return gruppen
}
