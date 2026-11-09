// Wege nach Zugang, je Weg Sprachurteil und Folgenangabe (Hauptseite: wege-sortieren, legende-zeilen, dub-zeilen).
import { anbieterName } from './folge.js'
import { adresseIstOmu } from './adresse.js'
import { bereicheKurz, deutsche, dubBild, hatDeutsch } from './dub.js'
import { deutschAbgeschlossen } from './wege-bestand.js'
import { bezugZeilen } from './wege-bezug.js'
import { folgenAngabe } from './wege-angabe.js'

export const ZUGANG_NAME = { kostenlos: 'Kostenlos', abo: 'Abo', kauf: 'Kauf / Leihe', unbekannt: 'Weitere Anbieter', offen: 'Weitere Anbieter' }
export const STATUS_TEXT = { belegt: '✓ Deutsch', jwDeutsch: '✓ Deutsch', justwatch: 'laut JustWatch', anbieter: 'Deutsch laut Anbieter', annahme: 'Deutsch angenommen', schwester: 'laut Schwester-Shop', omu: 'nur Untertitel', offen: 'Sprache offen' }
const REIHENFOLGE = ['kostenlos', 'abo', 'kauf', 'unbekannt', 'offen']

function nurOmu(weg, titel) {
  if (weg.dub === true || hatDeutsch(weg.dubRanges)) return false
  if (titel.ankuendigung?.platform === weg.platform) return true
  const termine = titel.plaene.filter((p) => p.platform === weg.platform)
  return termine.length > 0 && termine.every((p) => p.sprache === 'omu')
}

export function streamStatus(weg, titel) {
  if (weg.dub === true) return weg.dubAbgeleitet ? 'anbieter' : 'belegt'
  if (weg.dubQuelle === 'justwatch' && weg.dubStand) return weg.dubHintOnly ? 'justwatch' : 'jwDeutsch'
  return nurOmu(weg, titel) || adresseIstOmu(weg.url) ? 'omu' : 'offen'
}

const datumVon = (iso) => iso.split('-').reverse().join('.')

export function wegHinweise(weg, ctx) {
  const bild = dubBild(weg.dubRanges, ctx.titel.episodes)
  const zeilen = []
  if (weg.dubQuelle === 'justwatch' && !weg.dubHintOnly && weg.dubStand) zeilen.push(`Deutsch laut JustWatch (Stand ${datumVon(weg.dubStand)})`)
  if (!bild?.deutsch.length) return zeilen
  const eine = bild.ohneTon.length === 1 && bild.ohneTon[0].from === bild.ohneTon[0].to
  if (bild.ohneTon.length) zeilen.push(`Anbieter führt auch die Episode${eine ? '' : 'n'} ${bereicheKurz(bild.ohneTon)}, allerdings ohne deutsche Synchro.`)
  if (bild.nichtImAngebot.length && deutschAbgeschlossen(ctx.titel, ctx)) zeilen.push(`Nicht im Angebot: ${bereicheKurz(bild.nichtImAngebot)}`)
  return zeilen
}

function streamZeile(weg, ctx) {
  const status = streamStatus(weg, ctx.titel)
  return {
    platform: weg.platform,
    name: `${anbieterName(weg.platform)}${weg.kanal ? ` (${weg.kanal})` : ''}`,
    url: weg.url,
    status,
    folgen: folgenAngabe(weg, ctx),
    hinweise: wegHinweise(weg, ctx),
    gruppe: status === 'offen' || status === 'omu' ? 'offen' : (weg.zugang ?? 'abo'),
  }
}

const signatur = (w) => `${w.platform}|${w.zugang ?? ''}|${w.dub}|${w.dubAbgeleitet ?? ''}|${JSON.stringify(deutsche(w.dubRanges ?? []).map((r) => [r.from, r.to]))}`
const ohneDoppel = (wege) => wege.filter((w, i) => wege.findIndex((x) => signatur(x) === signatur(w)) === i)

/**
 * Die Wege nach Gruppe: Streams (`ctx.streams`, Bereiche um Wochenplan und Kanal-Bestand ergänzt), Bezugswege und Händler.
 * Die Überschrift steht, wo es etwas zu trennen gibt oder wo es Geld kostet. Ohne Sprachbeleg: "Weitere Anbieter".
 */
export function wegGruppen(ctx) {
  const zeilen = [...ohneDoppel(ctx.streams).map((s) => streamZeile(s, ctx)), ...bezugZeilen(ctx.titel)]
  const belegte = REIHENFOLGE.filter((g) => zeilen.some((z) => z.gruppe === g))
  return belegte.map((g) => ({ gruppe: g, name: ZUGANG_NAME[g], zeigeName: belegte.length > 1 || g === 'kauf', zeilen: zeilen.filter((z) => z.gruppe === g) }))
}
