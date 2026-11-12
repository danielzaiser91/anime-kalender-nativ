// Einstellungen: Hinweis zu Offline und Installation. Chromium bietet die Installation per Ereignis an (liegt im Store), Safari auf iOS nur über das Teilen-Menü.
import { h } from '../dom.js'

const IOS = /iPhone|iPad|iPod/

function installKnopf(angebot, store) {
  const knopf = h('button', { type: 'button', class: 'panel-knopf' }, 'Als App installieren')
  knopf.addEventListener('click', async () => {
    knopf.disabled = true
    await angebot.prompt()
    store.setze({ installAngebot: null })
  })
  return knopf
}

function installHinweis({ store, fenster }) {
  const angebot = store.lies().installAngebot
  if (angebot) return installKnopf(angebot, store)
  const alsApp = fenster.matchMedia('(display-mode: standalone)').matches
  if (!alsApp && IOS.test(fenster.navigator.userAgent)) return h('p', { class: 'meldung' }, 'Zum Installieren: Teilen, dann „Zum Home-Bildschirm“.')
  return null
}

export function offlineZeile(abhaengigkeiten) {
  const text = 'Die Seite und zuletzt angesehene Daten bleiben ohne Netz lesbar. Mit Netz gelten immer die neuesten Daten.'
  return h('div', { class: 'wahl-block' }, h('p', { class: 'meldung' }, text), installHinweis(abhaengigkeiten))
}
