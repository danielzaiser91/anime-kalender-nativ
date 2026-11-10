// Adresse im Hash, teilbar, kein Neuladen beim Blättern: "#/woche", "#/woche/JJJJ-Www", "#/monat", "#/monat/JJJJ-MM", dazu "/t/<Kennung>"
// für das Panel eines Titels ("#/woche/2026-W45/t/1572", kurz "#/t/1572" über der gerade gezeigten Ansicht).
// Die Suche trägt Suchbegriff und Filter als Abfrage: "#/suche?q=naruto&g=Action", mit Panel "#/suche/t/1572?q=naruto".
import { istWochenschluessel } from '../logik/zeit.js'
import { istMonatsschluessel } from '../logik/monat.js'

const KENNUNG = /^\d+$/
const GUELTIG = { woche: istWochenschluessel, monat: istMonatsschluessel, suche: () => false }

export function leseHash(hash) {
  const [pfad, abfrage = ''] = hash.replace(/^#\/?/, '').split('?')
  const teile = pfad.split('/')
  const art = Object.hasOwn(GUELTIG, teile[0]) ? teile[0] : null
  if (!art && teile[0] !== 't') return { art: null, schluessel: null, titel: null }
  const mitSchluessel = art && GUELTIG[art](teile[1] ?? '')
  const stelle = art ? (mitSchluessel ? 2 : 1) : 0
  const titel = teile[stelle] === 't' && KENNUNG.test(teile[stelle + 1] ?? '') ? teile[stelle + 1] : null
  return { art, schluessel: art === 'suche' ? abfrage : mitSchluessel ? teile[1] : null, titel }
}

const sucheHash = (abfrage, titel) => `#/suche${titel ? `/t/${titel}` : ''}${abfrage ? `?${abfrage}` : ''}`

export const hashFuerOrt = (ort) => (ort.art === 'suche' ? sucheHash(ort.schluessel) : `#/${ort.art}/${ort.schluessel}`)

export const hashFuerTitel = (ort, ak) => (ort.art === 'suche' ? sucheHash(ort.schluessel, ak) : `${hashFuerOrt(ort)}/t/${ak}`)

export function beobachteHash(fenster, beiAenderung) {
  fenster.addEventListener('hashchange', () => beiAenderung(leseHash(fenster.location.hash)))
}
