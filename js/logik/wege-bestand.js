// Bestand eines Anbieters, deutsche Fassung abgeschlossen, Bereiche um Wochenplan und Kanal-Bestand (Hauptseite: folgen-spanne, stream-bereiche, prime-kanal).
import { istErschienen } from './erschienen.js'
import { addiereTage } from './zeit.js'
import { ausNummern, deutsche, folgenVon, hatDeutsch, zusammengefasst } from './dub.js'
import { deutscherWochenplan, japanVorbei, zaehleErschienen } from './antwort-regeln.js'

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

const wochenplanLaeuft = (ctx) => ctx.titel.plaene.some((p) => deutscherWochenplan(p) && laeuftGerade(p, ctx))

// Japans Ende ist nicht das deutsche: abgeschlossen erst, wenn auch kein deutscher Wochentermin mehr läuft.
export const deutschAbgeschlossen = (titel, ctx) => japanVorbei(titel, ctx.heute) && !wochenplanLaeuft(ctx)

export const laufendBei = (titel, platform, ctx) => ((r) => r?.releaseType === 'weekly' && laeuftGerade(r, ctx))(titel.plaene.find((p) => p.platform === platform))

// Die Termine der Wochenpläne eines Anbieters.
const wochenTermine = (titel, plattform) => {
  const wochen = new Set(titel.plaene.filter((p) => p.platform === plattform && p.releaseType === 'weekly').map((p) => p.slug))
  return titel.termine.filter((e) => wochen.has(e.releaseSlug))
}

function wegMitTermin(weg, { titel, jetzt }) {
  if (!hatDeutsch(weg.dubRanges)) return weg
  const gedeckt = folgenVon(weg.dubRanges)
  const erschienen = wochenTermine(titel, weg.platform).filter((e) => typeof e.episode === 'number' && istErschienen(e, jetzt)).map((e) => e.episode)
  const neu = [...new Set(erschienen.filter((n) => !gedeckt.has(n)))].sort((a, b) => a - b)
  return neu.length ? { ...weg, dubRanges: zusammengefasst([...weg.dubRanges, ...ausNummern(neu)], (a, b) => a.dub === b.dub), ergaenzteFolgen: neu } : weg
}

const KANAL = { crunchyroll: 'crunchyroll', adn: 'adn' }

// Der Weg des Anbieters, dessen deutsches Ja ein Prime-Kanal erbt ("Prime Video über Crunchyroll").
const kanalQuelle = (s, streams) => (s.platform === 'primevideo' && s.dub === true ? streams.find((q) => q.platform === KANAL[(s.kanal ?? '').toLowerCase()] && q.dub === true) : undefined)

/** Ein Prime-Kanal-Weg ohne eigene Bereiche zählt wie der Anbieter, dessen Bestand er führt. */
export const zaehlPlattform = (s, streams) => (hatDeutsch(s.dubRanges) ? undefined : kanalQuelle(s, streams))?.platform ?? s.platform

function vereinigeDeutsch(eigene, quelle) {
  const deutsch = zusammengefasst(deutsche([...eigene, ...quelle]))
  const ohneTon = quelle.filter((x) => !x.dub && !deutsch.some((d) => d.from <= x.to && x.from <= d.to))
  return [...deutsch, ...ohneTon].sort((a, c) => a.from - c.from)
}

function quelleBereiche(quelle, { titel, jetzt }) {
  if (hatDeutsch(quelle.dubRanges)) return quelle.dubRanges
  const erschienen = zaehleErschienen(wochenTermine(titel, quelle.platform), jetzt)
  return erschienen ? [{ from: 1, to: erschienen, dub: true }] : []
}

function mitKanalBestand(streams, ctx) {
  return streams.map((s) => {
    const quelle = kanalQuelle(s, streams)
    if (!quelle || !s.dubRanges?.length) return s
    const vom = quelleBereiche(quelle, ctx)
    const gemeinsam = vereinigeDeutsch(s.dubRanges, vom)
    const wieAnbieter = !hatDeutsch(quelle.dubRanges) && (!vom.length || JSON.stringify(gemeinsam) === JSON.stringify(vom))
    return { ...s, dubRanges: wieAnbieter ? undefined : gemeinsam }
  })
}

/** Der Titel mit Wegen, deren Bereiche um den Wochenplan und den Bestand des Kanal-Anbieters ergänzt sind. */
export function titelMitTerminBereichen(titel, jetzt) {
  if (!titel.streams.length) return titel
  const ctx = { titel, jetzt }
  const mitTermin = titel.plaene.some((p) => p.releaseType === 'weekly') ? titel.streams.map((s) => wegMitTermin(s, ctx)) : titel.streams
  return { ...titel, streams: mitKanalBestand(mitTermin, ctx) }
}
