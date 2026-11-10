// Überholte Meldungen gehören unter die, die sie überholt hat (Hauptseite: web/src/lib/news-verlauf.ts, Entwurf B).
// Die abgelöste Meldung trägt `ersetzt.datum`, das Datum der neuen; die neue steht vorn, die alten darunter (neueste zuerst),
// aus ihrer eigenen Tagesliste verschwinden sie. Fehlt der Nachfolger in den Daten, bleibt die alte, wo sie ist.

/** Dieselbe Aussage: gleicher Teil, gleiches Release, gleiche Art. */
const aussage = (e, m) => `${m.teilId ?? e.titelId}|${m.release ?? ''}|${m.art}`

function nachAussage(liste) {
  const karte = new Map()
  for (const e of liste) {
    for (const m of e.meldungen) {
      if (m.release) karte.set(aussage(e, m), [...(karte.get(aussage(e, m)) ?? []), { m, am: e.am }])
    }
  }
  return karte
}

/** Je überholter Meldung ihr Nachfolger: `direkt` (Nachfolger → Stände) und `eingeordnet` (die überholten Meldungen). */
function nachfolger(liste) {
  const karte = nachAussage(liste)
  const direkt = new Map()
  const eingeordnet = new Set()
  for (const e of liste) {
    for (const m of e.meldungen) {
      if (!m.ersetzt?.datum || !m.release) continue
      const neu = (karte.get(aussage(e, m)) ?? []).find((x) => x.m !== m && x.m.datum === m.ersetzt.datum)
      if (!neu) continue
      eingeordnet.add(m)
      direkt.set(neu.m, [...(direkt.get(neu.m) ?? []), { m, am: e.am, ueberholtAm: neu.am }])
    }
  }
  return { direkt, eingeordnet }
}

/** Ketten (20.11. → 18.12. → 15.01.): jede geltende Meldung sammelt alle Vorgänger, neueste zuerst. */
export function verlaeufeAus(liste) {
  const { direkt, eingeordnet } = nachfolger(liste)
  const vorgaenger = new Map()
  for (const [wurzel, erste] of direkt) {
    if (eingeordnet.has(wurzel)) continue
    const alle = []
    const offen = [...erste]
    while (offen.length) {
      const stand = offen.pop()
      alle.push(stand)
      offen.push(...(direkt.get(stand.m) ?? []))
    }
    vorgaenger.set(wurzel, alle.sort((a, b) => b.am.localeCompare(a.am)))
  }
  return { vorgaenger, eingeordnet }
}

/** Die Liste ohne die eingeordneten Meldungen; Einträge, die dadurch leer werden, entfallen. */
export function ohneEingeordnete(liste, eingeordnet) {
  return liste.map((e) => ({ ...e, meldungen: e.meldungen.filter((m) => !eingeordnet.has(m)) })).filter((e) => e.meldungen.length > 0)
}
