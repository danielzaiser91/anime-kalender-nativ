// Der Satz zu einer Meldung (Wortlaut der Hauptseite: web/src/lib/news-text.ts, shared/takt-text.ts) und die Beschriftung der Art.
// Entsteht im Datenschritt: die Seite zeigt den fertigen Text und braucht den Code dazu nicht.
import { anbieterName } from '../../js/logik/folge.js'
import { monatsName, wochentagName } from '../../js/logik/wochentext.js'

export const ART_NAMEN = {
  neu: 'Neu auf Deutsch',
  folgen: 'Neue Folgen',
  angekuendigt: 'Angekündigt',
  disc: 'Auf Disc',
  kino: 'Im Kino',
  verspaetet: 'Nicht erschienen',
  nachgereicht: 'Verspätet erschienen',
  nachgetragen: 'Rückwirkend eingetragen',
  rhythmus: 'Rhythmus',
  takt: 'Takt',
  offiziell: 'Offizielle Website',
}

const OFFIZIELL = {
  staffel: 'Weitere Staffel bestätigt',
  film: 'Film angekündigt',
  synchro: 'Hinweis zur Synchronfassung',
  termin: 'Start- oder Sendetermin genannt',
}

/** Ein Tag "JJJJ-MM-TT" als "TT.MM.JJJJ"; ein Monat "JJJJ-MM" als "Oktober 2026". Nur die ersten zehn Zeichen zählen (voller Zeitstempel). */
export function datumKurz(iso) {
  if (iso.length === 7) return monatsName(iso)
  return iso.slice(0, 10).split('-').reverse().join('.')
}

const uhrzeitKurz = (zeit) => (zeit.endsWith(':00') ? `${Number(zeit.slice(0, 2))} Uhr` : `${zeit} Uhr`)
const wort = (angekuendigt) => (angekuendigt ? 'angekündigt' : 'erwartet')
const startText = (omuAb) => `${omuAb.length === 7 ? 'im' : 'am'} ${datumKurz(omuAb)}`

export function anbieterDerMeldung(m) {
  const name = m.platform ? anbieterName(m.platform) : (m.anbieter ?? '')
  return m.kanal ? `${name} (${m.kanal})` : name
}

/** Ältere Quelle: der Eintrag steht an seinem Tag, die Quelle nennt ihr früheres Datum dazu. */
function lautQuelle(m, am) {
  if (!['angekuendigt', 'disc', 'kino'].includes(m.art)) return ''
  const frueh = (m.belege ?? []).filter((b) => b.veroeffentlichtAm && b.veroeffentlichtAm < am).sort((a, b) => a.veroeffentlichtAm.localeCompare(b.veroeffentlichtAm))[0]
  return frueh ? ` — laut ${frueh.name} vom ${datumKurz(frueh.veroeffentlichtAm)}` : ''
}

function neuSatz({ m, anbieter }) {
  if (m.jahre && anbieter) return `Nach ${m.jahre} Jahren endlich ${m.discSeitText ? 'im Stream ' : ''}auf Deutsch${m.discSeitText ? ' bei ' : ': jetzt mit Synchro bei '}${anbieter}!${m.discSeitText ? ` (Auf Disc gibt es die Synchro seit ${m.discSeitText})` : ''}`
  if (m.weiterer) return `Jetzt auch auf Deutsch bei ${anbieter}`
  return anbieter ? `Erstmals mit deutscher Synchro bei ${anbieter}` : 'Erstmals mit deutscher Synchro'
}

function folgenSatz({ m, anbieter }) {
  return m.von === m.bis || m.bis === undefined ? `Folge ${m.von ?? ''} auf Deutsch bei ${anbieter}` : `Folgen ${m.von ?? ''}–${m.bis} auf Deutsch bei ${anbieter}`
}

function angekuendigtSatz({ m, anbieter, datum, am }) {
  const quelle = lautQuelle(m, am)
  if (m.omu) return `Start ${startText(m.datum ?? '')} bei ${anbieter} mit Untertiteln, ${m.omu === 'synchro-angekuendigt' ? '' : 'keine '}deutsche Synchro angekündigt${quelle}`
  if (m.platform === 'tv' && m.datum) return `${m.premiere ? 'Deutsche TV-Premiere' : 'Im TV'}${m.anbieter ? ` bei ${m.anbieter}` : ''} am ${wochentagName(m.datum)}, den ${datum}${quelle}`
  if (m.schonKaufbar) return `Ab ${datum} im Abo bei ${anbieter}!${quelle}`
  if (m.jahre && anbieter) return `Nach ${m.jahre} Jahren endlich ${m.discSeitText ? 'im Stream ' : ''}auf Deutsch: ab ${datum} ${m.discSeitText ? '' : 'mit Synchro '}bei ${anbieter}!${m.discSeitText ? ` (Auf Disc gibt es die Synchro seit ${m.discSeitText})` : ''}${quelle}`
  return `Start am ${datum} bei ${anbieter}${quelle}`
}

