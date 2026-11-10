// Textvergleich der Suche, nachgebaut aus web/src/lib/search.ts der Hauptseite: Umlaute und Akzente fallen, Wörter, Tippfehler-Toleranz.
// Rein, ohne DOM.
const ZEICHEN_VOR_WORT = /[^\p{L}\p{N}]+/u
const AEHNLICH_AB = 0.6
const PRAEFIX_AB = 4

export function normalisiere(text) {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'a')
    .replace(/[öÖ]/g, 'o')
    .replace(/[üÜ]/g, 'u')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export const woerter = (text) => normalisiere(text).split(ZEICHEN_VOR_WORT).filter(Boolean)

function bigramme(wort) {
  const paare = new Set()
  for (let i = 0; i < wort.length - 1; i++) paare.add(wort.slice(i, i + 2))
  return paare
}

function aehnlichkeit(a, b, paareA = bigramme(a)) {
  const paareB = bigramme(b)
  if (!paareA.size || !paareB.size) return a === b ? 1 : 0
  let gemeinsam = 0
  for (const paar of paareA) if (paareB.has(paar)) gemeinsam++
  return (2 * gemeinsam) / (paareA.size + paareB.size)
}

/** Editierabstand, bricht über `max` ab (dann max + 1). */
export function abstand(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let vorige = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const aktuelle = [i]
    for (let j = 1; j <= b.length; j++) aktuelle.push(Math.min(aktuelle[j - 1] + 1, vorige[j] + 1, vorige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)))
    if (Math.min(...aktuelle) > max) return max + 1
    vorige = aktuelle
  }
  return vorige[b.length]
}

const toleranz = (laenge) => (laenge <= 2 ? 0 : laenge <= 6 ? 1 : 2)

function wortTrifftUngefaehr(suchwort, heuhaufen) {
  const tol = toleranz(suchwort.length)
  if (!tol) return false
  const paare = suchwort.length >= 5 ? bigramme(suchwort) : undefined
  return heuhaufen.some((wort) => {
    if (suchwort.length >= PRAEFIX_AB && wort.length >= PRAEFIX_AB && (wort.startsWith(suchwort) || suchwort.startsWith(wort))) return true
    if (abstand(suchwort, wort, tol) <= tol) return true
    return Boolean(paare) && wort.length >= 5 && aehnlichkeit(suchwort, wort, paare) >= AEHNLICH_AB
  })
}

/** Jedes Suchwort steckt (als Teil eines Wortes oder Satzes) in einem der Felder. */
export function trifftGenau(suchwoerter, felder) {
  const heu = felder.map(normalisiere)
  return suchwoerter.every((w) => heu.some((h) => h.includes(w)))
}

/** Wie genau, aber mit Tippfehlern (nur Titelnamen). */
export function trifftUngefaehr(suchwoerter, namen) {
  const heu = namen.flatMap(woerter)
  if (!suchwoerter.length || !heu.length) return false
  return suchwoerter.every((w) => heu.some((h) => h.includes(w)) || wortTrifftUngefaehr(w, heu))
}

const woerterAller = (namen) => namen.flatMap(woerter)

/** Wie viele Suchwörter keinen Wortanfang in den Namen treffen. */
export const ohneWortanfang = (suchwoerter, namen) => suchwoerter.filter((w) => !woerterAller(namen).some((h) => h.startsWith(w))).length

/** Länge des kürzesten Namens, der alle Suchwörter enthält (999 ohne). */
export function kuerzesterName(suchwoerter, namen) {
  const passend = namen.map(normalisiere).filter((n) => suchwoerter.every((w) => n.includes(w)))
  return passend.length ? Math.min(...passend.map((n) => n.length)) : 999
}

/** Summe der Tippabstände je Suchwort zum nächsten Wort der Namen. */
export const tippAbstand = (suchwoerter, namen) => suchwoerter.reduce((summe, w) => summe + Math.min(...woerterAller(namen).map((h) => abstand(w, h, 3))), 0)
