// Was der Nutzer sich merkt: Favoriten, "gesehen bis Folge n" je Titel und zwei Anzeigewahlen. Rein, ohne DOM.
// Die Zustandsform ("merk") wird nie verändert, jede Änderung liefert eine neue.

export const LEER = { favoriten: new Set(), gesehen: {}, ecchi: false, nurFavoriten: false }

export const istFavorit = (merk, ak) => merk.favoriten.has(Number(ak))

export function schalteFavorit(merk, ak) {
  const favoriten = new Set(merk.favoriten)
  const id = Number(ak)
  if (!favoriten.delete(id)) favoriten.add(id)
  return { ...merk, favoriten }
}

export const istGesehen = (merk, ak, folge) => (merk.gesehen[Number(ak)] ?? 0) >= folge

/** Gesehen bis zu dieser Folge; ist sie schon gesehen, rückt der Stand auf die Folge davor (0 = nichts gesehen). */
export function schalteGesehen(merk, ak, folge) {
  const stand = istGesehen(merk, ak, folge) ? folge - 1 : folge
  const gesehen = { ...merk.gesehen, [Number(ak)]: stand }
  if (stand < 1) delete gesehen[Number(ak)]
  return { ...merk, gesehen }
}

export const setzeOption = (merk, name, wert) => ({ ...merk, [name]: wert })

/** Ohne Ecchi (Vorgabe) und, wenn gewählt, nur Favoriten; `titel` ist die Titelkarte der Ansicht. */
export function sichtbareTermine(termine, titel, merk) {
  return termine.filter((t) => {
    const info = titel[t.titleId] ?? {}
    if (info.ecchi && !merk.ecchi) return false
    return !merk.nurFavoriten || (info.ak != null && istFavorit(merk, info.ak))
  })
}
