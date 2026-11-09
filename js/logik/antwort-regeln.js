// Teilregeln der Antwort (Hauptseite: antwort-regeln.ts); Termine sind ausgerechnet, Pläne die Kurzfassung der Releases.
import { istErschienen, katalogstartOhneUhrzeit } from './erschienen.js'

export function zaehleErschienen(events, jetzt) {
  const nummern = new Set()
  let ohneNummer = 0
  for (const e of events.filter((x) => istErschienen(x, jetzt))) {
    if (e.episode != null) nummern.add(e.episode)
    else ohneNummer += e.episodeCount ?? 1
  }
  return nummern.size + ohneNummer
}

const gruppen = (liste, schluessel) => [...Map.groupBy(liste, schluessel).values()]

export const hatDubWeg = (titel) => titel.streams.some((s) => s.dub === true)

/** Ein deutscher Wochenplan: Plan oder Termin, weder TV noch Disc. */
export const deutscherWochenplan = (p) => p.releaseType === 'weekly' && p.platform !== 'tv' && p.platform !== 'disc'

/** Japans Ende liegt vor heute (ohne Datum: das Jahr davor). */
export const japanVorbei = (titel, heute) => (titel.jpEnd ? titel.jpEnd < heute : Boolean(titel.jpYear && titel.jpYear < Number(heute.slice(0, 4))))

// Dieselbe Folge liegt bei mehreren Anbietern: jeder zählt für sich, der Kasten nimmt den weitesten.
export function zaehleErschienenJeAnbieter(events, jetzt) {
  return Math.max(0, ...gruppen(events, (e) => e.platform).map((liste) => zaehleErschienen(liste, jetzt)))
}

const anzeigeFolge = (e) => Boolean(e.episode) && !e.sichtung

export function ohneSchonErschienene(offen, alle, jetzt) {
  const da = new Set(alle.filter((e) => anzeigeFolge(e) && istErschienen(e, jetzt)).map((e) => e.episode))
  return offen.filter((e) => !anzeigeFolge(e) || !da.has(e.episode))
}

function deutscherWochentaktLaeuft(events, jetzt) {
  const raus = (e) => istErschienen(e, jetzt)
  return gruppen(events.filter(deutscherWochenplan), (e) => e.releaseSlug).some((liste) => liste.some(raus) && !liste.every(raus))
}

export const istBelegtAbgeschlossen = ({ hatSynchro, vollstaendig, abgeschlossen }, events, jetzt) => hatSynchro && vollstaendig && abgeschlossen && !deutscherWochentaktLaeuft(events, jetzt)

const ersteDiscNochOffen = (plaene, heute) => {
  const discs = plaene.filter((p) => p.platform === 'disc')
  return discs.every((p) => (p.firstEpisodeDate ?? '') > heute) && discs.some((p) => /\bVol\.?\s*1\b/.test(p.name ?? ''))
}

function erstausgabeVorDisc(titel, plaene, heute) {
  if (hatDubWeg(titel)) return false
  return !plaene.some((p) => p.platform !== 'disc' && (p.firstEpisodeDate ?? '9') <= heute) && ersteDiscNochOffen(plaene, heute)
}

export function deutschBegonnen(titel, { erschienene, heute, plaene }) {
  if (hatDubWeg(titel) || erschienene > 0) return true
  const von = titel.deErstausgabe?.von
  const tag = Boolean(titel.deErstausgabe?.synchro && von && /^\d{4}-\d{2}-\d{2}$/.test(von) && von <= heute)
  return tag && !erstausgabeVorDisc(titel, plaene, heute)
}

const angenommeneLetzte = (p) => (p?.episodeCountAssumed && p.episodeCount ? (p.firstEpisodeNumber ?? 1) + p.episodeCount - 1 : 0)

export const angekuendigteLaenge = (titel, plaene) => Math.max(0, ...plaene.map(angenommeneLetzte).filter((n) => n > (titel.episodes ?? Infinity)))

export const gesamtGeschaetzt = (titel, plan) => Boolean(plan?.episodeCountAssumed) && (!titel.episodes || angenommeneLetzte(plan) > titel.episodes)

const belegteZahl = (p) => Boolean(p.episodeCount && !p.episodeCountAssumed && !p.episodeCountNurGesichtet)

export const gesamtIstBelegt = (titel, plaene, gesamt) => (titel.episodes ?? 0) >= gesamt || plaene.some(belegteZahl)

export const belegteBereiche = (weg) => (weg.dubAbgeleitet === 'telekom-annahme' ? [] : (weg.dubRanges ?? []))

export function katalogstartHeuteOffen(events, heute, plaene) {
  const fortsetzung = new Set(plaene.filter((p) => (p.firstEpisodeNumber ?? 1) > 1).map((p) => p.slug))
  const katalog = events.filter(katalogstartOhneUhrzeit)
  const ganzerTitelHeute = katalog.length > 0 && katalog.every((e) => e.date === heute)
  return gruppen(katalog, (e) => e.releaseSlug).some((liste) => liste.every((e) => e.date === heute) && (ganzerTitelHeute || !fortsetzung.has(liste[0].releaseSlug)))
}

export function fertigAntwort(zahlen, events, wann) {
  const belegt = Boolean(zahlen.gesamt && zahlen.belegteFolgen >= zahlen.gesamt) || events.some(deutscherWochenplan)
  return { art: 'fertig', raus: zahlen.raus, gesamt: zahlen.gesamt, gesamtAbgeleitet: !belegt, heuteOffen: katalogstartHeuteOffen(events, wann.heute, wann.plaene) || undefined }
}
