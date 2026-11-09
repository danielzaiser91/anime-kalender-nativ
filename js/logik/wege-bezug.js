// Bezugswege (watchLinks): Mediatheken und Kanäle (Stream) und Händler (Kauf). Aus wege-sortieren.ts, weg-doppel.ts und legende-zeilen.ts der Hauptseite.
import { adresseIstOmu, istToggo, seitenKern } from './adresse.js'
import { belegteBereiche } from './antwort-regeln.js'
import { bereicheKurz, zusammengefasst } from './dub.js'

export function bezugStatus(weg, titel) {
  if (weg.dubAbgeleitet === 'telekom-annahme') return 'annahme'
  if (istToggo(weg.url) || weg.dubRanges?.some((r) => r.dub) || titel.streams.find((s) => s.url === weg.url)?.dub) return 'belegt'
  if (weg.dubAbgeleitet) return 'schwester'
  return adresseIstOmu(weg.url) ? 'omu' : 'offen'
}

function folgenText(weg) {
  const bereiche = belegteBereiche(weg).filter((r) => r.dub)
  return bereiche.length ? `Fg. ${bereicheKurz(zusammengefasst(bereiche))}` : ''
}

const zeile = (weg, rest) => ({ name: weg.name, url: weg.url, folgen: folgenText(weg), hinweise: [], ...rest })

function gruppenSchluessel(weg) {
  if (weg.ueberTmdb) return `tmdb|${weg.name}`
  try {
    return new URL(weg.url).hostname.replace(/^www\./, '')
  } catch {
    return weg.url
  }
}

export function bezugZeilen(titel) {
  const eigene = new Set(titel.streams.flatMap((s) => [s.url, s.seite]).filter(Boolean).map(seitenKern))
  const wege = titel.kaufwege.filter((w) => w.kind === 'stream' && !eigene.has(seitenKern(w.url)))
  const erste = new Map()
  for (const w of wege) erste.set(`${w.zugang ?? 'abo'}|${gruppenSchluessel(w)}`, erste.get(`${w.zugang ?? 'abo'}|${gruppenSchluessel(w)}`) ?? w)
  const haendler = titel.kaufwege.filter((w) => w.kind === 'buy').map((w) => zeile(w, { status: '', gruppe: 'kauf' }))
  const stream = wege.map((w) => {
    const status = bezugStatus(erste.get(`${w.zugang ?? 'abo'}|${gruppenSchluessel(w)}`), titel)
    return zeile(w, { status, gruppe: status === 'offen' ? 'offen' : (w.zugang ?? 'abo') })
  })
  return [...stream, ...haendler]
}
