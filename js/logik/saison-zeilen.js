// Welche Zeilen aus saison.json in eine Saison gehören, und der Ausblick nach Saison gruppiert (Hauptseite: web/src/lib/saison.ts, saison-ausblick.ts).
import { saisonVon, saisonZeitraum } from './saison-zeit.js'
import { erschienenVon, stufeVon } from './saison-stufe.js'

/** Die Zeile mit Stufe und Erscheinen für den Tag `heute`; im Ausblick gilt noch nichts als erschienen. */
function bewerte(z, heute, ausblick) {
  if (!ausblick) return { ...z, erschienen: erschienenVon(z, heute), stufe: stufeVon(z, heute) }
  const zeile = z.katalog ? { ...z, deutsch: false } : z
  return { ...zeile, erschienen: false, stufe: stufeVon(zeile, heute) }
}

const gehoertZu = (z, saison) => {
  if (z.saison) return z.jahr === saison.jahr && z.saison === saison.saison
  const [von, bis] = saisonZeitraum(saison)
  return Boolean(z.katalog && z.jp && z.jp >= von && z.jp <= bis)
}

const nachTermin = (a, b) => Number(b.erschienen) - Number(a.erschienen) || Number(b.deutsch) - Number(a.deutsch) || (a.de ?? a.jp ?? '9').localeCompare(b.de ?? b.jp ?? '9') || a.id - b.id

/** Die Serien einer Saison: Schon-Erschienenes und Deutsch zuerst, dann nach erstem deutschen Termin. */
export function zeilenDerSaison(zeilen, saison, heute) {
  return zeilen.filter((z) => gehoertZu(z, saison)).map((z) => bewerte(z, heute, false)).sort(nachTermin)
}

const GENAU_RANG = { tag: 0, monat: 1, saison: 2, jahr: 3 }
const sortSchluessel = (z) => `${GENAU_RANG[z.genau]}${z.jp ?? ''}`

/** In welche Gruppe eine Zeile des Ausblicks kommt: { saison } oder { jahr } oder nichts (dann "ohne Termin"); undefined = gehört nicht in den Ausblick. */
function ortImAusblick(z, { jetzt, nach }) {
  if (!z.katalog) {
    const saison = z.saison ? { jahr: z.jahr, saison: z.saison } : undefined
    if (saison ? saisonZeitraum(saison)[0] <= nach : z.jahr < jetzt.jahr) return undefined
    return saison ? { saison } : { jahr: z.jahr }
  }
  if (z.saison && z.jahr) return { saison: { jahr: z.jahr, saison: z.saison } }
  if (!z.jp) return z.jahr ? { jahr: z.jahr } : {}
  if (z.jp.length === 4) return { jahr: Number(z.jp) }
  return { saison: saisonVon(z.jp.length === 7 ? `${z.jp}-01` : z.jp) }
}

/** Eine Saison bis zur laufenden gehört zu "Aktuelle" und "Letzte" und steht nicht im Ausblick. */
function gruppenSchluessel(ort, nach) {
  if (ort.saison) return saisonZeitraum(ort.saison)[0] > nach ? { schluessel: saisonZeitraum(ort.saison)[0], saison: ort.saison } : undefined
  return ort.jahr !== undefined ? { schluessel: String(ort.jahr), jahr: ort.jahr } : { schluessel: 'ohne' }
}

/** Der Ausblick: Gruppen je Saison, dann je Jahr ohne Saison, zuletzt "ohne Termin"; nichts fällt weg. */
export function ausblickGruppen(zeilen, heute) {
  const kontext = { jetzt: saisonVon(heute), nach: saisonZeitraum(saisonVon(heute))[1] }
  const gruppen = new Map()
  for (const z of zeilen) {
    const ort = ortImAusblick(z, kontext)
    const gruppe = ort && gruppenSchluessel(ort, kontext.nach)
    if (!gruppe) continue
    if (!gruppen.has(gruppe.schluessel)) gruppen.set(gruppe.schluessel, { ...gruppe, zeilen: [] })
    gruppen.get(gruppe.schluessel).zeilen.push(bewerte(z, heute, true))
  }
  const rang = (g) => (g.saison ? 0 : g.jahr !== undefined ? 1 : 2)
  const ordnung = (a, b) => rang(a) - rang(b) || a.schluessel.localeCompare(b.schluessel)
  return [...gruppen.values()].sort(ordnung).map((g) => ({ ...g, zeilen: g.zeilen.sort((a, b) => sortSchluessel(a).localeCompare(sortSchluessel(b)) || a.id - b.id) }))
}
