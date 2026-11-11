// Lokaler Speicher des Nutzers (Favoriten, Gesehen, Wahlen). Das Lager (localStorage) kommt von außen; ein gesperrter Speicher gilt als leer.
// Schlüssel wie auf der Hauptseite: favorites, gesehenBis, ecchiZeigen, empfehlung:gesehen, empfehlung:verworfen; dazu nurFavoriten.
const EMPF_GESEHEN = 'empfehlung:gesehen'
const EMPF_VERWORFEN = 'empfehlung:verworfen'
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

/** Eine Liste von Kennungen im Lager als Menge; alles andere als Zahlen fällt weg. */
function leseMenge(lager, schluessel) {
  const liste = leseJson(lager, schluessel, [])
  return new Set(Array.isArray(liste) ? liste.filter(istZahl) : [])
}

export function erzeugeSpeicher(lager) {
  return {
    lies() {
      const gesehen = leseJson(lager, GESEHEN, {})
      return {
        favoriten: leseMenge(lager, FAVORITEN),
        empfGesehen: leseMenge(lager, EMPF_GESEHEN),
        empfVerworfen: leseMenge(lager, EMPF_VERWORFEN),
        gesehen: typeof gesehen === 'object' && !Array.isArray(gesehen) ? gesehen : {},
        ecchi: leseText(lager, ECCHI) === '1',
        nurFavoriten: leseText(lager, NUR_FAVORITEN) === '1',
      }
    },
    speichere(merk) {
      try {
        lager.setItem(FAVORITEN, JSON.stringify([...merk.favoriten]))
        lager.setItem(GESEHEN, JSON.stringify(merk.gesehen))
        lager.setItem(EMPF_GESEHEN, JSON.stringify([...merk.empfGesehen]))
        lager.setItem(EMPF_VERWORFEN, JSON.stringify([...merk.empfVerworfen]))
        lager.setItem(ECCHI, merk.ecchi ? '1' : '0')
        lager.setItem(NUR_FAVORITEN, merk.nurFavoriten ? '1' : '0')
      } catch {
        // Gesperrter Speicher: die Wahl gilt dann nur für diesen Besuch.
      }
    },
  }
}
