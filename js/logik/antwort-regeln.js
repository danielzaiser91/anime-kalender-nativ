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

// Dieselbe Folge liegt bei mehreren Anbietern: jeder zählt für sich, der Kasten nimmt den weitesten.
export function zaehleErschienenJeAnbieter(events, jetzt) {
  return Math.max(0, ...[...Map.groupBy(events, (e) => e.platform).values()].map((liste) => zaehleErschienen(liste, jetzt)))
}

const anzeigeFolge = (e) => Boolean(e.episode) && !e.sichtung

export function ohneSchonErschienene(offen, alle, jetzt) {
  const da = new Set(alle.filter((e) => anzeigeFolge(e) && istErschienen(e, jetzt)).map((e) => e.episode))
  return offen.filter((e) => !anzeigeFolge(e) || !da.has(e.episode))
}

export function deutscherWochentaktLaeuft(events, jetzt) {
  const wochen = events.filter((e) => e.releaseType === 'weekly' && e.platform !== 'tv' && e.platform !== 'disc')
  return [...Map.groupBy(wochen, (e) => e.releaseSlug).values()].some((liste) => liste.some((e) => istErschienen(e, jetzt)) && liste.some((e) => !istErschienen(e, jetzt)))
}

export const istBelegtAbgeschlossen = ({ hatSynchro, vollstaendig, abgeschlossen }, events, jetzt) => hatSynchro && vollstaendig && abgeschlossen && !deutscherWochentaktLaeuft(events, jetzt)

const ersteDiscNochOffen = (plaene, heute) => {
  const discs = plaene.filter((p) => p.platform === 'disc')
  return discs.every((p) => (p.firstEpisodeDate ?? '') > heute) && discs.some((p) => /\bVol\.?\s*1\b/.test(p.name ?? ''))
}

function erstausgabeVorDisc(titel, plaene, heute) {
  if (titel.streams.some((s) => s.dub === true)) return false
  return !plaene.some((p) => p.platform !== 'disc' && (p.firstEpisodeDate ?? '9') <= heute) && ersteDiscNochOffen(plaene, heute)
}

export function deutschBegonnen(titel, { erschienene, heute, plaene }) {
  if (titel.streams.some((s) => s.dub === true) || erschienene > 0) return true
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
  return [...Map.groupBy(katalog, (e) => e.releaseSlug).values()].some((liste) => liste.every((e) => e.date === heute) && (ganzerTitelHeute || !fortsetzung.has(liste[0].releaseSlug)))
}

export function fertigAntwort(zahlen, events, wann) {
  const wochenplan = events.some((e) => e.releaseType === 'weekly' && e.platform !== 'tv' && e.platform !== 'disc')
  const belegt = Boolean(zahlen.gesamt && zahlen.belegteFolgen >= zahlen.gesamt) || wochenplan
  return { art: 'fertig', raus: zahlen.raus, gesamt: zahlen.gesamt, gesamtAbgeleitet: !belegt, heuteOffen: katalogstartHeuteOffen(events, wann.heute, wann.plaene) || undefined }
}
