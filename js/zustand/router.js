// Adresse im Hash, teilbar, kein Neuladen beim Blättern: "#/woche", "#/woche/JJJJ-Www", "#/monat", "#/monat/JJJJ-MM", dazu "/t/<Kennung>"
// für das Panel eines Titels ("#/woche/2026-W45/t/1572", kurz "#/t/1572" über der gerade gezeigten Ansicht).
// Suche, News, Saison und Abo tragen ihre Wahl als Abfrage: "#/suche?q=naruto&g=Action", "#/news?art=neu", mit Panel "#/suche/t/1572?q=naruto".
import { istWochenschluessel } from '../logik/zeit.js'
import { istMonatsschluessel } from '../logik/monat.js'

const KENNUNG = /^\d+$/
const GUELTIG = { woche: istWochenschluessel, monat: istMonatsschluessel, suche: () => false, news: () => false, saison: () => false, abo: () => false }
const ABFRAGE_ARTEN = ['suche', 'news', 'saison', 'abo']

/** Ansichten ohne Zeitschlüssel: ihr "Schlüssel" ist die Abfrage der Adresse. */
export const mitAbfrage = (art) => ABFRAGE_ARTEN.includes(art)

export function leseHash(hash) {
  const [pfad, abfrage = ''] = hash.replace(/^#\/?/, '').split('?')
  const teile = pfad.split('/')
  const art = Object.hasOwn(GUELTIG, teile[0]) ? teile[0] : null
  if (!art && teile[0] !== 't') return { art: null, schluessel: null, titel: null }
  const mitSchluessel = art && GUELTIG[art](teile[1] ?? '')
  const stelle = art ? (mitSchluessel ? 2 : 1) : 0
  const titel = teile[stelle] === 't' && KENNUNG.test(teile[stelle + 1] ?? '') ? teile[stelle + 1] : null
  return { art, schluessel: mitAbfrage(art) ? abfrage : mitSchluessel ? teile[1] : null, titel }
}

const abfrageHash = (art, abfrage, titel) => `#/${art}${titel ? `/t/${titel}` : ''}${abfrage ? `?${abfrage}` : ''}`

export const hashFuerOrt = (ort) => (mitAbfrage(ort.art) ? abfrageHash(ort.art, ort.schluessel) : `#/${ort.art}/${ort.schluessel}`)

export const hashFuerTitel = (ort, ak) => (mitAbfrage(ort.art) ? abfrageHash(ort.art, ort.schluessel, ak) : `${hashFuerOrt(ort)}/t/${ak}`)

export function beobachteHash(fenster, beiAenderung) {
  fenster.addEventListener('hashchange', () => beiAenderung(leseHash(fenster.location.hash)))
}
