// Cover als Vorschau (Reihenliste, ähnliche Titel): TMDB in 185 px, AniList als `medium` statt `large`/`extraLarge` (bis 550 KB als PNG).
import { kleinesCover } from './wochen.js'

export const vorschauCover = (url) => kleinesCover(typeof url === 'string' ? url.replace(/\/cover\/(?:large|extraLarge)\//, '/cover/medium/') : url)
