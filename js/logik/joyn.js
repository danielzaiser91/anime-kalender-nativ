// Joyn hält ein rollendes Fenster: was jetzt abrufbar ist und die nächste Folge (web/src/lib/joyn.ts).
import { ausNummern, folgenText, ungefaehr } from './dub.js'
import { berlinText } from './erschienen.js'

export function joynAngabe(fenster, jetztMs) {
  if (!fenster?.length) return undefined
  const jetzt = berlinText(jetztMs)
  const offen = fenster.filter((f) => f.ab <= jetzt && jetzt < f.ende).map((f) => f.nr)
  const naechste = fenster.filter((f) => f.ab > jetzt).sort((a, b) => a.ab.localeCompare(b.ab))[0]
  const gleicherTag = naechste?.ab.slice(0, 10) === jetzt.slice(0, 10)
  const wann = gleicherTag ? naechste.ab.slice(11, 16) : naechste && `${naechste.ab.slice(8, 10)}.${naechste.ab.slice(5, 7)}.`
  const teile = [
    offen.length ? ungefaehr(folgenText(ausNummern(offen)), true) : undefined,
    naechste ? `Fg. ${naechste.nr} ab ${wann}` : undefined,
  ].filter(Boolean)
  return teile.length ? teile.join(' · ') : undefined
}
