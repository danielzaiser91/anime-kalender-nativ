// Alles, was das Panel zeigt, als reine Daten: Antwort, Wege, Termine, Eckdaten.
import { berechneAntwort } from './antwort.js'
import { kastenText } from './antwort-text.js'

import { eckdaten, terminListe } from './termine.js'
import { wegGruppen } from './wege.js'
import { folgenOhneAnbieter } from './dub.js'
import { belegteBereiche } from './antwort-regeln.js'
import { laufendBei, titelMitTerminBereichen } from './wege-bestand.js'

function folgenLuecke(titel, antwort, ctx) {
  if (titel.format === 'MOVIE' || antwort.art === 'teilweise') return null
  const gesamt = antwort.art === 'laeuft' ? antwort.raus : titel.episodes
  const wege = [...titelMitTerminBereichen(titel, ctx.jetzt).streams.map((s) => (s.dub === true && !laufendBei(titel, s.platform, ctx) ? s.dubRanges : undefined)), ...titel.kaufwege.map((w) => belegteBereiche(w))]
  return folgenOhneAnbieter(wege, gesamt)
}

export function panelSicht(titel, uhr) {
  const antwort = berechneAntwort(titel, uhr)
  const ctx = { titel, heute: uhr.heute, jetzt: uhr.jetzt }
  return {
    antwort,
    text: kastenText(antwort, uhr.heute),
    wege: wegGruppen(ctx),
    termine: terminListe(titel, uhr.jetzt),
    daten: eckdaten(titel),
    luecke: folgenLuecke(titel, antwort, ctx),
  }
}
