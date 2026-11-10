// Titel-ID → Kennung (ak) für Links auf das Panel: nur Titel, für die eine Titelgruppe auch einen Baustein führt (sonst öffnete der Link ein leeres Panel).
export function kennungenMitPanel(kennungen, gruppen) {
  const vorhanden = new Set([...gruppen.values()].flatMap((gruppe) => Object.keys(gruppe.titel)))
  const karte = new Map()
  for (const zeile of kennungen.titel) {
    const ak = zeile[3] ?? zeile[0]
    if (vorhanden.has(String(ak))) karte.set(zeile[1], ak)
  }
  return karte
}
