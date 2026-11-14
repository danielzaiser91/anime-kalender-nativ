// Meldet den Service Worker nach dem Laden an und merkt das Installationsangebot des Browsers im Store (kein Neuzeichnen: es steht nicht in der Signatur).
function meldeAn(fenster) {
  fenster.navigator.serviceWorker?.register('sw.js').catch(() => {})
}

export function starteOffline({ store, fenster }) {
  fenster.addEventListener('beforeinstallprompt', (ereignis) => {
    ereignis.preventDefault()
    store.setze({ installAngebot: ereignis })
  })
  fenster.addEventListener('appinstalled', () => store.setze({ installAngebot: null }))
  if (fenster.document.readyState === 'complete') meldeAn(fenster)
  else fenster.addEventListener('load', () => meldeAn(fenster))
}
