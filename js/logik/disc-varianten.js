// Disc-Varianten: Ausgaben nach Art gruppiert (Gesamt, Box, Volume, Film), doppelte Zeilen derselben Ausgabe zusammengelegt (Hauptseite: disc-varianten.ts).
import { FORMATE, kurzeAusgabe } from './disc-ausgaben.js'

export const ARTEN = ['gesamt', 'box', 'vol', 'film', 'sonst']
export const ART_NAMEN = { gesamt: 'Gesamtausgaben', box: 'Boxen', vol: 'Volumes', film: 'Filme', sonst: 'Sonstiges' }
export const FORMAT_NAMEN = { b: 'Blu-ray', d: 'DVD', u: '4K' }

export function artUndNummer(name) {
  if (/^Gesamtausgabe/i.test(name)) return { art: 'gesamt' }
  const treffer = /\b(Box|Vol\.?|Film)\s*0*(\d+)/i.exec(name)
  if (!treffer) return { art: 'sonst' }
  const wort = treffer[1].toLowerCase()
  return { art: wort === 'box' ? 'box' : wort === 'film' ? 'film' : 'vol', nummer: Number(treffer[2]) }
}

const MEDIUM = /\b(?:blu-?ray|dvd|4k(?: uhd)?)\b/gi

/** Die Edition kurz: Medium, „Exklusiv“ und Füllwörter weg, „Sammelschuber“ wird „Schuber“. */
export function editionKurz(roh) {
  let text = roh.replace(MEDIUM, ' ').replace(/\bExklusive?\b/gi, ' ').replace(/Sammelschuber/gi, 'Schuber').replace(/\bmit\b/gi, '+').replace(/\bEdition\b/gi, ' ')
  if (/steelcase/i.test(text)) text = text.replace(/\bLimited\b/gi, ' ')
  text = text.replace(/[,&]/g, ' ').replace(/\s+/g, ' ').replace(/\s\+\s*$/, '').trim()
  return text || (/limited/i.test(roh) ? 'Limited' : /exklusiv/i.test(roh) ? 'Exklusiv' : '')
}

const NUMMER_TEIL = /\b(?:Box|Vol\.?|Film)\s*0*\d+(?:\/\d+)?:?/gi

const rohName = (a) => (a.termin ? a.termin.name : a.name)

function editionRoh(a) {
  const klammer = /\(([^)]*(?:Edition|Digipack|Exklusiv)[^)]*)\)/i.exec(rohName(a))?.[1]
  const quelle = a.termin ? (kurzeAusgabe(a.termin.edition) ?? '') : a.name
  return klammer ?? quelle.replace(NUMMER_TEIL, ' ').replace(/^\s*Gesamtausgabe:?/i, ' ')
}

function kurzName({ art, nummer }, a, titelName) {
  const roh = rohName(a)
  if (/^Gesamtausgabe/i.test(roh)) return 'Gesamt'
  if (nummer !== undefined) return `${art === 'box' ? 'Box' : art === 'film' ? 'Film' : 'Vol.'} ${nummer}`
  const ohneTitel = roh.replace(new RegExp(titelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
  return ohneTitel.replace(/\([^)]*\)/g, '').replace(/^[\s–:-]+|[\s–:-]+$/g, '').trim() || 'Ausgabe'
}

function editionDer(art, a) {
  if (art === 'film') return a.name.replace(/^Film\s*\d+:\s*/i, '')
  if (art === 'sonst') return /\(([^)]*)\)/.exec(a.name)?.[1] ?? ''
  return editionKurz(editionRoh(a))
}

function ausAusgabe(a, { titelName, artikelBasis }) {
  const roh = artUndNummer(rohName(a))
  const art = roh.art === 'sonst' && a.gesamt ? 'gesamt' : roh.art
  const artikel = Object.values(a.artikel)[0]
  return {
    art,
    nummer: roh.nummer,
    name: kurzName({ art, nummer: roh.nummer }, a, titelName),
    edition: editionDer(art, a),
    formate: a.formate,
    datumJe: Object.fromEntries(a.formate.map((f) => [f, a.datum])),
    shop: a.shop ?? null,
    quelle: artikel ? `${artikelBasis}${artikel}` : null,
  }
}

