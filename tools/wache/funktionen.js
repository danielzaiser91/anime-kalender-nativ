// Findet Funktionen mit Block (function, Pfeil, Methode) im entschärften Text und misst Zeilen und Parameter.
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function'])
const MUSTER = [
  /\bfunction\b\s*\*?\s*([\w$]*)\s*\(/g,
  /(?:^|[^\w$.])(?:async\s+)?\(/g,
  /(?:^|[\s(,])(?:async\s+)?([\w$]+)\s*=>\s*\{/g,
  /^[ \t]*(?:async\s+)?([\w$]+)\s*\(/gm,
]

/** Index der schließenden Klammer zu der öffnenden bei `von`, sonst -1. */
export function passende(text, von) {
  const auf = text[von]
  const zu = { '(': ')', '{': '}' }[auf]
  let tiefe = 0
  for (let i = von; i < text.length; i++) {
    if (text[i] === auf) tiefe++
    if (text[i] === zu && --tiefe === 0) return i
  }
  return -1
}

export function zaehleParameter(text) {
  let tiefe = 0
  let anzahl = text.trim() ? 1 : 0
  for (const z of text) {
    if ('([{'.includes(z)) tiefe++
    if (')]}'.includes(z)) tiefe--
    if (z === ',' && tiefe === 0) anzahl++
  }
  return anzahl
}

const zeileVon = (text, index) => text.slice(0, index).split('\n').length

/** Nach einer Parameterklammer: der Block (bei Pfeilfunktionen nach dem Pfeil) oder nichts. */
function koerperNach(text, ende, pfeil) {
  const rest = text.slice(ende + 1)
  const treffer = rest.match(pfeil ? /^\s*=>\s*\{/ : /^\s*\{/)
  return treffer ? ende + treffer[0].length : -1
}

function vermesse(text, { klammer, name, pfeil = false }) {
  const ende = passende(text, klammer)
  if (ende < 0) return null
  const koerper = koerperNach(text, ende, pfeil)
  if (koerper < 0) return null
  const schluss = passende(text, koerper)
  if (schluss < 0) return null
  const parameter = zaehleParameter(text.slice(klammer + 1, ende))
  return { name, zeile: zeileVon(text, klammer), zeilen: zeileVon(text, schluss) - zeileVon(text, klammer) + 1, parameter }
}

function pfeilEinzel(text, treffer) {
  const klammer = text.indexOf('{', treffer.index)
  const schluss = passende(text, klammer)
  return { name: treffer[1], zeile: zeileVon(text, treffer.index), zeilen: zeileVon(text, schluss) - zeileVon(text, treffer.index) + 1, parameter: 1 }
}

export function findeFunktionen(text) {
  const funde = new Map()
  for (const m of text.matchAll(MUSTER[0])) funde.set(m.index, vermesse(text, { klammer: m.index + m[0].length - 1, name: m[1] || 'anonym' }))
  for (const m of text.matchAll(MUSTER[1])) funde.set(m.index, vermesse(text, { klammer: m.index + m[0].length - 1, name: 'Pfeil', pfeil: true }))
  for (const m of text.matchAll(MUSTER[2])) funde.set(m.index, pfeilEinzel(text, m))
  for (const m of text.matchAll(MUSTER[3])) {
    if (!KEYWORDS.has(m[1])) funde.set(m.index, vermesse(text, { klammer: m.index + m[0].length - 1, name: m[1] }))
  }
  return [...funde.values()].filter(Boolean)
}
