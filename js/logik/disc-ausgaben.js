// Disc-Ausgaben eines Titels als eine Liste, gleich ob eine Ausgabe als aniSearch-Artikel oder als Termin des Bestands bekannt ist (Hauptseite: disc-ausgaben.ts, disc-ausgabe.ts).
export const FORMATE = ['b', 'd', 'u']

/** Medium-Wörter, die das Kürzel „Blu-ray“ vor dem Datum schon sagt. */
const MEDIUM = /\b(?:blu-?ray|dvd|4k uhd)\b/gi

const woerter = (teil) => new Set(teil.replace(MEDIUM, ' ').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean))

/** Streicht das Medium und verwaiste Trenner am Rand („Standard & Limited Edition, Blu-ray“ wird „Standard & Limited Edition“). */
const ohneMedium = (teil) =>
  teil
    .replace(MEDIUM, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,:;])/g, '$1')
    .replace(/^[\s,:;+&-]+|[\s,:;+&-]+$/g, '')

/** Ein Teil, dessen Wörter schon in einem anderen stecken, entfällt; bei Gleichheit gewinnt der frühere. */
export function kurzeAusgabe(edition) {
  if (!edition) return undefined
  const teile = edition.split(' · ').map((t) => t.trim()).filter(Boolean)
  const bleibt = teile.filter((teil, i) => {
    const eigene = woerter(teil)
    return !teile.some((anderes, j) => {
      if (i === j) return false
      const fremde = woerter(anderes)
      return [...eigene].every((w) => fremde.has(w)) && (fremde.size > eigene.size || j < i)
    })
  })
  return bleibt.map(ohneMedium).filter(Boolean).join(' · ') || undefined
}

/** Formate aus der Editionsangabe eines Termins („Limited Edition, DVD & Blu-ray“); ohne Angabe gilt Blu-ray. */
function formateAus(edition = '') {
  const gefunden = []
  if (/4k|uhd/i.test(edition)) gefunden.push('u')
  if (/blu-?ray/i.test(edition)) gefunden.push('b')
  if (/\bdvd\b/i.test(edition)) gefunden.push('d')
  return gefunden.length ? gefunden : ['b']
}

/** „Sakamoto Days – Vol. 1“ wird „Vol. 1“: der Serienname steht schon im Kopf des Panels. */
function ohneTitel(name, titel) {
  const rest = name.replace(titel, '').replace(/^[\s–\-:]+/, '').trim()
  return rest.length >= 3 ? rest : ''
}

/** Die aniSearch-Ausgaben: gleicher Name und gleiches Datum sind eine Ausgabe in mehreren Formaten. */
function ausgabenVonAniSearch(zeilen) {
  const nachSchluessel = new Map()
  for (const [kurz, format, art, datum, artikel] of zeilen) {
    const schluessel = `${kurz}|${datum}`
    const eintrag = nachSchluessel.get(schluessel) ?? { schluessel: `as-${artikel}`, name: kurz, formate: [], datum, gesamt: art === 'g', artikel: {} }
    if (!eintrag.formate.includes(format)) eintrag.formate.push(format)
    eintrag.artikel[format] = artikel
    nachSchluessel.set(schluessel, eintrag)
  }
  return [...nachSchluessel.values()].map((a) => ({ ...a, formate: FORMATE.filter((f) => a.formate.includes(f)) }))
}

function terminAlsAusgabe(termin, { index, titel }) {
  const name = [ohneTitel(termin.name, titel), kurzeAusgabe(termin.edition)].filter(Boolean).join(' · ') || 'Ausgabe'
  return { schluessel: `t-${index}`, name, formate: formateAus(termin.edition), datum: termin.datum, gesamt: /gesamt|komplett/i.test(termin.edition ?? ''), artikel: {}, shop: termin.shop, termin }
}

/** Ein Termin gehört zu der aniSearch-Ausgabe, auf deren Artikel er verweist; sonst wird er eine eigene Zeile. */
function mitTerminen(liste, termine, titel) {
  const ergebnis = liste.map((a) => ({ ...a }))
  termine.forEach((termin, index) => {
    const treffer = ergebnis.find((a) => Object.values(a.artikel).some((n) => termin.artikel.includes(n)))
    if (treffer) Object.assign(treffer, { termin, shop: termin.shop })
    else ergebnis.push(terminAlsAusgabe(termin, { index, titel }))
  })
  return ergebnis
}

/** Alle Ausgaben eines Titels, älteste zuerst; ohne Datum ans Ende. `daten`: { ausgaben, termine } der Disc-Datei. */
export function discAusgabenVon(daten, titelName) {
  return mitTerminen(ausgabenVonAniSearch(daten.ausgaben), daten.termine, titelName).sort((a, b) => (a.datum || '9999').localeCompare(b.datum || '9999') || a.name.localeCompare(b.name))
}
