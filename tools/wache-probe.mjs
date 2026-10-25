// Selbstprobe des Regelwächters (kein Test der App): jede Regel muss einen eingebauten Verstoß finden und sauberen Code durchlassen.
// Aufruf: node tools/wache-probe.mjs  – Exit 1, wenn ein Fall abweicht.
import { entschaerfe } from './wache/entschaerfen.js'
import { pruefeAussenadressen, pruefeDateiNamen, pruefePackage } from './wache/regeln-repo.js'
import { pruefeDateiUmfang, pruefeFunktionen } from './wache/regeln-umfang.js'
import { pruefeSchichten } from './wache/regeln-schichten.js'
import { pruefeDomFrei, pruefeModulvariablen, pruefeVerbote } from './wache/regeln-verbote.js'

const zeilen = (anzahl) => Array.from({ length: anzahl }, (_, i) => `// Zeile ${i}`).join('\n')
const funktion = (kopf, innen) => `function ${kopf} {\n${zeilen(innen)}\n}\n`
const adressen = (pfad, text) => pruefeAussenadressen(pfad, text).length
const code = (regel, pfad, text) => regel(pfad, entschaerfe(text)).length

// [Name, Funde, erwartet]: Funde als Zahl, erwartet 0 = sauber.
const FAELLE = [
  ['HTML https fremd', () => adressen('index.html', '<script src="https://cdn.fremd.de/x.js"></script>'), 1],
  ['HTML //host fremd', () => adressen('index.html', '<script src="//cdn.fremd.de/x.js"></script>'), 1],
  ['HTML //host eigene Adresse', () => adressen('index.html', '<a href="//anime-kalender.de/x">x</a>'), 0],
  ['HTML https eigene Adresse', () => adressen('index.html', '<a href="https://www.anime-kalender.de/x">x</a>'), 0],
  ['JS //host fremd', () => adressen('js/a.js', "const a = '//fremd.de/a.js'"), 1],
  ['JS https fremd', () => adressen('js/a.js', "const a = 'https://fremd.de/a.js'"), 1],
  ['JS Kommentar mit Leerzeichen', () => adressen('js/a.js', '// Hinweis auf anime-kalender.de'), 0],
  ['CSS url(//) ohne Anführungszeichen', () => adressen('css/a.css', '@font-face { src: url(//fremd.de/f.woff2) }'), 2],
  ['CSS url("//") mit Anführungszeichen', () => adressen('css/a.css', '@font-face { src: url("//fremd.de/f.woff2") }'), 2],
  ["CSS url('//') einfach", () => adressen('css/a.css', "a { background: url( '//fremd.de/b.png') }"), 2],
  ['CSS url(https) fremd', () => adressen('css/a.css', 'a { background: url(https://fremd.de/b.png) }'), 2],
  ['CSS @import', () => adressen('css/a.css', '@import "basis.css";'), 1],
  ['CSS url(data:) und lokal', () => adressen('css/a.css', 'a { background: url(data:image/png;base64,AA) } b { background: url(../x.png) }'), 0],
  ['Fremdadresse außerhalb des Ausgelieferten', () => adressen('tools/x.mjs', "const a = 'https://fremd.de/a'"), 0],
  ['Testdatei', () => pruefeDateiNamen(['js/logik/zeit.test.js']).length, 1],
  ['Testordner', () => pruefeDateiNamen(['tests/a.js']).length, 1],
  ['Sperrdatei', () => pruefeDateiNamen(['package-lock.json']).length, 1],
  ['Dateinamen sauber', () => pruefeDateiNamen(['js/main.js', 'tools/wache-probe.mjs']).length, 0],
  ['package dependencies', () => pruefePackage('{"dependencies":{"a":"1"}}').length, 1],
  ['package scripts', () => pruefePackage('{"scripts":{"a":"b"}}').length, 1],
  ['package sauber', () => pruefePackage('{"name":"x","type":"module"}').length, 0],
  ['innerHTML', () => code(pruefeVerbote, 'js/ui/a.js', 'el.innerHTML = x'), 1],
  ['eval', () => code(pruefeVerbote, 'js/ui/a.js', 'eval(x)'), 1],
  ['new Function', () => code(pruefeVerbote, 'js/ui/a.js', 'new Function(x)'), 1],
  ['document.write', () => code(pruefeVerbote, 'js/ui/a.js', 'document.write(x)'), 1],
  ['innerHTML nur im Kommentar', () => code(pruefeVerbote, 'js/ui/a.js', '// kein innerHTML'), 0],
  ['let auf Modulebene', () => code(pruefeModulvariablen, 'js/zustand/a.js', 'let a = 1'), 1],
  ['let auf Modulebene in main.js', () => code(pruefeModulvariablen, 'js/main.js', 'var a = 1'), 1],
  ['const auf Modulebene', () => code(pruefeModulvariablen, 'js/main.js', 'const a = 1'), 0],
  ['DOM in logik', () => code(pruefeDomFrei, 'js/logik/a.js', 'window.scrollTo(0, 0)'), 1],
  ['fetch in daten', () => code(pruefeDomFrei, 'js/daten/a.js', 'fetch(x)'), 1],
  ['fetch in ui erlaubt', () => code(pruefeDomFrei, 'js/ui/a.js', 'fetch(x)'), 0],
  ['Schicht logik importiert ui', () => pruefeSchichten('js/logik/a.js', "import { h } from '../ui/dom.js'").length, 1],
  ['Schicht ui importiert logik', () => pruefeSchichten('js/ui/a.js', "import { x } from '../logik/zeit.js'").length, 0],
  ['Seite importiert Seite', () => pruefeSchichten('js/ui/seiten/a.js', "import { x } from './b.js'").length, 1],
  ['Paket-Import', () => pruefeSchichten('js/ui/a.js', "import x from 'lodash'").length, 1],
  ['Datei 201 Zeilen', () => pruefeDateiUmfang('js/a.js', zeilen(201)).length, 1],
  ['Datei 200 Zeilen', () => pruefeDateiUmfang('js/a.js', zeilen(200)).length, 0],
  ['Funktion 41 Zeilen', () => code(pruefeFunktionen, 'js/a.js', funktion('f()', 39)), 1],
  ['Funktion 40 Zeilen', () => code(pruefeFunktionen, 'js/a.js', funktion('f()', 38)), 0],
  ['4 Parameter', () => code(pruefeFunktionen, 'js/a.js', funktion('f(a, b, c, d)', 1)), 1],
  ['3 Parameter', () => code(pruefeFunktionen, 'js/a.js', funktion('f(a, b, c)', 1)), 0],
]

function main() {
  const falsch = FAELLE.map(([name, lauf, soll]) => [name, lauf(), soll]).filter(([, ist, soll]) => ist !== soll)
  falsch.forEach(([name, ist, soll]) => console.log(`FALSCH ${name}: ${ist} Funde, erwartet ${soll}`))
  console.log(`Wächter-Probe: ${FAELLE.length} Fälle, ${falsch.length} falsch`)
  process.exitCode = falsch.length ? 1 : 0
}

main()
