// Die vier Anime-Saisons Japans (Hauptseite: shared/saison.ts). Die Namen sind die von AniList. Rein, ohne DOM.
export const FOLGE = ['WINTER', 'SPRING', 'SUMMER', 'FALL']
const NAMEN = { WINTER: 'Winter', SPRING: 'Frühling', SUMMER: 'Sommer', FALL: 'Herbst' }

/** Die Saison eines Datums "JJJJ-MM-TT": Januar bis März Winter, April bis Juni Frühling, Juli bis September Sommer, Rest Herbst. */
export function saisonVon(datum) {
  const monat = Number(datum.slice(5, 7))
  return { jahr: Number(datum.slice(0, 4)), saison: FOLGE[Math.min(3, Math.floor((monat - 1) / 3))] }
}

/** Die Saison davor (-1) oder danach (+1). */
export function versetzt(s, schritt) {
  const nr = FOLGE.indexOf(s.saison) + schritt
  if (nr < 0) return { jahr: s.jahr - 1, saison: 'FALL' }
  return nr > 3 ? { jahr: s.jahr + 1, saison: 'WINTER' } : { jahr: s.jahr, saison: FOLGE[nr] }
}

export const saisonText = (s) => `${NAMEN[s.saison]} ${s.jahr}`

/** Erster und letzter Tag der Saison als "JJJJ-MM-TT". */
export function saisonZeitraum(s) {
  const von = FOLGE.indexOf(s.saison) * 3 + 1
  const tag = (monat) => String(monat).padStart(2, '0')
  return [`${s.jahr}-${tag(von)}-01`, `${s.jahr}-${tag(von + 2)}-31`]
}

/** Fernseh- und Web-Serien; Filme, OVAs und Specials gehören nicht in den Saison-Überblick. */
export const istSerie = (format) => format === 'TV' || format === 'ONA'
