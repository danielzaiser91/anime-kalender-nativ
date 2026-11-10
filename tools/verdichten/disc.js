// Disc-Ausgaben je Titel: die aniSearch-Zeilen unverändert, dazu die Disc-Termine des Bestands mit dem, was die Zusammenführung braucht (Artikel, Shop).
const ARTIKEL = /article\/(\d+)/
const ARTIKEL_BASIS = 'https://www.anisearch.de/article/'
const istAdresse = (url) => typeof url === 'string' && /^https?:\/\//i.test(url)

/** Shop-Adresse eines Termins; aniSearch ist Quelle, kein Shop. */
export function shopUrlVon(termin) {
  return [termin.buyUrl, termin.platformUrl].find((url) => istAdresse(url) && !/anisearch\./i.test(url)) ?? null
}

function terminZeile(release) {
  const zeile = { name: release.name, datum: release.schedule?.firstEpisodeDate ?? '', artikel: release.sources.map((s) => Number(ARTIKEL.exec(s)?.[1])).filter(Boolean) }
  const shop = shopUrlVon(release)
  if (release.edition) zeile.edition = release.edition
  if (release.publisher) zeile.verlag = release.publisher
  if (shop) zeile.shop = shop
  return zeile
}

/** Map AniList-ID → { ausgaben, termine }; Titel ohne beides fehlen. */
export function baueDisc(discAusgaben, releases) {
  const termine = Map.groupBy(
    releases.filter((r) => r.releaseType === 'disc'),
    (r) => r.titleId,
  )
  const karte = new Map()
  for (const id of new Set([...discAusgaben.keys(), ...termine.keys()])) {
    karte.set(id, { artikelBasis: ARTIKEL_BASIS, ausgaben: discAusgaben.get(id) ?? [], termine: (termine.get(id) ?? []).map(terminZeile) })
  }
  return karte
}
