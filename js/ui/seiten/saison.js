// Der Saison-Überblick (wird erst beim ersten Öffnen geladen): aktuelle, letzte und nächste Anime-Saison, was davon auf Deutsch zu sehen ist, ab wann und wo.
import { h } from '../dom.js'
import { ansichtsrahmen, ladeMeldung } from '../bausteine/seitenrahmen.js'
import { saisonKarte } from '../bausteine/saison-karte.js'
import { saisonText, saisonVon, versetzt } from '../../logik/saison-zeit.js'
import { ausblickGruppen, zeilenDerSaison } from '../../logik/saison-zeilen.js'
import { hashFuerOrt, hashFuerTitel } from '../../zustand/router.js'

const REITER = [
  { id: 'jetzt', name: 'Aktuelle', schritt: 0 },
  { id: 'zuletzt', name: 'Letzte', schritt: -1 },
  { id: 'ausblick', name: 'Ausblick', schritt: 1 },
]

const reiterVon = (abfrage) => REITER.find((r) => r.id === new URLSearchParams(abfrage).get('r')) ?? REITER[0]
const reiterSaison = (reiter, heute) => (reiter.schritt === 0 ? saisonVon(heute) : versetzt(saisonVon(heute), reiter.schritt))

function reiterLeiste(aktiv, heute) {
  const links = REITER.map((r) => {
    const zeit = r.id === 'ausblick' ? '' : ` ${saisonText(reiterSaison(r, heute))}`
    return h('a', { class: 'wahl-knopf liste', href: hashFuerOrt({ art: 'saison', schluessel: r.id === 'jetzt' ? '' : `r=${r.id}` }), 'aria-current': r.id === aktiv.id ? 'page' : undefined }, r.name, zeit)
  })
  return h('nav', { class: 'wahl-zeile', 'aria-label': 'Saison wählen' }, links)
}

const liste = (zeilen, kontext) => h('ol', { class: 'termine' }, zeilen.map((z) => saisonKarte(z, kontext)))

function hinweisText(reiter, zeilen) {
  const deutsch = zeilen.filter((z) => z.deutsch).length
  if (zeilen.length === 1) return 'Eine Fernseh- oder Web-Serie startet in dieser Saison in Japan.'
  if (reiter.id === 'zuletzt') return `Letzte Saison: ${zeilen.length} Serien, ${deutsch} davon auf Deutsch.`
  return `${zeilen.length} Fernseh- und Web-Serien starten in dieser Saison in Japan, ${deutsch} davon gibt es auf Deutsch.`
}

function saisonInhalt(zeilen, kontext) {
  const erschienen = zeilen.filter((z) => z.erschienen)
  const kommt = zeilen.filter((z) => !z.erschienen)
  const gruppe = (titel, eintraege) => eintraege.length > 0 && h('section', { class: 'tag' }, titel && h('h2', {}, `${titel} · ${eintraege.length}`), liste(eintraege, kontext))
  const mitTitel = erschienen.length > 0 && kommt.length > 0
  return h('div', {}, gruppe(mitTitel ? 'Schon erschienen' : '', erschienen), gruppe(mitTitel ? 'Kommt noch' : '', kommt))
}

const gruppenName = (g) => (g.saison ? saisonText(g.saison) : g.jahr !== undefined ? `${g.jahr}, Saison offen` : 'Ohne Termin')

/** Titel ohne jedes Datum: nur Namen, ohne Cover (es sind viele, und sie haben nichts zu zeigen außer dem Namen). */
function nurNamen(zeilen, ort) {
  return h('ul', { class: 'nur-namen' }, zeilen.map((z) => h('li', {}, z.ak ? h('a', { href: hashFuerTitel(ort, z.ak), 'aria-haspopup': 'dialog' }, z.name) : z.name)))
}

function ausblickInhalt(zeilen, kontext) {
  const gruppen = ausblickGruppen(zeilen, kontext.heute)
  const ohne = gruppen.find((g) => g.schluessel === 'ohne')?.zeilen.length ?? 0
  const gesamt = gruppen.reduce((n, g) => n + g.zeilen.length, 0)
  const hinweis = h('p', { class: 'hinweis-zeile' }, `${gesamt} Serien in Japan, ${ohne} davon noch ohne Termin. „Noch offen“ heißt: Wir kennen noch keine deutsche Fassung.`)
  const knoten = gruppen.map((g, i) => h('details', { class: 'gruppe', open: i === 0 }, h('summary', {}, `${gruppenName(g)} · ${g.zeilen.length}`), g.schluessel === 'ohne' ? nurNamen(g.zeilen, kontext.ort) : liste(g.zeilen, kontext)))
  return h('div', {}, hinweis, knoten)
}

function inhalt(zustand) {
  const meldung = ladeMeldung(zustand)
  if (meldung) return meldung
  const reiter = reiterVon(zustand.ort.schluessel)
  const zeilen = zustand.daten.saison.zeilen.filter((z) => zustand.merk.ecchi || !z.ecchi)
  const kontext = { ort: zustand.ort, heute: zustand.heute, ausblick: reiter.id === 'ausblick' }
  const kopf = h('div', {}, h('h2', { class: 'seiten-titel' }, 'Saison'), reiterLeiste(reiter, zustand.heute))
  if (kontext.ausblick) return h('div', {}, kopf, ausblickInhalt(zeilen, kontext))
  const saison = reiterSaison(reiter, zustand.heute)
  const treffer = zeilenDerSaison(zeilen, saison, zustand.heute)
  const leer = h('p', { class: 'leer' }, `Für ${saisonText(saison)} ist noch keine Serie bekannt. Sobald eine angekündigt ist, erscheint sie hier.`)
  return h('div', {}, kopf, treffer.length === 0 ? leer : [h('p', { class: 'hinweis-zeile' }, hinweisText(reiter, treffer)), saisonInhalt(treffer, kontext)])
}

export const saisonseite = (zustand) => ansichtsrahmen(zustand, 'saisonseite', inhalt(zustand))
