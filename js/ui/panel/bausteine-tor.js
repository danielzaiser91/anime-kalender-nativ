// Tor zu den Bausteinen unter der Bühne: jeder Baustein ist ein eigenes Modul und kommt erst, wenn der Titel ihn braucht (`titel.hat`: h Handlung, b Besetzung, f Folgen, d Disc, a Ähnliche).
import { lazyBereich } from './lazy-platz.js'

const stil = () => import('../css-laden.js').then((modul) => modul.ladeCss('css/panel-teile.css'))

/** Ein Platz, der Stil und Baustein holt und dann den Knoten des Bausteins zeigt. */
const platz = (name, laden) =>
  lazyBereich(name, async () => {
    await stil()
    return laden()
  })

/** Die Plätze der Bausteine eines Titels; `null`, wo es nichts gibt. `ctx`: titel, lader, ort, heute, ecchi, antwort. */
export function panelBausteine(ctx) {
  const hat = (kennzeichen) => Boolean(ctx.titel.hat?.includes(kennzeichen))
  return {
    folgen: hat('f') ? platz('Folgen', () => import('./folgen.js').then((m) => m.folgenAbschnitt(ctx))) : null,
    disc: hat('d') ? platz('Disc', () => import('./disc.js').then((m) => m.discAbschnitt(ctx))) : null,
    handlung: hat('h') ? platz('Handlung', () => import('./handlung.js').then((m) => m.handlungAbschnitt(ctx))) : null,
    reihe: ctx.titel.reihe ? platz('Reihe', () => import('./reihe.js').then((m) => m.reiheAbschnitt(ctx))) : null,
    besetzung: hat('b') ? platz('Besetzung', () => import('./besetzung.js').then((m) => m.besetzungAbschnitt(ctx))) : null,
    aehnlich: hat('a') ? platz('Ähnliche Titel', () => import('./aehnlich.js').then((m) => m.aehnlicheAbschnitt(ctx))) : null,
    quellen: ctx.titel.quellen?.length ? platz('Quellen', () => import('./quellen.js').then((m) => m.quellenAbschnitt(ctx))) : null,
  }
}
