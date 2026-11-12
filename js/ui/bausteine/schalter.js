// Ein Knopf, der an oder aus ist (aria-pressed); `aktion` und die Daten dazu liest ui/aktionen.js, `fokus` merkt sich die Zeichnung über das Neuzeichnen hinweg.
import { h } from '../dom.js'

export function schalter({ text, name, an, aktion, fokus, klasse = '', daten = {} }) {
  const attribute = { type: 'button', class: `schalter ${klasse}`.trim(), 'aria-pressed': an === undefined ? undefined : String(an), 'aria-label': name, 'data-aktion': aktion, 'data-fokus': fokus }
  for (const [schluessel, wert] of Object.entries(daten)) attribute[`data-${schluessel}`] = wert
  return h('button', attribute, text)
}
