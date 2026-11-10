// Folgentitel (Baustein, lazy): zugeklappt, ab 50 Folgen in Paketen; je Folge Nummer, Titel und die deutsche Marke, wo sie belegt ist.
import { h } from '../dom.js'
import { PAKET, deutscheBereiche, erschieneneFuerFolgenliste, folgeMarke, paketNamen } from '../../logik/folgen-liste.js'
import { aufklapper, hinweis } from './aufklapper.js'

const MARKEN = {
  de: ['DE', 'Für diese Folge existiert eine deutsche Synchro.', 'folge-de'],
  noch: ['◷', 'Erscheint noch. Ob die Folge auf Deutsch kommt, belegt erst ihr Erscheinen.', 'folge-noch'],
  offen: ['?', 'Für diese Folge ist keine deutsche Synchro belegt.', 'folge-offen'],
}

function markenKnoten(marke) {
  if (marke.art === 'keine') return null
  const [zeichen, text, klasse] = marke.art === 'nein' ? ['✕', marke.text, 'folge-nein'] : MARKEN[marke.art]
  return h('span', { class: `folge-marke ${klasse}`, role: 'img', 'aria-label': text, title: text }, zeichen)
}

function folgenZeile([nr, name, minuten], marke) {
  return h('li', { class: 'folge' }, h('span', { class: 'folge-nr' }, String(nr)), h('span', { class: 'folge-titel' }, name || '—'), minuten && h('span', { class: 'folge-min' }, `${minuten} Min.`), markenKnoten(marke))
}

function paketLeiste(anzahl, waehle) {
  const namen = paketNamen(anzahl)
  const knoepfe = namen.map((name, i) => h('button', { type: 'button', class: 'panel-knopf folgen-paket', 'aria-pressed': String(i === 0), 'data-paket': String(i) }, name))
  for (const knopf of knoepfe) {
    knopf.addEventListener('click', () => {
      knoepfe.forEach((k) => k.setAttribute('aria-pressed', String(k === knopf)))
      waehle(Number(knopf.dataset.paket))
    })
  }
  return knoepfe.length ? h('div', { class: 'folgen-pakete' }, knoepfe) : null
}

function liste(daten, ctx) {
  const folgen = daten.f
  const ohneTitel = folgen.length > 0 && folgen.every(([, name]) => !name)
  const ul = h('ul', { class: 'folgen-liste' })
  const stand = { liste: daten, wege: deutscheBereiche(ctx.titel), erschienen: erschieneneFuerFolgenliste(ctx.antwort) }
  const zeige = (paket) => ul.replaceChildren(...folgen.slice(paket * PAKET, (paket + 1) * PAKET).map((f) => folgenZeile(f, folgeMarke(f[0], stand))))
  zeige(0)
  return [paketLeiste(folgen.length, zeige), ohneTitel && hinweis('Die Folgentitel liegen noch nicht vor.'), ul]
}

async function fuelle(innen, kopf, ctx) {
  innen.append(hinweis('Lädt …'))
  const daten = await ctx.lader.ladeFolgen(ctx.titel.ak).catch(() => null)
  if (!daten?.f.length) return innen.replaceChildren(hinweis('Keine Folgentitel bekannt.'))
  kopf.textContent = `Folgen (${daten.f.length})`
  const minuten = daten.min && !ctx.titel.runtimeMin ? hinweis(`~${daten.min} Min. je Folge`) : null
  innen.replaceChildren(...[minuten, ...liste(daten, ctx)].filter(Boolean))
}

export function folgenAbschnitt(ctx) {
  return aufklapper({ titel: 'Folgen', klasse: 'folgen-abschnitt' }, (innen, kopf) => fuelle(innen, kopf, ctx))
}
