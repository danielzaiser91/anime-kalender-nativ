// Die Bühne des Panels: Banner, Poster, Name, Schließen und Teilen. Der Name steht als Überschrift des Dialogs.
import { h } from '../dom.js'
import { titelAdresse } from '../../logik/woche.js'

export const TITEL_ID = 'panel-titel'

function teilenKnopf(adresse) {
  const knopf = h('button', { type: 'button', class: 'panel-knopf' }, 'Link kopieren')
  knopf.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(adresse())
      knopf.textContent = 'Link kopiert'
    } catch {
      knopf.textContent = 'Kopieren nicht möglich'
    }
  })
  return knopf
}

function bild(url, { klasse, breite, hoehe }) {
  return url ? h('img', { class: klasse, src: url, alt: '', width: breite, height: hoehe, decoding: 'async' }) : null
}

export function buehne(titel, { schliessen, adresse }) {
  const zu = h('button', { type: 'button', class: 'panel-knopf panel-zu', 'aria-label': 'Schließen' }, '×')
  zu.addEventListener('click', schliessen)
  const weiter = h('a', { class: 'panel-knopf', href: titelAdresse(titel.ak) }, 'Auf anime-kalender.de')
  return h(
    'header',
    { class: 'panel-buehne' },
    bild(titel.banner, { klasse: 'panel-banner', breite: '780', hoehe: '439' }),
    h('div', { class: 'panel-kopf' }, bild(titel.cover, { klasse: 'panel-poster', breite: '96', hoehe: '144' }), h('div', { class: 'panel-name' }, h('h2', { id: TITEL_ID }, titel.name), h('div', { class: 'panel-aktionen' }, teilenKnopf(adresse), weiter))),
    zu,
  )
}