const folgenProWoche = ([von, bis]) => (von === bis ? String(von) : `${von}–${bis}`)
const ZAHLWORT = { 2: 'Zwei', 3: 'Drei', 4: 'Vier' }
const folgenText = (m) => (m.bis !== undefined && m.bis !== m.von ? `Folgen ${m.von}–${m.bis}` : `Folge ${m.von}`)

function taktSatz(m) {
  if (m.takt === 'pause') return `Nach ${Math.round((m.abstand ?? 0) / 7)} Wochen Pause wieder neue Folgen: ${folgenText(m)}`
  if (m.takt === 'doppelt') {
    const n = m.anzahl ?? 2
    return `${ZAHLWORT[n] ?? n} Folgen auf einmal: ${n === 2 ? `${m.von} und ${m.bis}` : `${m.von}–${m.bis}`}`
  }
  return `Folge ${m.von} ist schon da — ${m.abstand === 1 ? 'einen Tag' : `${m.abstand} Tage`} nach Folge ${(m.von ?? 1) - 1}`
}

const aufzaehlen = (teile) => (teile.length > 1 ? `${teile.slice(0, -1).join(', ')} und ${teile.at(-1)}` : (teile[0] ?? ''))

function nachgereichtSatz({ m }) {
  const erwartet = aufzaehlen((m.erwartet ?? []).map((d) => (m.erwartet.length > 1 ? datumKurz(d).slice(0, 6) : datumKurz(d))))
  const p = m.planmaessig
  const mehrere = m.bis !== undefined && m.bis !== m.von
  const plan = p?.length ? (p.length > 1 ? `den geplanten Folgen ${p[0]}–${p.at(-1)}` : `der geplanten Folge ${p[0]}`) : ''
  const folgen = mehrere ? `Folgen ${m.von}–${m.bis} sind` : `Folge ${m.von} ist`
  if (plan) return `${folgen} verspätet zusammen mit ${plan} erschienen, ${wort(m.angekuendigtBelegt)} ${mehrere ? 'waren' : 'war der'} ${erwartet}`
  return mehrere ? `${folgen} da, ${wort(m.angekuendigtBelegt)} waren ${erwartet}` : `${folgen} da, ${wort(m.angekuendigtBelegt)} war der ${erwartet}`
}

function nachgetragenSatz({ m, anbieter, datum }) {
  const wann = m.zeit && m.datum ? `${wochentagName(m.datum)}, ${datum}, um ${uhrzeitKurz(m.zeit)}` : datum
  return `Folge ${m.von ?? 1} erschien am ${wann} bei ${anbieter} mit deutscher Synchro`
}

const SAETZE = {
  neu: neuSatz,
  folgen: folgenSatz,
  angekuendigt: angekuendigtSatz,
  rhythmus: ({ m, anbieter, datum }) => `Bis ${datum} wöchentlich ${folgenProWoche(m.proWoche ?? [0, 0])} neue Folgen bei ${anbieter}`,
  takt: ({ m }) => taktSatz(m),
  offiziell: ({ m }) => OFFIZIELL[m.kategorie ?? 'termin'],
  disc: ({ m, datum, am }) => `${m.ausgabe ? `${m.ausgabe} erscheint` : 'Erscheint'} am ${datum} auf Disc${lautQuelle(m, am)}`,
  kino: ({ m, datum, am }) => `Kinostart am ${datum}${lautQuelle(m, am)}`,
  verspaetet: ({ m, datum }) => `Folge ${m.von ?? ''} war für den ${datum} ${wort(m.angekuendigtBelegt)} und ist nicht erschienen`,
  nachgetragen: nachgetragenSatz,
  nachgereicht: nachgereichtSatz,
}

/** Der ausführliche Satz einer Meldung; `am` ist der Tag des Eintrags. */
export function newsSatz(m, am) {
  return SAETZE[m.art]({ m, am, anbieter: anbieterDerMeldung(m), datum: m.datum ? datumKurz(m.datum) : '' })
}
