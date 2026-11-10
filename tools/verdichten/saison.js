// Saison-Datei: je Serie eine Zeile mit den Rohwerten (Japan-Start, erster deutscher Termin, Deutsch belegt oder angekündigt, Anbieter).
// Stufe und Gruppen rechnet die Seite mit dem heutigen Tag (js/logik/saison-zeilen.js), die Datei gilt also länger als eine Stunde.
// Nachgebaut aus der Hauptseite: shared/saison.ts (ersterTermin, hatDeutsch, anbieterChips), web/src/lib/saison.ts, saison-ausblick.ts.
import { anbieterName } from '../../js/logik/folge.js'
import { istSerie } from '../../js/logik/saison-zeit.js'
import { anzeigeName } from '../../js/logik/titel.js'
import { istEcchi, kleinesCover } from './wochen.js'

export const SAISON_SCHEMA = 1
const ANILIST_COVER_BASIS = 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/'
const MIN_ZEILEN = 100

/** Der erste Termin je Titel und ob er geschätzt ist. */
function ersterTermin(plaene) {
  const liste = plaene.flatMap((r) => (r.schedule?.firstEpisodeDate ? [{ datum: r.schedule.firstEpisodeDate, geschaetzt: Boolean(r.schedule.estimated) }] : []))
  return liste.sort((a, b) => a.datum.localeCompare(b.datum))[0]
}

/** Deutsch belegt: Weg mit Tonspur-Beleg, Erstausgabe mit Synchro oder Sprecherliste; ein nur abgeleiteter Weg zählt nicht. */
const hatDeutsch = (t) => Boolean((t.streams ?? []).some((s) => s.dub === true && !s.dubAbgeleitet) || t.deErstausgabe?.synchro || t.hasVoices)

/** Anbieter der Synchro, bei Ankündigung der der Ankündigung; `laut` = Deutsch nur aus abgeleitetem Weg (Hauptseite: "Deutsch laut Anbieter"). */
function anbieterVon(t, plaene) {
  const dub = (t.streams ?? []).filter((s) => s.dub === true)
  const angekuendigt = t.ankuendigung?.synchro === 'angekuendigt' ? [t.ankuendigung.platform] : []
  const ausTermin = plaene.filter((r) => !r.schedule?.estimated).map((r) => r.platform)
  const plattformen = [...new Set([...dub.map((s) => s.platform), ...angekuendigt, ...ausTermin])]
  return plattformen.map((p) => ({ name: anbieterName(p), laut: dub.some((s) => s.platform === p) && dub.filter((s) => s.platform === p).every((s) => s.dubAbgeleitet) }))
}

function zeileVonTitel(t, { akVon, plaene, jp }) {
  const termin = ersterTermin(plaene.get(t.id) ?? [])
  const anbieter = anbieterVon(t, plaene.get(t.id) ?? [])
  const start = jp[String(t.id)]
  return {
    id: t.id,
    ak: akVon.get(t.id),
    name: anzeigeName(t),
    cover: kleinesCover(t.coverImage),
    ecchi: istEcchi(t) ? 1 : undefined,
    jahr: t.jpYear,
    saison: t.jpSeason,
    jp: start,
    genau: start ? 'tag' : t.jpSeason ? 'saison' : 'jahr',
    de: termin?.datum,
    geschaetzt: termin?.geschaetzt || undefined,
    deutsch: hatDeutsch(t),
    angek: t.ankuendigung?.synchro === 'angekuendigt',
    anbieter: anbieter.map((a) => a.name),
    laut: anbieter.some((a) => a.laut) ? anbieter.filter((a) => a.laut).map((a) => a.name) : undefined,
  }
}

const genauigkeit = (jpStart) => (jpStart?.length === 10 ? 'tag' : jpStart?.length === 7 ? 'monat' : 'jahr')

/** Ein Katalogtitel hinter dem Schalter (Hauptseite: saison.json und saison-ausblick.json). */
function zeileVonKatalog(k, akVon) {
  const cover = k.coverImage && !k.coverImage.startsWith('http') ? ANILIST_COVER_BASIS + k.coverImage : k.coverImage
  return {
    id: k.id,
    ak: akVon.get(k.id),
    name: k.titleDe ?? k.titleEn ?? k.titleRomaji ?? String(k.id),
    cover,
    jahr: k.jpYear,
    saison: k.jpSeason,
    jp: k.jpStart,
    genau: genauigkeit(k.jpStart),
    katalog: 1,
    de: k.deVon,
    deutsch: k.deutsch === true,
    angek: k.angekuendigt === true,
    anbieter: [...new Set((k.anbieter ?? []).map((p) => anbieterName(p)))],
  }
}

/**
 * Alle Serien ab dem Vorjahr der Veröffentlichung (reicht für "Letzte" bis zum Jahreswechsel) und der Katalog dahinter.
 * Wie auf der Hauptseite sind die Serien die Kerntitel (titles-core.json, auch ohne Eintrag in titles.json); ein Katalogtitel, den der Kern schon führt, entfällt.
 */
export function baueSaison({ titel, releases, saison, ausblick, meta }, akVon) {
  const kontext = { akVon, plaene: Map.groupBy(releases, (r) => r.titleId), jp: saison.jp }
  const ab = Number(meta.generatedAt.slice(0, 4)) - 1
  const zeilen = titel.filter((t) => istSerie(t.format) && t.jpYear >= ab).map((t) => zeileVonTitel(t, kontext))
  const bekannt = new Set(zeilen.map((z) => z.id))
  for (const k of [...saison.katalog, ...ausblick.katalog]) {
    if (bekannt.has(k.id)) continue
    bekannt.add(k.id)
    zeilen.push(zeileVonKatalog(k, akVon))
  }
  if (zeilen.length < MIN_ZEILEN) throw new Error(`saison: ${zeilen.length} Zeilen, erwartet mindestens ${MIN_ZEILEN}`)
  return { schema: SAISON_SCHEMA, erzeugt: meta.generatedAt, zeilen }
}
