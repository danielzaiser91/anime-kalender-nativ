// Eine Wahl im Filter als Link zur nächsten Stellung (nichts → ausgewählt → ausgeschlossen → nichts); der Zustand steht in Zeichen und Name, nicht nur in Farbe.
import { h } from '../dom.js'

const ZEICHEN = { mit: '✓ ', ohne: '⊘ ', nichts: '' }
const ZUSTAND = { mit: 'ausgewählt', ohne: 'ausgeschlossen', nichts: 'nicht gewählt' }

export function wahlLink({ text, zustand, ziel, fokus }) {
  const attribute = { class: 'wahl-knopf', href: ziel, 'data-zustand': zustand, 'data-fokus': fokus, 'aria-label': `${text}: ${ZUSTAND[zustand]}` }
  return h('a', attribute, ZEICHEN[zustand], text)
}
