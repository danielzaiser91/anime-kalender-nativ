// Verbote am Code: unsicheres DOM (Punkt 6), veränderliche Modulvariablen (Punkt 5), DOM in logik/daten (Punkt 4).
const UNSICHER = [
  { muster: /\b(innerHTML|outerHTML|insertAdjacentHTML)\b/, was: 'HTML aus Text (nur h() und Textknoten)' },
  { muster: /\beval\s*\(/, was: 'eval' },
  { muster: /\bnew\s+Function\b/, was: 'new Function' },
  { muster: /\bdocument\s*\.\s*write/, was: 'document.write' },
]
const DOM = { muster: /\b(document|window|localStorage|sessionStorage|navigator|location|history)\b/, was: 'Schicht kennt kein DOM' }
const FETCH = { muster: /\bfetch\s*\(/, was: 'fetch wird von außen übergeben' }
const MODULVARIABLE = { muster: /^(let|var)\s/, was: 'veränderliche Variable auf Modulebene (Zustand gehört in den Store)' }

function treffer(pfad, text, { muster, was }) {
  return text.split('\n').flatMap((zeile, i) => (muster.test(zeile) ? [`${pfad}:${i + 1}: ${was}`] : []))
}

/** Gilt für alles Ausgelieferte (js/); Werkzeuge unter tools/ laufen nur im Bau. */
export function pruefeVerbote(pfad, entschaerft) {
  return pfad.startsWith('js/') ? UNSICHER.flatMap((regel) => treffer(pfad, entschaerft, regel)) : []
}

export function pruefeModulvariablen(pfad, entschaerft) {
  return treffer(pfad, entschaerft, MODULVARIABLE)
}

/** logik/ und daten/ kennen kein DOM; daten/ bekommt fetch von außen. */
export function pruefeDomFrei(pfad, entschaerft) {
  if (!/^js\/(logik|daten)\//.test(pfad)) return []
  const funde = treffer(pfad, entschaerft, DOM)
  return pfad.startsWith('js/daten/') ? funde.concat(treffer(pfad, entschaerft, FETCH)) : funde
}
