// Was die Antwort zuerst wissen muss: welche Termine, wie viele Folgen erschienen und wie viele es sind.
// Portiert aus web/src/components/detail/antwort-berechnen.ts der Hauptseite (Abweichungen: siehe antwort.js).
import { imKinoBanner } from './film-termine.js'
import { istErschienen } from './erschienen.js'
import { hatDeutsch } from './dub.js'
import { angekuendigteLaenge, belegteBereiche, deutschBegonnen, hatDubWeg, japanVorbei, ohneSchonErschienene, zaehleErschienenJeAnbieter } from './antwort-regeln.js'

const nachDatum = (a, b) => a.date.localeCompare(b.date) || (a.episode ?? 0) - (b.episode ?? 0)

export const hatSynchroBeleg = (titel) =>
  hatDubWeg(titel) || Boolean(titel.hasVoices) || Boolean(titel.deErstausgabe?.synchro) || titel.kaufwege.some((w) => hatDeutsch(belegteBereiche(w)))

function kopfPlaene(titel, { heute, hatSynchro }) {
  const kino = (p) => imKinoBanner(p, heute)
  const ohneDisc = titel.plaene.filter((p) => p.releaseType !== 'disc' && !kino(p) && !(hatSynchro && p.platform === 'tv' && p.automatisch))
  if (ohneDisc.length) return { ohneDisc, kopf: ohneDisc }
  const ohneKino = titel.plaene.filter((p) => !kino(p))
  if (!hatSynchro) return { ohneDisc, kopf: ohneKino }
  if (titel.format === 'MOVIE' || deutschBegonnen(titel, { erschienene: 0, heute, plaene: titel.plaene })) return { ohneDisc, kopf: [] }
  return { ohneDisc, kopf: ohneKino.filter((p) => p.releaseType === 'disc') }
}

function gesamtZahl(titel, { kopf, alle }) {
  const nurWochen = kopf.every((p) => p.releaseType === 'weekly' && !p.tvLetzteSichtung)
  const teile = kopf
    .filter((p) => p.episodeCount && !p.episodeCountAssumed)
    .map((p) => ({ von: p.firstEpisodeNumber ?? 1, bis: (p.firstEpisodeNumber ?? 1) + p.episodeCount - 1 }))
    .sort((x, y) => x.von - y.von)
  const aneinander = teile.length > 1 && teile[0].von === 1 && teile.every((t, i) => i === 0 || t.von === teile[i - 1].bis + 1)
  const ausReleases = aneinander ? teile.at(-1).bis : 0
  return Math.max(titel.episodes ?? 0, ausReleases, angekuendigteLaenge(titel, kopf)) || (nurWochen && alle.length > 1 ? alle.length : undefined)
}

export function antwortKontext(titel, uhr) {
  const { heute, jetzt } = uhr
  const hatSynchro = hatSynchroBeleg(titel)
  const { ohneDisc, kopf } = kopfPlaene(titel, { heute, hatSynchro })
  const slugs = new Set(kopf.map((p) => p.slug))
  const alle = titel.termine.filter((e) => slugs.has(e.releaseSlug))
  const offen = alle.filter((e) => !istErschienen(e, jetzt))
  const kuenftig = ohneSchonErschienene(offen, alle, jetzt).sort(nachDatum)
  const plaene = titel.plaene
  const raus = zaehleErschienenJeAnbieter(alle, jetzt)
  return { titel, heute, jetzt, hatSynchro, ohneDisc, kopf, alle, kuenftig, plaene, raus, gesamt: gesamtZahl(titel, { kopf, alle }), abgeschlossen: japanVorbei(titel, heute) }
}
