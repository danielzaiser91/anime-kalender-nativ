// Handlung je Titel, gewählt wie auf der Hauptseite (plot.ts, ersatz-handlung.ts): deutsch, sonst englisch (AniList), sonst die Handlung des letzten früheren Teils der Reihe.
const KURZ = 100
const ANISEARCH = { name: 'anisearch.de', url: 'https://www.anisearch.de/' }
const LIZENZ_SEITEN = { 'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/deed.de' }
const istStaffel = (format) => format === 'TV' || format === 'TV_SHORT' || format === 'ONA'

/** Ein Text, der mehr ist als ein Platzhalter wie „Sequel to …“ (unter 100 Zeichen, nur englisch). */
export const aussagekraeftig = (s) => Boolean(s?.de || (s?.en && s.en.trim().length >= KURZ))

/** Der letzte frühere Teil mit Handlung; eine Staffel schlägt einen Film, auch einen neueren. */
function ersatzTeil(titel, teile, handlungen) {
  const vorher = teile
    .filter((m) => m.id !== titel.id && (m.jpYear ?? 9999) <= (titel.jpYear ?? 9999))
    .sort((a, b) => Number(istStaffel(b.format)) - Number(istStaffel(a.format)) || (b.jpYear ?? 0) - (a.jpYear ?? 0) || b.id - a.id)
  return vorher.find((m) => aussagekraeftig(handlungen.get(m.id)))
}

const anilist = (id) => ({ name: 'anilist.co', url: id ? `https://anilist.co/anime/${id}` : 'https://anilist.co/' })

function ausText(s, anilistId) {
  if (s.de) return { text: s.de, quelle: s.deSource ?? ANISEARCH, ...(s.eigen && { eigen: { ...s.eigen, lizenzSeite: LIZENZ_SEITEN[s.eigen.lizenz] } }) }
  return { text: s.en, fallback: 1, quelle: anilist(anilistId) }
}

/** `{ text, quelle, fallback?, eigen?, von? }` oder `null`, wenn es keine Handlung gibt. */
export function baueHandlung(titel, handlungen, teile) {
  const eigene = handlungen.get(titel.id)
  if (eigene?.de || eigene?.en) return ausText(eigene, titel.id)
  const teil = ersatzTeil(titel, teile, handlungen)
  return teil ? { ...ausText(handlungen.get(teil.id), teil.id), von: teil.name } : null
}
