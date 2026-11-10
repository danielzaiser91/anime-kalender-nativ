// Deutsche Sprechrollen (Baustein, lazy): zugeklappt, erst das Öffnen holt die Datei. Die Quellenzeile nennt, woher die Rollen stammen; bei ANN samt Link (Auflage der Quelle).
import { h } from '../dom.js'
import { aufklapper, hinweis } from './aufklapper.js'

/** Herkunft der Rollen: aniSearch, wo `von` es sagt; AniList, wo es fehlt; ANN mit Link. */
function quellenZeile(daten) {
  const namen = [daten.rollen.some((r) => r[2] === 'anisearch') && 'aniSearch', daten.rollen.some((r) => !r[2]) && 'AniList'].filter(Boolean)
  const ann = daten.annUrl && h('a', { href: daten.annUrl, target: '_blank', rel: 'noreferrer noopener' }, 'Anime News Network')
  return h('p', { class: 'leise' }, 'Angaben von ', namen.join(', '), ann && namen.length ? ', ' : '', ann)
}

function rollenListe(rollen) {
  const zeilen = rollen.flatMap(([figur, sprecher]) => [h('dt', { title: figur }, figur), h('dd', { title: sprecher }, sprecher)])
  return h('dl', { class: 'besetzung' }, zeilen)
}

async function fuelle(innen, { lader, titel }) {
  innen.append(hinweis('Wird geladen …'))
  const daten = await lader.ladeBesetzung(titel.ak).catch(() => null)
  if (!daten?.rollen.length) return innen.replaceChildren(hinweis('Keine Angaben gefunden.'))
  innen.replaceChildren(rollenListe(daten.rollen), quellenZeile(daten))
}

export function besetzungAbschnitt(ctx) {
  return aufklapper({ titel: 'Deutsche Stimmen', klasse: 'besetzung-abschnitt' }, (innen) => fuelle(innen, ctx))
}
