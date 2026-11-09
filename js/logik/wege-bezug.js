// Bezugswege: Mediatheken, Kanäle und Händler (Hauptseite: wege-sortieren, weg-doppel, legende-zeilen).
import { adresseIstOmu, istToggo, seitenKern } from './adresse.js'
import { belegteBereiche } from './antwort-regeln.js'
import { deutsche, folgenText, hatDeutsch } from './dub.js'

export function bezugStatus(weg, titel) {
  if (weg.dubAbgeleitet === 'telekom-annahme') return 'annahme'
  if (istToggo(weg.url) || hatDeutsch(weg.dubRanges) || titel.streams.find((s) => s.url === weg.url)?.dub) return 'belegt'
  if (weg.dubAbgeleitet) return 'schwester'
  return adresseIstOmu(weg.url) ? 'omu' : 'offen'
}

function zeile(weg, rest) {
  const deutsch = deutsche(belegteBereiche(weg))
  return { name: weg.name, url: weg.url, folgen: deutsch.length ? folgenText(deutsch) : '', hinweise: [], ...rest }
}

function gruppenSchluessel(weg) {
  const zugang = weg.zugang ?? 'abo'
  if (weg.ueberTmdb) return `${zugang}|tmdb|${weg.name}`
  try {
    return `${zugang}|${new URL(weg.url).hostname.replace(/^www\./, '')}`
  } catch {
    return `${zugang}|${weg.url}`
  }
}

export function bezugZeilen(titel) {
  const eigene = new Set(titel.streams.flatMap((s) => [s.url, s.seite]).filter(Boolean).map(seitenKern))
  const wege = titel.kaufwege.filter((w) => w.kind === 'stream' && !eigene.has(seitenKern(w.url)))
  const erste = new Map()
  for (const w of wege) erste.set(gruppenSchluessel(w), erste.get(gruppenSchluessel(w)) ?? w)
  const haendler = titel.kaufwege.filter((w) => w.kind === 'buy').map((w) => zeile(w, { status: '', gruppe: 'kauf' }))
  const stream = wege.map((w) => {
    const status = bezugStatus(erste.get(gruppenSchluessel(w)), titel)
    return zeile(w, { status, gruppe: status === 'offen' ? 'offen' : (w.zugang ?? 'abo') })
  })
  return [...stream, ...haendler]
}
