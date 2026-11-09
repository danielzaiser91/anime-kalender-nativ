// Was ein Anbieter schon geliefert hat, ob die deutsche Fassung abgeschlossen ist, und die um den Wochenplan ergänzten Bereiche (folgen-spanne.ts, stream-bereiche.ts der Hauptseite).
import { istErschienen } from './erschienen.js'
import { addiereTage } from './zeit.js'
import { folgenVon } from './dub.js'

const spanne = (von, bis) => (von === bis ? String(von) : `${von}–${bis}`)

export function erschieneneSpanne(events, jetzt) {
  const raus = events.filter((e) => istErschienen(e, jetzt))
  if (!raus.length) return undefined
  const ohneNummer = raus.filter((e) => e.episode == null).reduce((summe, e) => summe + (e.episodeCount ?? 1), 0)
  const nummern = new Set(raus.filter((e) => e.episode != null).map((e) => e.episode))
  if (!nummern.size) return spanne(1, ohneNummer)
  const von = Math.min(...nummern)
  const bis = Math.max(...nummern)
  if (bis - von + 1 !== nummern.size) return undefined
  if (!ohneNummer) return spanne(von, bis)
  return von === ohneNummer + 1 ? spanne(1, bis) : undefined
}

export function laeuftGerade(plan, ctx) {
  if (!plan.firstEpisodeDate || plan.firstEpisodeDate > ctx.heute) return false
  if (plan.tvLetzteSichtung && plan.tvLetzteSichtung >= addiereTage(ctx.heute, -7)) return true
  const letzter = letzterTermin(plan, ctx.titel.termine)
  return !letzter || letzter >= ctx.heute
}

function letzterTermin(plan, termine) {
  if (plan.lastEpisodeDate) return plan.lastEpisodeDate
  if (plan.releaseType !== 'weekly') return plan.firstEpisodeDate
  if (!(plan.episodeCount >= 1)) return undefined
  return termine.filter((e) => e.releaseSlug === plan.slug).map((e) => e.date).sort().at(-1)
}

const wochenplanLaeuft = (ctx) => ctx.titel.plaene.some((p) => p.releaseType === 'weekly' && p.platform !== 'disc' && p.platform !== 'tv' && laeuftGerade(p, ctx))

// Japans Ende ist nicht das deutsche: abgeschlossen erst, wenn auch kein deutscher Wochentermin mehr läuft.
export function deutschAbgeschlossen(titel, ctx) {
  const japan = titel.jpEnd ? titel.jpEnd < ctx.heute : Boolean(titel.jpYear && titel.jpYear < Number(ctx.heute.slice(0, 4)))
  return japan && !wochenplanLaeuft(ctx)
}

export const laufendBei = (titel, platform, ctx) => titel.plaene.some((p) => p.platform === platform && p.releaseType === 'weekly' && laeuftGerade(p, ctx))


export function ergaenzteFolgen(bereiche, plattform, { titel, jetzt }) {
  if (!bereiche?.some((b) => b.dub)) return []
  const wochen = new Set(titel.plaene.filter((p) => p.platform === plattform && p.releaseType === 'weekly').map((p) => p.slug))
  const gedeckt = folgenVon(bereiche)
  const erschienen = titel.termine.filter((e) => wochen.has(e.releaseSlug) && typeof e.episode === 'number' && istErschienen(e, jetzt)).map((e) => e.episode)
  return [...new Set(erschienen.filter((n) => !gedeckt.has(n)))].sort((a, b) => a - b)
}

export function bereicheMitFolgen(bereiche, neu) {
  const dazu = []
  for (const n of neu) {
    const letzter = dazu.at(-1)
    if (letzter?.to === n - 1) letzter.to = n
    else dazu.push({ from: n, to: n, dub: true })
  }
  const raus = []
  for (const b of [...bereiche.map((x) => ({ ...x })), ...dazu].sort((a, c) => a.from - c.from)) {
    const vor = raus.at(-1)
    if (vor && vor.dub === b.dub && vor.to + 1 >= b.from) vor.to = Math.max(vor.to, b.to)
    else raus.push(b)
  }
  return raus
}

function wegMitTermin(weg, ctx) {
  const neu = ergaenzteFolgen(weg.dubRanges, weg.platform, ctx)
  return neu.length && weg.dubRanges ? { ...weg, dubRanges: bereicheMitFolgen(weg.dubRanges, neu), ergaenzteFolgen: neu } : weg
}

export function titelMitTerminBereichen(titel, jetzt) {
  if (!titel.streams.length || !titel.plaene.some((p) => p.releaseType === 'weekly')) return titel
  return { ...titel, streams: titel.streams.map((s) => wegMitTermin(s, { titel, jetzt })) }
}
