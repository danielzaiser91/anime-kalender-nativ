// "Neu auf der Webseite": Einträge nach Tag gruppieren und Überschriften (aus web/src/lib/patchnotes-tage.ts und patchnotes-teile.tsx der Hauptseite). Rein, ohne DOM.
import { addiereTage, ausDatum } from './zeit.js'

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const HIGHLIGHTS_JE_TAG = 2

/** Gruppiert nach Tag in der Reihenfolge der Liste; je Tag höchstens zwei Highlight-Banner (`hl`), der Rest sind Zeilen. `filter`: 'alles', 'feature' oder 'bugfix'. */
export function tageVon(liste, filter) {
  const tage = []
  for (const eintrag of liste) {
    if (filter !== 'alles' && eintrag.kategorie !== filter) continue
    let tag = tage.find((t) => t.datum === eintrag.datum)
    if (!tag) tage.push((tag = { datum: eintrag.datum, hl: [], zeilen: [], entwurf: false }))
    if (eintrag.entwurf) tag.entwurf = true
    if (eintrag.highlight && tag.hl.length < HIGHLIGHTS_JE_TAG) tag.hl.push(eintrag)
    else tag.zeilen.push(eintrag)
  }
  return tage
}

/** Zahl der Einträge je Filter. */
export const zaehleKategorien = (liste) => ({
  alles: liste.length,
  feature: liste.filter((e) => e.kategorie === 'feature').length,
  bugfix: liste.filter((e) => e.kategorie === 'bugfix').length,
})

/** "Patch 11.10 · Sa · heute": der Tag einer Gruppe, wie auf der Hauptseite. */
export function tagUeberschrift(datum, heute) {
  const [, monat, tag] = datum.split('-')
  const relativ = datum === heute ? ' · heute' : datum === addiereTage(heute, -1) ? ' · gestern' : ''
  return `Patch ${monat}.${tag} · ${WOCHENTAGE[new Date(ausDatum(datum)).getUTCDay()]}${relativ}`
}

/** Die Adresse auf der Hauptseite, an der man es sieht (`link` ist dort eine Hash-Adresse "#/…"). */
export const hauptseiteAdresse = (link) => `https://anime-kalender.de/${link}`
