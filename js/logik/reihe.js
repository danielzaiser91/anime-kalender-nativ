// Reihenliste im Panel (Hauptseite: shared/titles.ts, reihen-gruppen.ts, reihen-teil.ts): Teile in Gruppen ordnen, Namen kürzen, Angaben zeilenweise.
import { eindeutschenStaffel } from './titel.js'
import { kuenftig } from './start.js'

export const FORMAT_DE = { TV: 'TV', TV_SHORT: 'TV-Kurzformat', MOVIE: 'Film', SPECIAL: 'Special', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Musikvideo' }

const istStaffel = (format) => format === 'TV' || format === 'TV_SHORT' || format === 'ONA'

/** AniList führt Werbung als eigene ONA oder Special („… PV“, „… CM“, Trailer); die Kürzel nur groß, „5 cm“ ist keine Werbung. */
const WERBE_KUERZEL = /\b(?:PV|CM)\b/
const WERBE_WORT = /\b(?:trailer|teaser|promo|promotion|commercial)\b|opening movie/i
export const istWerbeEintrag = (m) => WERBE_KUERZEL.test(m.name) || WERBE_WORT.test(m.name)

const woerterVon = (name) => ` ${name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(' ')} `

/** Hauptstaffeln: Fernsehstaffeln, Streaming-Staffeln ab zehn Folgen und ein kurzes ONA, das wie eine solche anfängt. */
function hauptstaffelnAller(teile) {
  if (!teile.some((m) => m.format === 'TV')) return teile.filter((m) => istStaffel(m.format) && !m.beiwerk && !istWerbeEintrag(m))
  const lange = teile.filter((m) => m.format === 'ONA' && !m.beiwerk && (m.episodes ?? 0) >= 10)
  const langeWoerter = lange.map((m) => woerterVon(m.name))
  return teile.filter((m) => {
    if (m.format === 'TV' || lange.includes(m)) return true
    if (m.format !== 'ONA' || m.beiwerk) return false
    const eigene = woerterVon(m.name)
    return eigene.trim().includes(' ') && langeWoerter.some((l) => l !== eigene && l.startsWith(eigene))
  })
}

export const hauptstaffeln = (teile) => hauptstaffelnAller(teile.filter((m) => !m.eigenesWerk))

/** Neuverfilmungen beginnen eine neue Zählung: die Teile vor der ersten, zwischen den Wurzeln, nach der letzten. */
function zaehlgruppen(teile) {
  const zeit = (m) => m.jpStart ?? String(m.jpYear ?? 9999)
  const wurzeln = teile.filter((m) => m.remakeVon !== undefined).sort((a, b) => zeit(a).localeCompare(zeit(b)))
  if (!wurzeln.length) return [teile]
  const gruppen = [[], ...wurzeln.map(() => [])]
  for (const m of teile) gruppen[wurzeln.filter((w) => zeit(w).localeCompare(zeit(m)) <= 0).length].push(m)
  return gruppen.filter((g) => g.length > 0)
}

/** Gruppen der Liste: Hauptserie, Neuverfilmung, eigene Serien, Filme, Specials & OVAs; leere entfallen. */
export function reihenGruppen(teile) {
  const haupt = new Set(hauptstaffeln(teile))
  const eigen = (m) => Boolean(m.eigenesWerk)
  const [erste = [], ...neu] = zaehlgruppen(teile.filter((m) => haupt.has(m)))
  return [
    { titel: 'Hauptserie', teile: erste },
    ...neu.map((g) => ({ titel: 'Neuverfilmung', teile: g })),
    { titel: 'Eigene Serien', teile: teile.filter(eigen) },
    { titel: 'Filme', teile: teile.filter((m) => !eigen(m) && m.format === 'MOVIE') },
    { titel: 'Specials & OVAs', teile: teile.filter((m) => !haupt.has(m) && !eigen(m) && m.format !== 'MOVIE') },
  ].filter((g) => g.teile.length > 0)
}

/** Name der Reihe: der erste Teil der Hauptserie, ohne „Staffel 1“. */
export function reihenName(teile) {
  const vorn = hauptstaffeln(teile)[0] ?? teile.find((m) => !istWerbeEintrag(m)) ?? teile[0]
  return eindeutschenStaffel(vorn.name).replace(/\s*[–—-]?\s*\(?(Staffel|Season)\s*1\)?\s*$/i, '').trim()
}

const nichtssagend = (rest) => rest !== '' && !/[\p{L}()]/u.test(rest)

/** Der Name eines Teils ohne den Reihennamen davor; bleibt nichts Sinnvolles, der volle Name. */
export function teilName(m, { name, haupt }) {
  const voll = eindeutschenStaffel(m.name)
  let rest = voll.toLowerCase().startsWith(name.toLowerCase()) ? voll.slice(name.length).replace(/^[\s:–—-]+/, '').trim() : voll
  const staffel = /(?:^|\s)(Staffel\s+\d+(?:\s*[-–—]?\s*Teil\s+\d+)?)\s*$/i.exec(rest)
  if (haupt && staffel && rest === voll && rest !== staffel[1]) rest = staffel[1]
  return rest && !nichtssagend(rest) ? rest : voll
}

function abDatum(start) {
  const [jahr, monat, tag] = start.split('-')
  return tag ? `ab ${tag}.${monat}.${jahr}` : monat ? `ab ${monat}.${jahr}` : `ab ${jahr}`
}

/** „Film · 2001 · 26 Fg.“: Format (außer TV), Jahr oder „ab Datum“ bei Kommendem, Folgenzahl ab zwei. */
export function angabenZeile(m, heute) {
  const offen = kuenftig(m, heute)
  const termin = offen && m.deStart ? abDatum(m.deStart) : m.jpYear ? String(m.jpYear) : m.deStart ? m.deStart.slice(0, 4) : ''
  return [m.format && m.format !== 'TV' ? (FORMAT_DE[m.format] ?? m.format) : '', termin, m.episodes > 1 ? `${m.episodes} Fg.` : ''].filter(Boolean).join(' · ')
}

const zahlText = (n, einzahl, mehrzahl) => (n === 1 ? einzahl : `${n} ${mehrzahl}`)

/** „1 Staffel · 1 Film · 2 Specials“ — nur Gruppen, die es gibt. */
export function reihenZeile(teile) {
  const haupt = new Set(hauptstaffeln(teile))
  const eigene = teile.filter((m) => m.eigenesWerk).length
  const filme = teile.filter((m) => m.format === 'MOVIE').length
  const specials = teile.filter((m) => !haupt.has(m) && !m.eigenesWerk && m.format !== 'MOVIE').length
  return [
    haupt.size ? zahlText(haupt.size, '1 Staffel', 'Staffeln') : '',
    eigene ? zahlText(eigene, '1 eigene Serie', 'eigene Serien') : '',
    filme ? zahlText(filme, '1 Film', 'Filme') : '',
    specials ? zahlText(specials, '1 Special', 'Specials') : '',
  ].filter(Boolean).join(' · ')
}
