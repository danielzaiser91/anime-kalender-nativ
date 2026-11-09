// Folgenbereiche des deutschen Tons (shared/dub-grenze.ts).
// Ein Bereich ist { from, to, dub } in der Zählung des Anbieters; "nicht erfasst" ist etwas anderes als "ohne deutschen Ton".
const nachAnfang = (a, b) => a.from - b.from
const kurz = (r) => (r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`)
const laenge = (r) => Math.max(0, r.to - r.from + 1)

export const deutsche = (bereiche) => bereiche.filter((r) => r.dub)
export const hatDeutsch = (bereiche) => Boolean(bereiche?.some((r) => r.dub))
export const ungefaehr = (wert, geschaetzt) => (geschaetzt ? `≈ ${wert}` : String(wert))
export const bereicheKurz = (bereiche) => [...bereiche].sort(nachAnfang).map(kurz).join(', ')

/** Die einzige Verschmelzung: berührende oder überlappende Bereiche werden eins; `gleich` entscheidet, ob zwei verschmelzen dürfen. */
export function zusammengefasst(bereiche, gleich = () => true) {
  const raus = []
  for (const b of [...bereiche].sort(nachAnfang)) {
    const letzter = raus.at(-1)
    if (letzter && gleich(letzter, b) && b.from <= letzter.to + 1) letzter.to = Math.max(letzter.to, b.to)
    else raus.push({ ...b })
  }
  return raus
}

export const ausNummern = (nummern, dub = true) => zusammengefasst(nummern.map((n) => ({ from: n, to: n, dub })))

export const folgenText = (bereiche) => `Fg. ${bereicheKurz(zusammengefasst(bereiche))}`

export const zaehltDurchgehend = (bereiche, gesamt) => Boolean(gesamt) && Boolean(bereiche?.some((r) => r.to > gesamt))

export const folgenVon = (bereiche, gesamt = Infinity) => new Set(bereiche.flatMap((r) => Array.from({ length: Math.max(0, Math.min(r.to, gesamt) - r.from + 1) }, (_, i) => r.from + i)))

const fehlende = (erfasst, gesamt) => ausNummern(Array.from({ length: gesamt }, (_, i) => i + 1).filter((n) => !erfasst.has(n)), false)

// Drei Zustände: deutsch, ohne Ton (dub false) und nicht erfasst; "nicht erfasst" heißt nicht "ohne Deutsch".
export function dubBild(bereiche, gesamt) {
  if (!bereiche?.length) return null
  const nichtImAngebot = gesamt && !zaehltDurchgehend(bereiche, gesamt) ? fehlende(folgenVon(bereiche, gesamt), gesamt) : []
  return { deutsch: deutsche(bereiche).sort(nachAnfang), ohneTon: bereiche.filter((r) => !r.dub).sort(nachAnfang), nichtImAngebot }
}

export function dubAbdeckung(bereiche, gesamt) {
  if (!bereiche?.length) return { belegt: gesamt ?? 0, vollstaendig: true }
  const belegt = deutsche(bereiche).reduce((n, r) => n + laenge(r), 0)
  return { belegt, vollstaendig: !gesamt || belegt >= gesamt }
}

export const bereicheGekuerzt = (bereiche, hoechstens = 2) => ({ text: bereicheKurz(bereiche.slice(0, hoechstens)), rest: Math.max(0, bereiche.length - hoechstens) })

export function folgenOhneAnbieter(wege, gesamt) {
  if (!gesamt || !wege.length || wege.some((w) => !w?.length || zaehltDurchgehend(w, gesamt))) return null
  const da = folgenVon(wege.flatMap(deutsche), gesamt)
  if (!da.size) return null
  const fehlt = fehlende(da, gesamt)
  return fehlt.length ? bereicheKurz(fehlt) : null
}
