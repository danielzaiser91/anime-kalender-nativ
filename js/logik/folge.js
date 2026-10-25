// Was unter einem Titel steht: Anbieter, Folge, Uhrzeit. Regeln wie in der Hauptseite (web/src/components/kalender/Marken.tsx).
const ANBIETER = {
  crunchyroll: 'Crunchyroll',
  netflix: 'Netflix',
  primevideo: 'Prime Video',
  disneyplus: 'Disney+',
  paramountplus: 'Paramount+',
  adn: 'ADN',
  aniverse: 'Aniverse',
  wow: 'WOW',
  joyn: 'Joyn',
  rtlplus: 'RTL+',
  kino: 'Kino',
  disc: 'DVD / Blu-ray',
  tv: 'TV',
}

export const anbieterName = (plattform, sender) => (plattform === 'tv' && sender) || ANBIETER[plattform] || plattform

/** Katalog-Release: die ganze Staffel an einem Tag. */
function katalogText(termin) {
  const vorsatz = termin.katalog === 'belegt' ? 'Alle' : 'Vermutlich alle'
  return `${vorsatz} ${termin.episodeCount} Folgen auf einmal`
}

/** Ein Film hat keine Folgen, eine TV-Sichtung zählt Sichtungen: beide ohne Angabe. */
const ohneFolge = (termin) => !termin.episode || termin.sichtung || termin.releaseType === 'movie'

function folgeText(termin) {
  if (ohneFolge(termin)) {
    const viele = termin.episodeCount > 1 && !termin.episode
    return viele ? `${termin.episodeCount} Folgen` : ''
  }
  // Im Fernsehen kennt die Quelle die Gesamtzahl nicht.
  const gesamt = termin.platform === 'tv' ? 0 : termin.episodeCount
  if (!gesamt) return `Folge ${termin.episode}`
  return `Folge ${termin.episode}/${termin.episodeCountAssumed ? '≈' : ''}${gesamt}`
}

export function folgeZeile(termin) {
  const teile = [anbieterName(termin.platform, termin.sender)]
  const rest = termin.katalog ? katalogText(termin) : folgeText(termin)
  if (rest) teile.push(rest)
  return teile.join(' · ')
}

/** Ohne Uhrzeit steht nichts; eine Disc ist "im Handel". Geschätztes trägt "≈". */
export function zeitText(termin) {
  if (!termin.time) return termin.releaseType === 'disc' ? 'im Handel' : ''
  return `${termin.timeEstimated || termin.estimated ? '≈ ' : ''}${termin.time}`
}

/** Auszeichnung eines Termins; Katalog schlägt Staffelstart, der das Finale. */
export function marke(termin) {
  if (termin.katalog) return termin.katalog === 'belegt' ? 'Katalog-Release' : 'Katalog-Release ≈'
  if (termin.staffelstart) return 'Staffelstart'
  if (termin.staffelfinale) return 'Staffelfinale'
  if (termin.imAngebot) return `Neu bei ${anbieterName(termin.platform, termin.sender)}`
  return ''
}
