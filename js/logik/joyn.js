// Joyn hält ein rollendes Fenster: Die Pille nennt, was jetzt abrufbar ist, und die nächste Folge. Wie web/src/lib/joyn.ts der Hauptseite.
import { berlinText } from './erschienen.js'

function bereicheAus(nummern) {
  const bereiche = []
  for (const nr of nummern) {
    const letzter = bereiche.at(-1)
    if (letzter && nr === letzter[1] + 1) letzter[1] = nr
    else bereiche.push([nr, nr])
  }
  return bereiche
}

export function joynAngabe(fenster, jetztMs) {
  if (!fenster?.length) return undefined
  const jetzt = berlinText(jetztMs)
  const offen = fenster.filter((f) => f.ab <= jetzt && jetzt < f.ende).map((f) => f.nr).sort((a, b) => a - b)
  const bereiche = bereicheAus(offen)
  const naechste = fenster.filter((f) => f.ab > jetzt).sort((a, b) => a.ab.localeCompare(b.ab))[0]
  const gleicherTag = naechste?.ab.slice(0, 10) === jetzt.slice(0, 10)
  const wann = gleicherTag ? naechste.ab.slice(11, 16) : naechste && `${naechste.ab.slice(8, 10)}.${naechste.ab.slice(5, 7)}.`
  const teile = [
    bereiche.length ? `≈ Fg. ${bereiche.map(([a, b]) => (a === b ? a : `${a}–${b}`)).join(', ')}` : undefined,
    naechste ? `Fg. ${naechste.nr} ab ${wann}` : undefined,
  ].filter(Boolean)
  return teile.length ? teile.join(' · ') : undefined
}
