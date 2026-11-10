// Form des Katalogs (data/katalog.json): je Titel eine Zeile in der Reihenfolge FELDER, Listen als Nummern in den Tabellen der Datei.
// Der Datenschritt schreibt in dieser Reihenfolge, die Oberfläche liest sie hier zurück.
import { anzeigeName } from './titel.js'

export const KATALOG_SCHEMA = 1
export const FELDER = ['ak', 'id', 'namen', 'format', 'jahr', 'fsk', 'herkunft', 'status', 'stream', 'kostenlos', 'genres', 'keywords', 'studios', 'plattformen', 'anbieter', 'jahre', 'arten']
// Welche Listenfelder in welcher Tabelle der Datei stehen.
export const TABELLEN = { genres: 'genre', keywords: 'keyword', studios: 'studio', plattformen: 'plattform', anbieter: 'anbieter' }

function zeile(werte, datei) {
  const titel = Object.fromEntries(FELDER.map((feld, i) => [feld, werte[i]]))
  for (const [feld, tabelle] of Object.entries(TABELLEN)) titel[feld] = titel[feld].map((nr) => datei[tabelle][nr])
  const [de, en, romaji] = titel.namen
  titel.name = anzeigeName({ titleDe: de || undefined, titleEn: en || undefined, titleRomaji: romaji || undefined, id: titel.id })
  return titel
}

/** Die Zeilen der Datei als Titel mit lesbaren Listen; `name` ist der Anzeigename wie im Panel. */
export const entpackeKatalog = (datei) => datei.titel.map((werte) => zeile(werte, datei))
