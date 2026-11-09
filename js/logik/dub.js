// Folgenbereiche des deutschen Tons (shared/dub-grenze.ts).
// Ein Bereich ist { from, to, dub } in der Zählung des Anbieters; "nicht erfasst" ist etwas anderes als "ohne deutschen Ton".
const nachAnfang = (a, b) => a.from - b.from
const kurz = (r) => (r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`)

export const bereicheKurz = (bereiche) => [...bereiche].sort(nachAnfang).map(kurz).join(', ')

export function zusammengefasst(bereiche) {
  const raus = []
  for (const b of [...bereiche].sort(nachAnfang)) {
    const letzter = raus.at(-1)
    if (letzter && b.from <= letzter.to + 1) letzter.to = Math.max(letzter.to, b.to)
    else raus.push({ from: b.from, to: b.to })
  }
  return raus
}

export const zaehltDurchgehend = (bereiche, gesamt) => Boolean(gesamt) && Boolean(bereiche?.some((r) => r.to > gesamt))

function fehlende(erfasst, gesamt) {
  const luecken = []
  for (let n = 1; n <= gesamt; n++) {
    if (erfasst.has(n)) continue
    const letzter = luecken.at(-1)
    if (letzter?.to === n - 1) letzter.to = n
    else luecken.push({ from: n, to: n })
  }
  return luecken
}

export const folgenVon = (bereiche, gesamt = Infinity) => new Set(bereiche.flatMap((r) => Array.from({ length: Math.max(0, Math.min(r.to, gesamt) - r.from + 1) }, (_, i) => r.from + i)))

// Drei Zustände: deutsch, ohne Ton (dub false) und nicht erfasst; "nicht erfasst" heißt nicht "ohne Deutsch".
export function dubBild(bereiche, gesamt) {
  if (!bereiche?.length) return null
  const deutsch = bereiche.filter((r) => r.dub).sort(nachAnfang)
  const ohneTon = bereiche.filter((r) => !r.dub).sort(nachAnfang)
  const deutscheFolgen = deutsch.reduce((n, r) => n + Math.max(0, r.to - r.from + 1), 0)
  const nichtImAngebot = gesamt && !zaehltDurchgehend(bereiche, gesamt) ? fehlende(folgenVon(bereiche, gesamt), gesamt) : []
  return { deutsch, ohneTon, nichtImAngebot, deutscheFolgen }
}

export function dubAbdeckung(bereiche, gesamt) {
  if (!bereiche?.length) return { belegt: gesamt ?? 0, vollstaendig: true }
  const belegt = bereiche.filter((r) => r.dub).reduce((n, r) => n + Math.max(0, r.to - r.from + 1), 0)
  return { belegt, vollstaendig: !gesamt || belegt >= gesamt }
}

export const bereicheGekuerzt = (bereiche, hoechstens = 2) => ({ text: bereicheKurz(bereiche.slice(0, hoechstens)), rest: Math.max(0, bereiche.length - hoechstens) })

export function folgenOhneAnbieter(wege, gesamt) {
  if (!gesamt || !wege.length || wege.some((w) => !w?.length || zaehltDurchgehend(w, gesamt))) return null
  const da = folgenVon(wege.flatMap((w) => w.filter((r) => r.dub)), gesamt)
  if (!da.size) return null
  const fehlt = fehlende(da, gesamt)
  return fehlt.length ? bereicheKurz(fehlt) : null
}
