// Folgenangabe an der Pille eines Wegs ("Fg. 1–36", "≈ Fg. 1–6"), nach folgen-angabe.ts.
import { bereicheGekuerzt, bereicheKurz, dubBild, zusammengefasst } from './dub.js'
import { istErschienen } from './erschienen.js'
import { joynAngabe } from './joyn.js'
import { deutschAbgeschlossen, erschieneneSpanne, laeuftGerade, laufendBei, zaehlPlattform } from './wege-bestand.js'
import { zaehleErschienen } from './antwort-regeln.js'
import { datumKurz } from './wochentext.js'

const ungefaehr = (text, geschaetzt) => (geschaetzt ? `≈ ${text}` : text)

const einzelneFolge = (weg) => /youtube\.com\/watch\?/.test(weg.url ?? '') && !/[?&]list=/.test(weg.url ?? '')

function ausWochenplan(plaene, ctx) {
  const slugs = new Set(plaene.map((p) => p.slug))
  const events = ctx.titel.termine.filter((e) => slugs.has(e.releaseSlug))
  const bereich = erschieneneSpanne(events, ctx.jetzt)
  const raus = zaehleErschienen(events, ctx.jetzt)
  const text = bereich ? `Fg. ${bereich}` : raus ? `${raus} Fg.` : ''
  return text && ungefaehr(text, planGeschaetzt(events, ctx))
}

// Ruht eine erschienene Folge nur auf einem fortgeschriebenen Termin, und deckt sie kein belegter Bereich des Wegs?
function planGeschaetzt(events, { weg, jetzt }) {
  const belegt = (n) => n != null && !(weg.ergaenzteFolgen ?? []).includes(n) && (weg.dubRanges ?? []).some((b) => b.dub && n >= b.from && n <= b.to)
  return events.some((e) => istErschienen(e, jetzt) && e.estimated && !belegt(e.episode))
}

const ergaenzungGeschaetzt = (events, ergaenzt, jetzt) => events.some((e) => istErschienen(e, jetzt) && e.estimated && e.episode != null && (ergaenzt ?? []).includes(e.episode))

// Ein laufender Wochenplan oder eine TV-Sichtung des Anbieters geht den Bereichen vor; undefined, wenn keiner zutrifft.
function ausPlan(plattform, anbieterPlaene, ctx) {
  const release = ctx.titel.plaene.find((p) => p.platform === plattform)
  if (release?.tvLetzteSichtung && release.platform !== 'tv' && laeuftGerade(release, ctx)) return `neue Folge ${datumKurz(release.tvLetzteSichtung)}`
  const mehrere = anbieterPlaene.length > 1 && anbieterPlaene.some((p) => p.releaseType === 'weekly')
  return laufendBei(ctx.titel, plattform, ctx) || mehrere ? ausWochenplan(anbieterPlaene, ctx) : undefined
}

function abgeleitet(weg, ctx) {
  if (weg.dub !== true) return ''
  return deutschAbgeschlossen(ctx.titel, ctx) && ctx.titel.episodes ? `≈ ${ctx.titel.episodes} Fg.` : ''
}

// Gemischter Ton nennt die deutschen Folgen (bei drei Bereichen gekürzt), nicht die Lücke.
function gemischt(bild) {
  const { text, rest } = bereicheGekuerzt(bild.deutsch)
  return rest ? `Fg. ${text} +${rest} Bereiche` : `Fg. ${text}`
}

/** `ctx.streams` sind die Wege nach Wochenplan und Kanal-Bestand (wege-bestand.js), `ctx.titel` der Baustein. */
export function folgenAngabe(weg, ctx) {
  const { titel } = ctx
  if (weg.platform === 'joyn') return joynAngabe(weg.fenster, ctx.jetzt) ?? ''
  const plattform = zaehlPlattform(weg, ctx.streams)
  const anbieterPlaene = titel.plaene.filter((p) => p.platform === plattform)
  const folgenLautReleases = Math.max(0, ...anbieterPlaene.map((p) => (p.firstEpisodeNumber ?? 1) - 1 + (p.episodeCount ?? 1)))
  if (titel.format === 'MOVIE' || (titel.episodes === 1 && folgenLautReleases <= 1)) return ''
  const deutsch = (weg.dubRanges ?? []).filter((r) => r.dub)
  if (einzelneFolge(weg) && deutsch.length === 1 && deutsch[0].from === 1 && deutsch[0].to === 1) return 'nur Fg. 1'
  const bild = dubBild(weg.dubRanges, titel.episodes)
  if (bild?.ohneTon.length && bild.deutsch.length) return gemischt(bild)
  const plan = ausPlan(plattform, anbieterPlaene, { ...ctx, weg })
  if (plan !== undefined) return plan
  if (!deutsch.length) return abgeleitet(weg, ctx)
  const events = titel.termine.filter((e) => anbieterPlaene.some((p) => p.slug === e.releaseSlug))
  return ungefaehr(`Fg. ${bereicheKurz(zusammengefasst(deutsch))}`, ergaenzungGeschaetzt(events, weg.ergaenzteFolgen, ctx.jetzt))
}
