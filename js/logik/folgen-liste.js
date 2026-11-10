// Folgenliste im Panel (Hauptseite: folgen-bereich.tsx, stream-bereiche.ts): welche Folge die deutsche Marke trägt, welche noch aussteht, wie die Liste in Pakete geteilt wird.
export const PAKET = 50

/** Deutsche Bereiche der Wege (Folge von … bis …), wie sie die Antwort belegt. */
export const deutscheBereiche = (titel) => (titel.streams ?? []).flatMap((s) => (s.dubRanges ?? []).filter((r) => r.dub))

/** Trägt die Folge die deutsche Marke: laut Folgenliste (`de`, Fernsehen und Belege des Baus) oder laut den Bereichen der Wege. */
export const folgeIstDeutsch = (nr, de, wege) => [...de.map(([von, bis]) => ({ from: von, to: bis })), ...wege].some((r) => nr >= r.from && nr <= r.to)

/** Nur eine laufende Serie kennt „erschienen“: sonst gilt keine Folge als ausstehend. */
export const erschieneneFuerFolgenliste = (antwort) => (antwort?.art === 'laeuft' && typeof antwort.raus === 'number' ? antwort.raus : undefined)

/** Beschriftungen der Pakete „1–50“, „51–100“ … bei mehr als einem Paket. */
export function paketNamen(anzahl) {
  const pakete = Math.ceil(anzahl / PAKET)
  return pakete > 1 ? Array.from({ length: pakete }, (_, i) => `${i * PAKET + 1}–${Math.min((i + 1) * PAKET, anzahl)}`) : []
}

/** Was hinter einer Folge steht: `de`, `noch`, `nein` (mit Hinweis), `offen` (keine Marke belegt) oder `keine` (nichts zu sagen). */
export function folgeMarke(nr, { liste, wege, erschienen }) {
  if (folgeIstDeutsch(nr, liste.de ?? [], wege)) return { art: 'de' }
  if (erschienen !== undefined && nr > erschienen) return { art: 'noch' }
  const text = liste.h?.find(([n]) => n === nr)?.[1]
  if (text) return { art: 'nein', text }
  return liste.de?.length ? { art: 'offen' } : { art: 'keine' }
}
