// Ersetzt Kommentare und den Inhalt von Zeichenketten durch Leerraum; Zeilenumbrüche, Klammern und Anführungszeichen bleiben.
const leer = (zeichen) => (zeichen === '\n' ? '\n' : ' ')

function oeffnet(zeichen, paar) {
  if (paar === '//' || paar === '/*') return paar
  return '\'"`'.includes(zeichen) ? zeichen : null
}

/** Ein Schritt: liefert den neuen Modus, den Ausgabetext und wie viele Zeichen verbraucht wurden. */
function schritt(modus, text, i) {
  const zeichen = text[i]
  const paar = text.slice(i, i + 2)
  if (modus === null) {
    const neu = oeffnet(zeichen, paar)
    return neu?.length === 2 ? [neu, '  ', 2] : [neu, zeichen, 1]
  }
  if (modus === '//') return zeichen === '\n' ? [null, zeichen, 1] : [modus, ' ', 1]
  if (modus === '/*') return paar === '*/' ? [null, '  ', 2] : [modus, leer(zeichen), 1]
  if (zeichen === '\\') return [modus, '  ', 2]
  return zeichen === modus ? [null, zeichen, 1] : [modus, leer(zeichen), 1]
}

export function entschaerfe(text) {
  let aus = ''
  let modus = null
  for (let i = 0; i < text.length; ) {
    const [neuerModus, ausgabe, laenge] = schritt(modus, text, i)
    modus = neuerModus
    aus += ausgabe
    i += laenge
  }
  return aus
}
