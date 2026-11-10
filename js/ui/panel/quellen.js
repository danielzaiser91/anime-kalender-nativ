// Quellenübersicht (Baustein, lazy): eine Zeile je Quelle, dazu was sie liefert; verlinkt, wo wir eine Adresse haben (Hauptseite: Quellenuebersicht.tsx).
import { h } from '../dom.js'

const LIEFERT = {
  t: 'Termine',
  o: 'Originaltermine als Grundlage geschätzter Folgen',
  w: 'Titel, Cover, Genres, Jahr, Studio, Folgenzahl',
  d: 'Titel und Beschreibung, wo vorhanden auf Deutsch',
  s: 'deutsche Sprechrollen',
  f: 'Altersfreigabe',
}

function zeile([name, adresse, anzahl, liefert]) {
  const quelle = adresse ? h('a', { href: adresse, target: '_blank', rel: 'noopener noreferrer' }, name) : name
  return h('tr', {}, h('td', {}, quelle, anzahl > 1 && h('span', { class: 'leise' }, ` ×${anzahl}`)), h('td', { class: 'leise' }, liefert.map((k) => LIEFERT[k]).join(' · ')))
}

export function quellenAbschnitt({ titel }) {
  if (!titel.quellen?.length) return null
  const tabelle = h('table', { class: 'quellen' }, h('thead', {}, h('tr', {}, h('th', {}, 'Quelle'), h('th', {}, 'liefert'))), h('tbody', {}, titel.quellen.map(zeile)))
  const note = 'Termine sind je Eintrag belegt und verlinkt. Bei den übrigen Angaben steht, welche Quelle sie im Regelfall liefert — sie werden nicht einzeln nachgewiesen.'
  return h('details', { class: 'panel-abschnitt aufklapper quellen-abschnitt' }, h('summary', {}, `Woher diese Angaben stammen (${titel.quellen.length})`), h('div', { class: 'aufklapp-inhalt' }, tabelle, h('p', { class: 'leise' }, note)))
}
