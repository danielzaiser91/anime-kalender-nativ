// Adresse im Hash, teilbar, kein Neuladen beim Blättern: "#/woche", "#/woche/JJJJ-Www", dazu "/t/<Kennung>" für das Panel eines Titels
// ("#/woche/2026-W45/t/1572", kurz "#/t/1572" über der gerade gezeigten Ansicht).
import { istWochenschluessel } from '../logik/zeit.js'

const KENNUNG = /^\d+$/
const GUELTIG = { woche: istWochenschluessel }

export function leseHash(hash) {
  const teile = hash.replace(/^#\/?/, '').split('/')
  const art = Object.hasOwn(GUELTIG, teile[0]) ? teile[0] : null
  if (!art && teile[0] !== 't') return { art: null, schluessel: null, titel: null }
  const mitSchluessel = art && GUELTIG[art](teile[1] ?? '')
  const stelle = art ? (mitSchluessel ? 2 : 1) : 0
  const titel = teile[stelle] === 't' && KENNUNG.test(teile[stelle + 1] ?? '') ? teile[stelle + 1] : null
  return { art, schluessel: mitSchluessel ? teile[1] : null, titel }
}

export const hashFuerOrt = (ort) => `#/${ort.art}/${ort.schluessel}`

export const hashFuerTitel = (ort, ak) => `${hashFuerOrt(ort)}/t/${ak}`

export function beobachteHash(fenster, beiAenderung) {
  fenster.addEventListener('hashchange', () => beiAenderung(leseHash(fenster.location.hash)))
}
