// "Was gucken?" (wird erst beim ersten Öffnen geladen): Einleitung → Duelle → fünf Vorschläge; der Ablauf steht im Store (zustand/gucken.js), die Handlungen lesen ui/aktionen.js.
import { h } from '../dom.js'
import { ansichtsrahmen, ladeMeldung } from '../bausteine/seitenrahmen.js'
import { duellAnsicht } from '../bausteine/gucken-duell.js'
import { vorschlagsAnsicht } from '../bausteine/gucken-vorschlaege.js'

function einleitung() {
  return h(
    'section',
    { class: 'gucken-start' },
    h('h2', { class: 'seiten-titel' }, 'Zeig uns, was du magst.'),
    h('p', { class: 'hinweis-zeile' }, 'Triff 6 Entscheidungen und wir ermitteln daraus deine Vorlieben – daraus werden 5 Vorschläge. Alles bleibt in deinem Browser.'),
    h('div', { class: 'gucken-leiste' }, h('button', { type: 'button', class: 'schalter hervor', 'data-aktion': 'gucken-los', 'data-fokus': 'gucken-los' }, "Los geht's")),
  )
}

function inhalt(zustand) {
  const meldung = ladeMeldung(zustand)
  if (meldung) return meldung
  const g = zustand.gucken
  if (g?.phase === 'duell') return duellAnsicht(g)
  if (g?.phase === 'ergebnis') return vorschlagsAnsicht(g, { ort: zustand.ort, merk: zustand.merk })
  return einleitung()
}

export const guckenseite = (zustand) => ansichtsrahmen(zustand, 'guckenseite', inhalt(zustand))
