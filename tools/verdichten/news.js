// News für die Seite: je Woche eine Datei (Tage, darin Einträge je Titel, darin Meldungen mit fertigem Satz), dazu ein Index der Wochen.
import { ART_NAMEN, datumKurz, newsSatz } from './news-text.js'
import { istEcchi } from './wochen.js'
import { ohneEingeordnete, verlaeufeAus } from './news-verlauf.js'
import { wocheVon } from '../../js/logik/zeit.js'

export const NEWS_SCHEMA = 1
const MIN_EINTRAEGE = 100
const NUR_ORIGINALTON = 'Die Quelle nennt nur Originalton mit Untertiteln, keine deutsche Synchro.'
const istLink = (text) => typeof text === 'string' && /^https?:\/\//.test(text)
const host = (adresse) => new URL(adresse).hostname.replace(/^www\./, '')

/** Die Quellen einer Meldung; ein geschätzter Termin nennt keine (die Seite dahinter belegt ihn nicht). */
function belegeVon(m) {
  if (m.geschaetzt) return []
  const liste = m.belege?.length ? m.belege : istLink(m.quelle) ? [{ url: m.quelle, name: host(m.quelle) }] : []
  return liste.filter((b) => istLink(b.url)).map((b) => [b.url, b.name])
}

function abloesung(m) {
  if (m.ersetzt) return { text: `ersetzt durch ${m.ersetzt.datum ? datumKurz(m.ersetzt.datum) : ''}`.trim(), url: istLink(m.ersetzt.quelle) ? m.ersetzt.quelle : undefined }
  if (m.zurueckgezogen) return { text: m.zurueckgezogen.grund === NUR_ORIGINALTON ? 'zurückgezogen: nur OmU' : 'zurückgezogen' }
  return undefined
}

export function baueMeldung(m, am, staende) {
  const meldung = { art: m.art, label: ART_NAMEN[m.art], satz: newsSatz(m, am) }
  if (m.art === 'neu' && m.weiterer) meldung.weiterer = 1
  if (m.teil) meldung.teil = m.teil
  if (m.hinweis) meldung.hinweis = m.hinweis
  const belege = belegeVon(m)
  if (belege.length) meldung.belege = belege
  if (staende) meldung.verlauf = staende.map((s) => ({ am: s.am, ueberholtAm: s.ueberholtAm, satz: newsSatz(s.m, s.am), belege: belegeVon(s.m) }))
  const abgeloest = abloesung(m)
  if (abgeloest) meldung.abgeloest = abgeloest
  return meldung
}

const kleinesBild = (url) => (typeof url === 'string' && url.startsWith('https://') ? url.replace(/\/t\/p\/w\d+\//, '/t/p/w185/') : null)

function baueEintrag(e, { akVon, ecchi, vorgaenger }) {
  const eintrag = { ak: akVon.get(e.titelId) ?? null, name: e.titel, cover: kleinesBild(e.cover), meldungen: e.meldungen.map((m) => baueMeldung(m, e.am, vorgaenger.get(m))) }
  if (ecchi.has(e.titelId)) eintrag.ecchi = 1
  return eintrag
}

/** Je Woche die Tage (neueste zuerst) mit ihren Einträgen; der Index nennt die Wochen, neueste zuerst. */
export function baueNews(news, kontext) {
  if (!Array.isArray(news) || news.length < MIN_EINTRAEGE) throw new Error(`news.json: ${news?.length} Einträge, erwartet mindestens ${MIN_EINTRAEGE}`)
  const { vorgaenger, eingeordnet } = verlaeufeAus(news)
  const nachTag = Map.groupBy(ohneEingeordnete(news, eingeordnet), (e) => e.am.slice(0, 10))
  const tage = [...nachTag.keys()].sort().reverse().map((am) => ({ am, eintraege: nachTag.get(am).map((e) => baueEintrag(e, { ...kontext, vorgaenger })) }))
  const wochen = Map.groupBy(tage, (tag) => wocheVon(tag.am))
  const dateien = new Map([...wochen].map(([woche, liste]) => [woche, { schema: NEWS_SCHEMA, woche, tage: liste }]))
  return { index: { schema: NEWS_SCHEMA, wochen: [...wochen.keys()] }, wochen: dateien }
}

/** Kennung (nur mit Panel) und Ecchi-Marke je Titel-ID, wie die Wochendateien sie führen. */
export function newsKontext({ titel, titelVoll }, akVon) {
  return { akVon, ecchi: new Set([...titel, ...titelVoll].filter(istEcchi).map((t) => t.id)) }
}
