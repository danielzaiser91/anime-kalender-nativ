// Wischen an einem Element: erkennt die Richtung (logik/wisch.js) und meldet sie; ein echtes Klick-Ereignis, das einem Wisch mit der Maus folgt, wird verschluckt.
import { wischRichtung, WISCH_SCHWELLE } from '../logik/wisch.js'

/** `beiWisch(richtung)` läuft nach dem Loslassen; `schwelle` ist der Mindestweg in Pixeln. */
export function verdrahteWischen(element, beiWisch, schwelle = WISCH_SCHWELLE) {
  let start = null
  let gewischt = false
  element.addEventListener('pointerdown', (ereignis) => {
    start = { x: ereignis.clientX, y: ereignis.clientY }
    gewischt = false
  })
  element.addEventListener('pointerup', (ereignis) => {
    const richtung = start && wischRichtung(ereignis.clientX - start.x, ereignis.clientY - start.y, schwelle)
    start = null
    gewischt = Boolean(richtung)
    if (richtung) beiWisch(richtung)
  })
  element.addEventListener('pointercancel', () => {
    start = null
  })
  element.addEventListener(
    'click',
    (ereignis) => {
      if (!gewischt || !ereignis.isTrusted) return
      gewischt = false
      ereignis.stopPropagation()
      ereignis.preventDefault()
    },
    true,
  )
}
