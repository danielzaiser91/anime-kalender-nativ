// Kino und Stream eines Films in einem Kasten. Portiert aus web/src/components/detail/film-termine.ts der Hauptseite.
import { anbieterName } from './folge.js'
import { addiereTage } from './zeit.js'

const start = (p) => p.firstEpisodeDate
const nachStart = (a, b) => (start(a) ?? '').localeCompare(start(b) ?? '')

export const imKinoBanner = (p, heute) => p.platform === 'kino' && (start(p) ?? '') >= addiereTage(heute, -60)

export function filmTermine(titel, heute) {
  const kino = titel.plaene.filter((p) => p.platform === 'kino' && start(p) && !imKinoBanner(p, heute)).sort(nachStart)[0]
  const stream = titel.plaene.filter((p) => p.platform !== 'kino' && p.releaseType !== 'disc' && start(p)).sort(nachStart)[0]
  if (!kino && !stream) return null
  if (!stream && start(kino) < addiereTage(heute, -60)) return null
  return {
    art: 'filmDe',
    kino: kino ? { datum: start(kino), raus: start(kino) <= heute } : undefined,
    stream: stream ? { datum: start(stream), raus: start(stream) <= heute, anbieter: anbieterName(stream.platform, stream.sender) } : undefined,
    streamWege: titel.streams.length > 0 || titel.kaufwege.some((w) => w.kind === 'stream'),
    verleih: kino?.publisher,
  }
}
