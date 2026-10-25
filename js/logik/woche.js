// Die Termine einer Woche, nach Tag gruppiert und nach Uhrzeit sortiert. Rein, ohne DOM.
const nachZeitDannName = (a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.name.localeCompare(b.name, 'de')

export function gruppiereNachTag(termine, tage) {
  return tage.map((datum) => ({
    datum,
    termine: termine.filter((t) => t.date === datum).sort(nachZeitDannName),
  }))
}

/** Verweis auf die Titelseite der Hauptseite; ohne Kennung fehlt der Verweis. */
export const titelAdresse = (ak) => (ak ? `https://anime-kalender.de/t/${ak}/` : '')
