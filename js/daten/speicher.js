// Lokaler Speicher des Nutzers (Favoriten, Gesehen, Wahlen). Das Lager (localStorage) kommt von außen; ein gesperrter Speicher gilt als leer.
// Schlüssel wie auf der Hauptseite: favorites, gesehenBis, ecchiZeigen; dazu nurFavoriten.
const FAVORITEN = 'favorites'
const GESEHEN = 'gesehenBis'
const ECCHI = 'ecchiZeigen'
const NUR_FAVORITEN = 'nurFavoriten'

function leseText(lager, schluessel) {
  try {
    return lager.getItem(schluessel)
  } catch {
    return null
  }
}

function leseJson(lager, schluessel, ersatz) {
  try {
    return JSON.parse(leseText(lager, schluessel)) ?? ersatz
  } catch {
    return ersatz
  }
}

const istZahl = (wert) => Number.isInteger(wert)

export function erzeugeSpeicher(lager) {
  return {
    lies() {
      const favoriten = leseJson(lager, FAVORITEN, [])
      const gesehen = leseJson(lager, GESEHEN, {})
      return {
        favoriten: new Set(Array.isArray(favoriten) ? favoriten.filter(istZahl) : []),
        gesehen: typeof gesehen === 'object' && !Array.isArray(gesehen) ? gesehen : {},
        ecchi: leseText(lager, ECCHI) === '1',
        nurFavoriten: leseText(lager, NUR_FAVORITEN) === '1',
      }
    },
    speichere(merk) {
      try {
        lager.setItem(FAVORITEN, JSON.stringify([...merk.favoriten]))
        lager.setItem(GESEHEN, JSON.stringify(merk.gesehen))
        lager.setItem(ECCHI, merk.ecchi ? '1' : '0')
        lager.setItem(NUR_FAVORITEN, merk.nurFavoriten ? '1' : '0')
      } catch {
        // Gesperrter Speicher: die Wahl gilt dann nur für diesen Besuch.
      }
    },
  }
}
