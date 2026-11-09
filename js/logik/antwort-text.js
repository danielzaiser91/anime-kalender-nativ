// Die Worte des Antwort-Kastens zu einer Antwort (antwort.js). Texte wie web/src/lib/i18n*.ts der Hauptseite.
import { datumKurz, wochentagName } from './wochentext.js'
import { diffTage } from './zeit.js'

const ungefaehr = (wert, geschaetzt) => (geschaetzt ? `≈ ${wert}` : String(wert))
const folgen = (n) => `${n} ${String(n).replace('≈ ', '') === '1' ? 'Folge' : 'Folgen'}`

export function abstandImSatz(heute, datum) {
  const tage = diffTage(heute, datum)
  if (tage <= 0) return 'heute'
  if (tage === 1) return 'morgen'
  if (tage < 7) return `in ${tage} Tagen`
  if (tage < 31.5) return Math.floor(tage / 7) === 1 ? 'in einer Woche' : `in ${Math.floor(tage / 7)} Wochen`
  if (tage < 365) return Math.floor(tage / 30.44) <= 1 ? 'in einem Monat' : `in ${Math.floor(tage / 30.44)} Monaten`
  return Math.floor(tage / 365) === 1 ? 'in einem Jahr' : `in ${Math.floor(tage / 365)} Jahren`
}

const WAS = { erste: 'Erste', naechste: 'Nächste', finale: 'Finale' }

function folgenKopf(a) {
  const e = a.haupt
  if (a.komplett) return a.gesamt ?? e.episodeCount ? `Alle ${a.gesamt ?? e.episodeCount} Folgen` : 'Alle Folgen'
  const imBlock = a.blockBis ? a.blockBis - (e.episode ?? 0) + 1 : 1
  const was = a.offenesEnde ? (!a.sichtung && e.episode === 1 ? 'erste' : 'naechste') : a.raus === 0 ? 'erste' : a.gesamtGeschaetzt ? 'naechste' : a.rest === imBlock ? 'finale' : 'naechste'
  if (!e.episode || a.sichtung) return `${WAS[was]} Folge`
  return a.blockBis ? `${WAS[was]} Folgen (${e.episode}–${a.blockBis})` : `${WAS[was]} Folge (Folge ${e.episode})`
}

function terminSatz(a, heute) {
  const e = a.haupt
  const rel = abstandImSatz(heute, e.date)
  const verb = a.blockBis !== undefined ? 'erscheinen' : 'erscheint'
  const tag = `${wochentagName(e.date)} den ${datumKurz(e.date)}`
  const satz = a.komplett ? `im Angebot ${rel}, am ${tag}.` : `${verb} ${rel}, am ${tag}.`
  return e.time ? `${satz.replace(/\.$/, '')}, voraussichtlich um ${e.timeEstimated ? '≈ ' : ''}${e.time} Uhr.` : satz
}

function laeuftNeben(a) {
  const blockIstEnde = a.blockBis !== undefined && a.rest === a.blockBis - (a.haupt.episode ?? 0) + 1
  const nochFolgen = a.letzter && a.rest > 1 && !a.offenesEnde ? `noch ${ungefaehr(a.rest, a.gesamtGeschaetzt)} Folgen bis zum Finale am ${ungefaehr(datumKurz(a.letzter), a.gesamtGeschaetzt)}` : null
  const takt = a.offenesEnde || a.komplett ? null : 'Wöchentlich'
  const letzte = a.raus === 0 && !a.offenesEnde && !a.komplett ? 'letzte Folge' : null
  return [takt, blockIstEnde ? null : (nochFolgen ?? letzte)].filter(Boolean).join(' · ')
}

function laeuft(a, heute) {
  const zaehl = a.gesamt ? { raus: a.raus, rest: `von ${ungefaehr(a.gesamt, a.gesamtGeschaetzt)} Folgen erschienen` } : null
  return { haupt: folgenKopf(a), satz: terminSatz(a, heute), neben: laeuftNeben(a), zaehl }
}

function fertig(a) {
  const haupt = a.heuteOffen && a.gesamt > 1 ? `Alle ${a.gesamt} Folgen heute, Uhrzeit offen` : a.gesamt > 1 ? (a.gesamtAbgeleitet ? `Auf Deutsch, ${ungefaehr(a.gesamt, true)} Folgen` : `Alle ${a.gesamt} Folgen auf Deutsch`) : 'Auf Deutsch verfügbar'
  return { haupt, neben: '' }
}

function teilweise(a) {
  const haupt = a.raus === undefined ? 'Teilweise auf Deutsch — die Synchro wurde abgebrochen' : a.gesamtBelegt ? `${a.raus} von ${a.gesamt} Folgen auf Deutsch` : `${folgen(a.raus)} auf Deutsch`
  return { haupt, neben: a.restBelegt ? '' : 'Übrige Folgen: nicht auf Deutsch belegt' }
}

const satz = (t, was) => `${t.raus ? 'Seit' : 'Ab'} ${datumKurz(t.datum)} ${was}`

// Kino und Stream eines Films: der nächste Termin zuerst (liegen beide zurück, der jüngere), der andere daneben.
function filmDe({ kino, stream, streamWege }) {
  if (kino && stream && kino.datum === stream.datum) return { haupt: satz(kino, `im Kino und bei ${stream.anbieter}`), neben: '' }
  const k = kino && satz(kino, 'im Kino')
  const s = stream && satz(stream, `bei ${stream.anbieter}`)
  const streamZuerst = stream && (!kino || (kino.raus && !stream.raus) || (kino.raus === stream.raus && (kino.raus ? stream.datum > kino.datum : stream.datum < kino.datum)))
  return streamZuerst ? { haupt: s, neben: k ?? '' } : { haupt: k ?? '', neben: s ?? (streamWege ? '' : 'Streamstart noch nicht bekannt') }
}

const film = (a) => ({ haupt: a.hatSynchro ? 'Auf Deutsch verfügbar' : 'Noch keine deutsche Fassung', neben: !a.hatSynchro && a.ohneWeg ? 'Kein deutscher Anbieter führt ihn bisher' : '' })

const disc = (a) => ({ haupt: `Kaufausgabe ab ${datumKurz(a.datum)}`, neben: 'Kaufausgabe — erscheint an einem Tag komplett' })

export function kastenText(antwort, heute) {
  if (antwort.art === 'laeuft') return laeuft(antwort, heute)
  if (antwort.art === 'fertig') return fertig(antwort)
  if (antwort.art === 'teilweise') return teilweise(antwort)
  if (antwort.art === 'filmDe') return filmDe(antwort)
  if (antwort.art === 'film') return film(antwort)
  if (antwort.art === 'disc') return disc(antwort)
  return { haupt: 'Noch keine deutsche Fassung', neben: '' }
}
