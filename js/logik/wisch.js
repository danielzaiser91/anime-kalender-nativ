// Wann eine Fingerbewegung ein Wischen ist (Duell in "Was gucken?", Patch-Notes-Dialog nach unten). Rein, ohne DOM.

/** Mindestweg in Pixeln; kürzer ist Tippen oder Zittern. */
export const WISCH_SCHWELLE = 60

/** Die Richtung ('links', 'rechts', 'oben', 'unten') einer Bewegung um (dx, dy), oder null: zu kurz oder zu schräg (die längere Achse muss anderthalbmal so lang sein). */
export function wischRichtung(dx, dy, schwelle = WISCH_SCHWELLE) {
  const lang = Math.max(Math.abs(dx), Math.abs(dy))
  const kurz = Math.min(Math.abs(dx), Math.abs(dy))
  if (lang < schwelle || kurz * 1.5 > lang) return null
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'links' : 'rechts'
  return dy < 0 ? 'oben' : 'unten'
}
