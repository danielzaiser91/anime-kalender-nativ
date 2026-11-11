// Die Kalender-Abo-Seite (wird erst beim ersten Öffnen geladen): alle Termine, je Plattform und je Genre als ICS-Datei zum Abonnieren (webcal://) oder Laden.
import { h } from '../dom.js'
import { ansichtsrahmen, ladeMeldung } from '../bausteine/seitenrahmen.js'

/** Adresse der Feed-Datei, so wie der Browser sie gerade erreicht; webcal:// nur über http(s), sonst entfällt der Abo-Link. */
function adressen(datei) {
  const url = new URL(`data/feeds/${datei}`, document.baseURI)
  const netz = url.protocol === 'https:' || url.protocol === 'http:'
  return { datei: url.href, webcal: netz ? `webcal://${url.host}${url.pathname}` : null }
}

function feedZeile(feed) {
  const { datei, webcal } = adressen(feed.datei)
  const abo = webcal && h('a', { class: 'schalter', href: webcal, 'aria-label': `${feed.name} abonnieren` }, 'Abonnieren')
  const laden = h('a', { class: 'schalter', href: datei, download: feed.datei, 'aria-label': `${feed.name} als Datei laden` }, 'Datei')
  return h('li', { class: 'feed' }, h('span', { class: 'feed-name' }, feed.name, h('span', { class: 'feed-zahl' }, `${feed.termine} ${feed.termine === 1 ? 'Termin' : 'Termine'}`)), abo, laden)
}

const feedListe = (feeds) => h('ul', { class: 'feeds' }, feeds.map(feedZeile))

function gruppe(titel, feeds, offen) {
  return h('details', { class: 'gruppe', open: offen }, h('summary', {}, `${titel} · ${feeds.length}`), feedListe(feeds))
}

/** Newsletter und Push gibt es hier nicht (kein eigener Dienst): nur der Weg zur Hauptseite, wo beide eingerichtet werden. */
function hauptseitenHinweis() {
  const newsletter = h('a', { href: 'https://anime-kalender.de/#/newsletter' }, 'Newsletter: neue Termine per Mail')
  const push = h('a', { href: 'https://anime-kalender.de/#/woche' }, 'Push für Favoriten: Meldung, wenn eine gemerkte Folge erscheint')
  const hinweis = 'Beides richtest du auf anime-kalender.de ein (Push dort im Menü der Kalenderansicht, nur in Browsern, die es können).'
  return h('section', { class: 'hauptseite-hinweis' }, h('h3', {}, 'Newsletter und Push'), h('ul', {}, h('li', {}, newsletter), h('li', {}, push)), h('p', { class: 'hinweis-zeile' }, hinweis))
}

function inhalt(zustand) {
  const meldung = ladeMeldung(zustand)
  if (meldung) return meldung
  const { feeds } = zustand.daten.feeds
  const von = (art) => feeds.filter((feed) => feed.art === art)
  const rss = h('p', {}, 'Die Meldungen der News gibt es auch als ', h('a', { href: 'data/feeds/news.xml', type: 'application/rss+xml' }, 'RSS-Feed'), ' für einen Feedreader.')
  return h(
    'div',
    {},
    h('h2', { class: 'seiten-titel' }, 'Kalender-Abo'),
    h('p', { class: 'hinweis-zeile' }, 'Alle Termine in deinem Kalender: „Abonnieren“ öffnet die Kalender-App, sie holt neue Termine selbst ab. „Datei“ lädt eine einmalige Kopie. Die Dateien sind dieselben wie auf anime-kalender.de.'),
    feedListe(von('alle')),
    gruppe('Nach Plattform', von('plattform'), true),
    gruppe('Nach Genre', von('genre'), false),
    rss,
    hauptseitenHinweis(),
  )
}

export const aboseite = (zustand) => ansichtsrahmen(zustand, 'aboseite', inhalt(zustand))
