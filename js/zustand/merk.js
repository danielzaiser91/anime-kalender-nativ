// Eine Änderung an dem, was der Nutzer sich merkt: neu berechnen, speichern, im Store ablegen.
export function aendereMerk({ store, speicher }, aenderung) {
  const neu = aenderung(store.lies().merk)
  speicher.speichere(neu)
  store.setze({ merk: neu })
}
