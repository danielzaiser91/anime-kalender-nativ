// Der einzige veränderliche Zustand der App. main.js legt ihn an und reicht ihn weiter.
export function erzeugeStore(anfang) {
  let zustand = anfang
  const abonnenten = new Set()

  return {
    lies: () => zustand,
    setze(teil) {
      zustand = { ...zustand, ...teil }
      abonnenten.forEach((rufe) => rufe(zustand))
    },
    abonniere(rufe) {
      abonnenten.add(rufe)
    },
  }
}
