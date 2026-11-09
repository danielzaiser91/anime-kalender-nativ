// Die Antwort auf "gibt es das auf Deutsch, und wo steht es?": art = laeuft | fertig | teilweise | film | disc | ohne.
// Portiert aus web/src/components/detail/antwort-berechnen.ts. Nicht übernommen: Kinofilm ohne deutsche Fassung (art kino, Daten fehlen),
// widerlegte Termine, die einzelnen Bände einer Disc, ausgebliebene Folgen und die Takt-Prüfung ("Takt unklar").
import { antwortKontext } from './antwort-kontext.js'
import { dubAbdeckung, folgenVon } from './dub.js'
import { belegteBereiche, fertigAntwort, gesamtGeschaetzt, gesamtIstBelegt, istBelegtAbgeschlossen, deutschBegonnen } from './antwort-regeln.js'
import { filmTermine, imKinoBanner } from './film-termine.js'

// Die letzte Folge des Blocks, der mit `n` am selben Tag erscheint (nur belegte Termine, lückenlos ab `n`); wie shared/folgenblock.ts.
function folgenblockBis(derselben, n) {
  if (n.episode == null || n.estimated || n.sichtung || n.releaseType !== 'weekly') return undefined
  const amTag = derselben.filter((e) => e.date === n.date && !e.estimated && !e.sichtung)
  let bis = n.episode
  while (amTag.some((e) => e.episode === bis + 1)) bis++
  return bis > n.episode ? bis : undefined
}

function belegende({ titel, abgeschlossen }) {
  const mitUrteil = titel.streams.filter((s) => s.dub === true)
  return mitUrteil.some((s) => s.dubRanges?.length) && !abgeschlossen ? mitUrteil.filter((s) => s.dubRanges?.length) : mitUrteil
}

function deckung(k) {
  const { titel, gesamt } = k
  const belegen = belegende(k)
  const kauf = titel.kaufwege.filter((w) => belegteBereiche(w).some((r) => r.dub))
  const abdeckung = [...belegen.map((s) => dubAbdeckung(s.dubRanges, gesamt)), ...kauf.map((w) => dubAbdeckung(belegteBereiche(w), gesamt))]
  if (!abdeckung.length && k.hatSynchro) abdeckung.push(dubAbdeckung(undefined, gesamt))
  const vereint = folgenVon([...belegen.flatMap((s) => s.dubRanges ?? []), ...kauf.flatMap(belegteBereiche)].filter((r) => r.dub), gesamt)
  const teilOhneZahl = Boolean(titel.deErstausgabe?.teil) && vereint.size === 0 && !belegen.some((s) => s.dub === true)
  const vollstaendig = !teilOhneZahl && (abdeckung.some((a) => a.vollstaendig) || Boolean(gesamt && vereint.size >= gesamt))
  return { vereint: vereint.size, teilOhneZahl, vollstaendig, belegteFolgen: Math.max(0, vereint.size, ...abdeckung.map((a) => a.belegt)), restBelegt: restBelegt(belegen, gesamt) }
}

function restBelegt(wege, gesamt) {
  return wege.some((s) => {
    const bereiche = s.dubRanges ?? []
    if (!gesamt || !bereiche.some((b) => !b.dub)) return false
    return folgenVon(bereiche, gesamt).size >= gesamt
  })
}

function laeuft(k) {
  const n = k.kuenftig[0]
  const plan = k.plaene.find((p) => p.slug === n.releaseSlug)
  const derselben = k.kuenftig.filter((e) => e.releaseSlug === n.releaseSlug)
  return {
    art: 'laeuft',
    haupt: n,
    rest: derselben.length,
    letzter: derselben.at(-1)?.date,
    blockBis: folgenblockBis(derselben, n),
    raus: k.raus,
    gesamt: k.gesamt,
    gesamtGeschaetzt: gesamtGeschaetzt(k.titel, plan),
    sendetage: plan?.wochentage,
    komplett: plan?.releaseType !== 'weekly',
    sichtung: n.sichtung,
    offenesEnde: Boolean(plan?.tvLetzteSichtung),
  }
}

const zahlen = (k) => ({ raus: k.raus || k.gesamt, gesamt: k.gesamt })

function mitKuenftigem(k, d) {
  const { titel, heute, jetzt } = k
  const begonnen = k.hatSynchro && deutschBegonnen(titel, { erschienene: k.raus, heute, plaene: k.plaene })
  if (istBelegtAbgeschlossen({ hatSynchro: begonnen, vollstaendig: d.vollstaendig, abgeschlossen: k.abgeschlossen }, k.alle, jetzt)) {
    return fertigAntwort({ ...zahlen(k), belegteFolgen: d.vereint }, k.alle, { heute, plaene: k.plaene })
  }
  if (!k.ohneDisc.length) return { art: 'disc', datum: k.kuenftig[0].date }
  const plan = k.plaene.find((p) => p.slug === k.kuenftig[0].releaseSlug)
  const filmDe = titel.format === 'MOVIE' || plan?.releaseType === 'movie' ? filmTermine(titel, heute) : null
  return filmDe ?? laeuft(k)
}

function film(k) {
  const { titel, heute } = k
  const deTermine = titel.streams.some((s) => s.dub === true) ? null : filmTermine(titel, heute)
  if (deTermine) return deTermine
  const imKino = k.plaene.some((p) => imKinoBanner(p, heute))
  const ohneWeg = !titel.streams.length && !titel.kaufwege.length && !imKino && !k.plaene.some((p) => p.releaseType === 'disc')
  return { art: 'film', hatSynchro: k.hatSynchro, raus: k.raus, gesamt: k.gesamt, ohneWeg, imKino }
}

function ohneKuenftiges(k, d) {
  const { titel, heute } = k
  if (titel.format === 'MOVIE') return film(k)
  if (k.hatSynchro && !d.vollstaendig && k.gesamt) {
    return { art: 'teilweise', raus: d.teilOhneZahl ? undefined : d.belegteFolgen, gesamt: k.gesamt, gesamtBelegt: gesamtIstBelegt(titel, k.kopf, k.gesamt), restBelegt: d.restBelegt }
  }
  if (k.hatSynchro || istErschienenOhneTermin(titel, k.plaene, heute)) return fertigAntwort({ ...zahlen(k), belegteFolgen: d.vereint }, k.alle, { heute, plaene: k.plaene })
  return { art: 'ohne', gesamt: k.gesamt }
}

const EIN_JAHR_TAGE = 365

function istErschienenOhneTermin(titel, plaene, heute) {
  if (plaene.some((p) => p.firstEpisodeDate)) return false
  const ende = titel.jpEnd ?? (titel.jpYear ? `${titel.jpYear}-12-31` : undefined)
  const grenze = new Date(Date.parse(`${heute}T00:00:00Z`) - EIN_JAHR_TAGE * 86400000).toISOString().slice(0, 10)
  return Boolean(ende && !(titel.einzelquelle ?? titel.dubConfidence === 'low') && ende < grenze)
}

export function berechneAntwort(titel, uhr) {
  const k = antwortKontext(titel, uhr)
  const d = deckung(k)
  return k.kuenftig.length ? mitKuenftigem(k, d) : ohneKuenftiges(k, d)
}
