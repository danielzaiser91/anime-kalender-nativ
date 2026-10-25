// Adresse im Hash: "#/woche" (diese Woche) oder "#/woche/JJJJ-Www". Teilbar, kein Neuladen beim Blättern.
import { istWochenschluessel } from '../logik/zeit.js'

export function leseHash(hash) {
  const teile = hash.replace(/^#\/?/, '').split('/')
  if (teile[0] === 'woche' && istWochenschluessel(teile[1] ?? '')) return { woche: teile[1] }
  return { woche: null }
}

export const hashFuerWoche = (woche) => `#/woche/${woche}`

export function beobachteHash(fenster, beiAenderung) {
  fenster.addEventListener('hashchange', () => beiAenderung(leseHash(fenster.location.hash)))
}
