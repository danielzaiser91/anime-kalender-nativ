// Abgeleitete Felder des Katalogs, nachgebaut aus der Hauptseite (shared/logic.ts, shared/kostenlos.ts, web/src/lib/herkunft.ts).
// Status und "kostenlos" gelten zum Datenstand (heute bzw. jetzt der Veröffentlichung).
import { addiereTage } from '../../js/logik/zeit.js'

const ANISEARCH_AB = 10_000_000
const EIGENE_AB = 5_000_000
const EIGENE_BIS = 6_000_000
const ERSCHIENEN_ABSTAND_TAGE = 365
const EIN_VIDEO = /youtube\.com\/watch\?/

export function herkunft(titel) {
  if (['JP', 'KR', 'CN', 'TW'].includes(titel.land)) return titel.land
  if (titel.land) return 'US'
  const anilist = titel.al ?? titel.id
  return anilist >= ANISEARCH_AB || anilist < 0 || (anilist >= EIGENE_AB && anilist < EIGENE_BIS) ? 'XX' : 'JP'
}

/** Letztes Folgendatum je Termin-Plan: ohne eigenes Datum bei Wochenserien das letzte Ereignis des Plans (Hauptseite: Sendeplan-Rechnung). */
const letztesDatum = (plan, letzteTermine) => {
  const s = plan.schedule
  if (s.lastEpisodeDate) return s.lastEpisodeDate
  if (plan.releaseType !== 'weekly') return s.firstEpisodeDate
  return s.episodeCount >= 1 ? letzteTermine.get(plan.slug) : undefined
}

function planStatus(plan, heute, letzteTermine) {
  const s = plan.schedule
  if (!s?.firstEpisodeDate || plan.widerlegt) return 'unbekannt'
  if (s.firstEpisodeDate > heute) return 'tba'
  if (plan.tvLetzteSichtung && plan.tvLetzteSichtung >= addiereTage(heute, -7)) return 'airing'
  const letzte = letztesDatum(plan, letzteTermine)
  return letzte && letzte < heute ? 'abgeschlossen' : 'airing'
}

/** Status eines Titels über alle seine Pläne; ohne Plan zählt das japanische Ende oder ein belegter deutscher Weg. */
export function titelStatus(titel, plaene, { heute, letzteTermine }) {
  const alle = plaene.map((plan) => planStatus(plan, heute, letzteTermine))
  for (const status of ['airing', 'tba', 'abgeschlossen']) if (alle.includes(status)) return status
  const nurWiderlegt = plaene.length > 0 && plaene.every((plan) => plan.widerlegt)
  if (!nurWiderlegt && (titel.streams ?? []).some((weg) => weg.dub === true)) return 'erschienen'
  const ende = titel.jpEnd ?? (titel.jpYear ? `${titel.jpYear}-12-31` : undefined)
  const einzeln = titel.einzelquelle ?? titel.dubConfidence === 'low'
  return ende && !einzeln && ende < addiereTage(heute, -ERSCHIENEN_ABSTAND_TAGE) ? 'erschienen' : 'unbekannt'
}

/** Folgen eines kostenlosen Wegs: Liste der Nummern, 'eine' (Nummer unbekannt), undefined (nicht bekannt). */
function folgen(weg, jetzt) {
  if (weg.toggo) return weg.toggo.filter((b) => b.ab <= jetzt && jetzt < b.ende).flatMap((b) => Array.from({ length: b.bis - b.von + 1 }, (_, i) => b.von + i))
  if (weg.toggoOffen) return weg.toggoOffen.some(([ab, ende]) => ab <= jetzt && jetzt < ende) ? 'eine' : []
  if (weg.nurFolge != null) return [weg.nurFolge]
  const deutsch = (weg.dubRanges ?? []).filter((r) => r.dub)
  if (deutsch.length) return deutsch.flatMap((r) => Array.from({ length: r.to - r.from + 1 }, (_, i) => r.from + i))
  return EIN_VIDEO.test(weg.url ?? '') && !/[?&]list=/.test(weg.url) ? 'eine' : undefined
}

/** Hat der Titel kostenlose deutsche Folgen (oder wissen wir es nur nicht genau)? */
export function hatKostenlos(titel, jetzt) {
  const wege = [...(titel.watchLinks ?? []).filter((w) => w.kind === 'stream' && w.zugang === 'kostenlos'), ...(titel.streams ?? []).filter((s) => s.zugang === 'kostenlos' && s.dub !== false)]
  const nummern = new Set()
  let ohneNummer = 0
  let unbekannt = false
  for (const weg of wege) {
    const f = folgen(weg, jetzt)
    if (f === undefined) unbekannt = true
    else if (f === 'eine') ohneNummer++
    else f.forEach((n) => nummern.add(n))
  }
  return nummern.size + ohneNummer > 0 || unbekannt
}

/** "Streambar": ein Stream ist bekannt, ein Kaufweg vom Typ Stream oder ein Plan bei einem Anbieter außer Disc und Kino. */
export const istStreambar = (titel, plaene) =>
  (titel.streams ?? []).length > 0 || (titel.watchLinks ?? []).some((w) => w.kind === 'stream') || plaene.some((p) => p.platform !== 'disc' && p.platform !== 'kino')
