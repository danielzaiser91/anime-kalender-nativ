// Reihen fürs Panel: je Reihe eine Datei mit allen Teilen — `franchises.json` und die Titel des Bestands, wie auf der Hauptseite (reihen-daten.ts).
import { vorschauCover } from './vorschau-cover.js'

const OHNE_JAHR = 9999
const nachJahrUndId = (a, b) => (a.jpYear ?? OHNE_JAHR) - (b.jpYear ?? OHNE_JAHR) || a.id - b.id

// Was die Reihenliste je Teil braucht; Werte bleiben unverändert (Folgenzahl, Status, Start).
const FELDER = ['name', 'format', 'jpYear', 'jpStart', 'jpStatus', 'episodes', 'ohneSynchro', 'beiwerk', 'eigenesWerk', 'deStart', 'remakeVon']

function teilAusTitel(t) {
  return { id: t.id, name: t.titleDe ?? t.titleEn ?? t.titleRomaji ?? `#${t.id}`, format: t.format, jpYear: t.jpYear, episodes: t.episodes, cover: t.coverImage }
}

/** Alle Teile einer Reihe: der Eintrag aus `franchises.json` gewinnt vollständig über das, was der Titel vorgibt. */
function teileVon(wurzel, { franchises, titel }) {
  const teile = new Map()
  for (const m of franchises[wurzel] ?? []) teile.set(m.id, m)
  for (const t of titel.get(wurzel) ?? []) teile.set(t.id, { ...teilAusTitel(t), ...teile.get(t.id) })
  return [...teile.values()].sort(nachJahrUndId)
}

/** Map Reihen-Kennung → Teile (roh, nach Jahr und Kennung) für jede Reihe, in der ein Titel des Bestands steht. */
export function sammleReihen({ titelVoll, franchises }) {
  const titel = Map.groupBy(titelVoll, (t) => t.franchiseId ?? t.id)
  return new Map([...titel.keys()].map((wurzel) => [wurzel, teileVon(wurzel, { franchises, titel })]))
}

function teilZeile(m, { akVon, ecchi }) {
  const zeile = { ak: akVon.get(m.id), cover: vorschauCover(m.cover) }
  for (const feld of FELDER) if (m[feld] !== undefined) zeile[feld] = m[feld]
  if (ecchi.has(m.id)) zeile.ecchi = 1
  return Object.fromEntries(Object.entries(zeile).filter(([, wert]) => wert !== undefined && wert !== null))
}

/** Map Reihen-Kennung → { teile }; nur Reihen mit mindestens zwei Teilen, von denen einer eine Kennung hat. */
export function baueReihen(reihen, akVon, ecchi) {
  const datei = new Map()
  for (const [wurzel, teile] of reihen) {
    if (teile.length > 1 && teile.some((m) => akVon.has(m.id))) datei.set(wurzel, { teile: teile.map((m) => teilZeile(m, { akVon, ecchi })) })
  }
  return datei
}