/** Gleiche Art, Nummer und Edition sind eine Variante: Formate, Shop und Quelle werden vereint. */
export function fuegeZusammen(liste) {
  const nachSchluessel = new Map()
  for (const v of liste) {
    const schluessel = `${v.art}|${v.nummer ?? v.name}|${v.edition.toLowerCase()}`
    const da = nachSchluessel.get(schluessel)
    if (!da) {
      nachSchluessel.set(schluessel, { ...v, datumJe: { ...v.datumJe } })
      continue
    }
    da.shop ??= v.shop
    da.quelle ??= v.quelle
    for (const f of v.formate) da.datumJe[f] ??= v.datumJe[f]
    da.formate = FORMATE.filter((f) => da.formate.includes(f) || v.formate.includes(f))
  }
  return [...nachSchluessel.values()]
}

export const spaetestes = (v) => Object.values(v.datumJe).filter(Boolean).sort().pop() ?? ''

/** Neueste zuerst, dann die höhere Nummer, dann der Name. `kontext`: Name des Titels und Adresse der Artikelseite (steht in der Disc-Datei). */
export function variantenVon(ausgaben, kontext) {
  return fuegeZusammen(ausgaben.map((a) => ausAusgabe(a, kontext))).sort((a, b) => spaetestes(b).localeCompare(spaetestes(a)) || (b.nummer ?? 0) - (a.nummer ?? 0) || a.name.localeCompare(b.name))
}

/** Liegt das Datum nach heute? Ein Tag „00“ zählt als der 28. des Monats. */
export const istKommend = (datum, heute) => Boolean(datum) && datum.replace(/-00$/, '-28') > heute

const MONATE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

/** „21.08.21“; ohne Tag „Dez 19“. */
export function kompaktDatum(iso) {
  const [jahr, monat, tag] = iso.split('-')
  return tag === '00' ? `${MONATE[Number(monat) - 1]} ${jahr.slice(2)}` : `${tag}.${monat}.${jahr.slice(2)}`
}

export const gruppenVon = (liste) => ARTEN.map((art) => ({ art, liste: liste.filter((v) => v.art === art) })).filter((g) => g.liste.length)

/** Gesamtausgaben und Boxen stehen offen; Volumes und Filme zugeklappt, wo es Gesamtausgaben oder Boxen gibt. */
export function startOffen(liste, art) {
  const gross = liste.some((v) => v.art === 'gesamt' || v.art === 'box')
  return !gross || art === 'gesamt' || art === 'box'
}

export function jahre(liste) {
  const alle = liste.map(spaetestes).filter(Boolean).map((d) => d.slice(0, 4)).sort()
  if (!alle.length) return ''
  return alle[0] === alle.at(-1) ? alle[0] : `${alle[0]}–${alle.at(-1)}`
}

/** Händlername aus der Adresse: „amazon.de“ wird „Amazon“. */
export function haendlerAus(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').split('.')[0]
    return host.charAt(0).toUpperCase() + host.slice(1)
  } catch {
    return 'Shop'
  }
}

/** Beschriftung des Kauflinks: Eine Namenssuche verspricht kein Produkt, die EAN-Suche eines. */
export function kaufText(url, shop) {
  const treffer = /^https:\/\/(?:www\.)?amazon\.[a-z.]+\/(s\?|(?:[^/?#]+\/)?dp\/|gp\/product\/)(?:k=([^&]*))?/.exec(url ?? '')
  if (!treffer || treffer[1] !== 's?') return `Kaufen bei ${shop}`
  return /^\d{8,14}$/.test(treffer[2] ?? '') ? `Bei ${shop}` : `Bei ${shop} suchen`
}
