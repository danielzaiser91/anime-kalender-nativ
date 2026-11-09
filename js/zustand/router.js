// Adresse im Hash, teilbar, kein Neuladen beim Blättern: "#/woche", "#/woche/JJJJ-Www", dazu "/t/<Kennung>" für das Panel eines Titels
// ("#/woche/2026-W45/t/1572", kurz "#/t/1572" über der gerade gezeigten Woche).
import { istWochenschluessel } from '../logik/zeit.js'

const KENNUNG = /^\d+$/

export function leseHash(hash) {
  const teile = hash.replace(/^#\/?/, '').split('/')
  let woche = null
  let stelle = 0
  if (teile[0] === 'woche') {
    stelle = 1
    if (istWochenschluessel(teile[1] ?? '')) {
      woche = teile[1]
      stelle = 2
    }
  } else if (teile[0] !== 't') {
    return { woche: null, titel: null }
  }
  const titel = teile[stelle] === 't' && KENNUNG.test(teile[stelle + 1] ?? '') ? teile[stelle + 1] : null
  return { woche, titel }
}

export const hashFuerWoche = (woche) => `#/woche/${woche}`

export const hashFuerTitel = (woche, ak) => `#/woche/${woche}/t/${ak}`

export function beobachteHash(fenster, beiAenderung) {
  fenster.addEventListener('hashchange', () => beiAenderung(leseHash(fenster.location.hash)))
}
