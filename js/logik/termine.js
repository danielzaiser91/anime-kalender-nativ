// Die Termine (Kommendes zuerst, dann zuletzt Erschienenes, Zeilen wie die Wochenansicht) und die Eckdaten eines Titels fürs Panel.
import { istErschienen } from './erschienen.js'
import { folgeZeile, marke, zeitText } from './folge.js'
import { datumKurz, wochentagName } from './wochentext.js'

const KOMMEND = 12
const VORBEI = 5

const nachZeit = (a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '') || (a.episode ?? 0) - (b.episode ?? 0)

function zeile(termin) {
  return { datum: `${wochentagName(termin.date).slice(0, 2)}., ${datumKurz(termin.date)}`, zeit: zeitText(termin), text: folgeZeile(termin), marke: marke(termin) }
}

export function terminListe(titel, jetzt) {
  const sortiert = [...titel.termine].sort(nachZeit)
  const vorbei = sortiert.filter((e) => istErschienen(e, jetzt))
  const kommend = sortiert.filter((e) => !istErschienen(e, jetzt))
  return {
    kommend: kommend.slice(0, KOMMEND).map(zeile),
    mehrKommend: Math.max(0, kommend.length - KOMMEND),
    vorbei: vorbei.slice(-VORBEI).reverse().map(zeile),
    mehrVorbei: Math.max(0, vorbei.length - VORBEI),
  }
}

const FORMAT = { TV: 'Serie', MOVIE: 'Film', OVA: 'OVA', SPECIAL: 'Special', TV_SHORT: 'Kurzserie', ONA: 'Web-Serie', MUSIC: 'Musik' }

const japanText = (titel) => (titel.jpYear ? String(titel.jpYear) : '')

const fskText = (fsk) => (fsk === 0 ? 'FSK 0' : fsk ? `FSK ${fsk}` : '')

export function eckdaten(titel) {
  const zeilen = [
    ['Format', FORMAT[titel.format] ?? titel.format],
    ['Folgen', titel.episodes ? String(titel.episodes) : ''],
    ['Japan', japanText(titel)],
    ['Laufzeit', titel.runtimeMin ? `${titel.runtimeMin} Min. je Folge` : ''],
    ['Altersfreigabe', fskText(titel.fsk)],
    ['Studio', (titel.studios ?? []).join(', ')],
    ['Genres', (titel.genres ?? []).join(', ')],
  ]
  return zeilen.filter(([, wert]) => wert)
}
