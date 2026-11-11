// Was der Nutzer sich merkt: Favoriten, "gesehen bis Folge n" je Titel, "Was gucken?" (schon gesehen, nicht interessiert) und zwei Anzeigewahlen. Rein, ohne DOM.
// Die Zustandsform ("merk") wird nie verändert, jede Änderung liefert eine neue.

export const LEER = { favoriten: new Set(), gesehen: {}, empfGesehen: new Set(), empfVerworfen: new Set(), ecchi: false, nurFavoriten: false }

/** Holt einen Titel aus der Ablage von "Was gucken?" zurück. */
export const holeZurueck = (merk, { liste, ak }) => ({ ...merk, [liste]: new Set([...merk[liste]].filter((id) => id !== Number(ak))) })

/** Ein Titel in "Was gucken?" als gesehen (`empfGesehen`) oder nicht interessiert (`empfVerworfen`) merken. */
export function merkeEmpfehlung(merk, { liste, ak }) {
  return { ...merk, [liste]: new Set([...merk[liste], Number(ak)]) }
}

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
