// Ein Stylesheet erst holen, wenn die Ansicht dazu geöffnet wird (News, Saison, Abo): das Versprechen endet nach Laden oder Fehler, ein zweiter Aufruf legt nichts neu an.
import { h } from './dom.js'

export function ladeCss(adresse) {
  const vorhanden = document.head.querySelector(`link[href="${adresse}"]`)
  if (vorhanden) return vorhanden.bereit
  const knoten = h('link', { rel: 'stylesheet', href: adresse })
  knoten.bereit = new Promise((fertig) => {
    knoten.addEventListener('load', fertig)
    knoten.addEventListener('error', fertig)
  })
  document.head.append(knoten)
  return knoten.bereit
}
