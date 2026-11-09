// Die Folgenangabe an der Pille eines Wegs ("Fg. 1–36", "≈ Fg. 1–6", "nur Fg. 1"). Regeln aus web/src/components/detail/folgen-angabe.ts der Hauptseite.
// Nicht übernommen: der Prime-Kanal übernimmt nicht den Bestand seines Anbieters.
import { bereicheGekuerzt, bereicheKurz, dubBild, dubGrenze, dubLuecken, zusammengefasst } from './dub.js'
import { istErschienen } from './erschienen.js'
import { joynAngabe } from './joyn.js'
import { deutschAbgeschlossen, erschieneneSpanne, laeuftGerade } from './wege-bestand.js'
import { zaehleErschienen } from './antwort-regeln.js'
import { datumKurz } from './wochentext.js'

const ungefaehr = (text, geschaetzt) => (geschaetzt ? `≈ ${text}` : text)

function gemischt(bild) {
  const { text, rest } = bereicheGekuerzt(bild.deutsch)
  return rest ? `Fg. ${text} +${rest} Bereiche` : `Fg. ${text}`
}

function ausLueckeOderGrenze(bereiche) {
  const luecken = dubLuecken(bereiche)
  if (luecken) return `ohne Deutsch: Fg. ${luecken}`
  const grenze = dubGrenze(bereiche)
  const ersteDeutsche = Math.min(...bereiche.filter((r) => r.dub).map((r) => r.from))
  if (!grenze || (grenze.art === 'bis' && ersteDeutsche > 1)) return ''
  return grenze.art === 'bis' ? `Fg. 1–${grenze.n}` : `Fg. ab ${grenze.n}`
}

const einzelneFolge = (weg) => /youtube\.com\/watch\?/.test(weg.url ?? '') && !/[?&]list=/.test(weg.url ?? '')

function ausWochenplan(plaene, ctx) {
  const slugs = new Set(plaene.map((p) => p.slug))
  const events = ctx.titel.termine.filter((e) => slugs.has(e.releaseSlug))
  const bereich = erschieneneSpanne(events, ctx.jetzt)
  const raus = zaehleErschienen(events, ctx.jetzt)
  const text = bereich ? `Fg. ${bereich}` : raus ? `${raus} Fg.` : ''
  return text && ungefaehr(text, events.some((e) => istErschienen(e, ctx.jetzt) && e.estimated))
}

const ergaenzungGeschaetzt = (events, ergaenzt, jetzt) => events.some((e) => istErschienen(e, jetzt) && e.estimated && e.episode != null && (ergaenzt ?? []).includes(e.episode))

function ausPlan(weg, anbieterPlaene, ctx) {
  const release = ctx.titel.plaene.find((p) => p.platform === weg.platform)
  if (release?.tvLetzteSichtung && release.platform !== 'tv' && laeuftGerade(release, ctx)) return `neue Folge ${datumKurz(release.tvLetzteSichtung)}`
  const wochenlauf = release?.releaseType === 'weekly' && laeuftGerade(release, ctx)
  const mehrere = anbieterPlaene.length > 1 && anbieterPlaene.some((p) => p.releaseType === 'weekly')
  return wochenlauf || mehrere ? ausWochenplan(anbieterPlaene, ctx) : undefined
}

function abgeleitet(weg, ctx) {
  if (weg.dub !== true) return ''
  return deutschAbgeschlossen(ctx.titel, ctx) && ctx.titel.episodes ? `≈ ${ctx.titel.episodes} Fg.` : ''
}

export function folgenAngabe(weg, ctx) {
  const { titel } = ctx
  if (weg.platform === 'joyn') return joynAngabe(weg.fenster, ctx.jetzt) ?? ''
  const anbieterPlaene = titel.plaene.filter((p) => p.platform === weg.platform)
  const folgenLautReleases = Math.max(0, ...anbieterPlaene.map((p) => (p.firstEpisodeNumber ?? 1) - 1 + (p.episodeCount ?? 1)))
  if (titel.format === 'MOVIE' || (titel.episodes === 1 && folgenLautReleases <= 1)) return ''
  const deutsch = (weg.dubRanges ?? []).filter((r) => r.dub)
  if (einzelneFolge(weg) && deutsch.length === 1 && deutsch[0].from === 1 && deutsch[0].to === 1) return 'nur Fg. 1'
  const bild = dubBild(weg.dubRanges, titel.episodes)
  if (bild?.ohneTon.length && bild.deutsch.length) return gemischt(bild)
  const rand = deutsch.length ? ausLueckeOderGrenze(weg.dubRanges) : ''
  if (rand) return rand
  const plan = ausPlan(weg, anbieterPlaene, ctx)
  if (plan !== undefined) return plan
  if (deutsch.length) {
    const events = titel.termine.filter((e) => anbieterPlaene.some((p) => p.slug === e.releaseSlug))
    return ungefaehr(`Fg. ${bereicheKurz(zusammengefasst(deutsch))}`, ergaenzungGeschaetzt(events, weg.ergaenzteFolgen, ctx.jetzt))
  }
  return abgeleitet(weg, ctx)
}
