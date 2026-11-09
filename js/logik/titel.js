// Titelbausteine: in welcher Datei ein Titel liegt und wie er heißt. Regeln wie shared/titles.ts der Hauptseite.
export const GRUPPEN = 64

export const gruppeVonAk = (ak) => Number(ak) % GRUPPEN

const STAFFEL = [
  [/\bThe Final Season\b/gi, 'Die finale Staffel'],
  [/\bFinal Season\b/gi, 'Finale Staffel'],
  [/\bSeasons\s+(\d+)\s*(?:&|and|\+|–|-)\s*(\d+)/gi, 'Staffeln $1 & $2'],
  [/\b(\d+)(?:st|nd|rd|th)\s+Season\b/gi, 'Staffel $1'],
  [/\bSeason\s+(\d+)\b/gi, 'Staffel $1'],
  [/\bPart\.?\s*(\d+)\b/gi, 'Teil $1'],
  [/\bCour\s+(\d+)\b/gi, 'Teil $1'],
  [/\b(Staffel\s+\d+)\s*[-–—]?\s+(Teil\s+\d+)/gi, '$1 - $2'],
  [/\s{2,}/g, ' '],
]

export const eindeutschenStaffel = (name) => STAFFEL.reduce((text, [muster, ersatz]) => text.replace(muster, ersatz), name).trim()

export const anzeigeName = (titel) => eindeutschenStaffel(titel.titleDe ?? titel.titleEn ?? titel.titleRomaji ?? `#${titel.id}`)
