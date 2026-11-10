// Handlung des Titels (Baustein, lazy): deutsch, sonst englisch (AniList), sonst die des letzten früheren Teils; die Quelle steht immer sichtbar am Fuß.
import { h } from '../dom.js'
import { brauchtMehrKnopf, ersatzHinweis, gilltFuerReihe, kuerzeHandlung, quelleName } from '../../logik/handlung.js'

const extern = (adresse, text) => h('a', { href: adresse, target: '_blank', rel: 'noopener noreferrer' }, `${text} ↗`)

function eigeneQuelle(eigen) {
  const seite = eigen.lizenzSeite
  const quellen = eigen.quellen.flatMap((q, i) => [i > 0 ? ' · ' : '', extern(q.url, q.name)])
  return h('span', { class: 'handlung-quelle' }, 'Zusammengefasst nach ', quellen, ' · ', seite ? extern(seite, eigen.lizenz) : eigen.lizenz)
}

const quellenZeile = (plot) => (plot.eigen ? eigeneQuelle(plot.eigen) : h('span', { class: 'handlung-quelle' }, 'Quelle: ', extern(plot.quelle.url, quelleName(plot.quelle.name))))

function mehrKnopf(text, absatz) {
  if (!brauchtMehrKnopf(text)) return h('span')
  const knopf = h('button', { type: 'button', class: 'panel-knopf', 'aria-expanded': 'false' }, 'mehr anzeigen')
  knopf.addEventListener('click', () => {
    const offen = knopf.getAttribute('aria-expanded') !== 'true'
    knopf.setAttribute('aria-expanded', String(offen))
    knopf.textContent = offen ? 'weniger anzeigen' : 'mehr anzeigen'
    absatz.textContent = kuerzeHandlung(text, offen)
  })
  return knopf
}

/** Der Hinweis steht über dem Text: er ändert, wie der Absatz zu lesen ist. */
function hinweisZeile(plot, { titel, heute }) {
  const ersatz = ersatzHinweis(plot, titel, heute)
  if (ersatz) return h('p', { class: 'handlung-hinweis' }, ersatz)
  return gilltFuerReihe(plot) ? h('p', { class: 'handlung-hinweis' }, 'Zur Reihe – gilt für alle Teile.') : null
}

export async function handlungAbschnitt({ titel, lader, heute }) {
  const plot = await lader.ladeHandlung(titel.ak)
  const absatz = h('p', { class: 'handlung-text' }, kuerzeHandlung(plot.text, false))
  return h(
    'section',
    { class: 'panel-abschnitt', 'aria-label': 'Handlung' },
    h('h3', {}, 'Handlung'),
    hinweisZeile(plot, { titel, heute }),
    absatz,
    plot.fallback && h('p', { class: 'leise' }, 'Diese Beschreibung gibt es nur auf Englisch.'),
    h('div', { class: 'handlung-fuss' }, mehrKnopf(plot.text, absatz), quellenZeile(plot)),
  )
}
