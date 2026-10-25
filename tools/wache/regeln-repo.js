// Repo-Regeln aus CLAUDE.md: Punkt 1 (keine Abhängigkeit, keine Fremdadresse im Ausgelieferten), Punkt 8 (keine Tests).
const ABHAENGIGKEITEN = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'bundledDependencies']
const ERLAUBTE_HOSTS = ['anime-kalender.de']
const TESTDATEI = /(^|\/)(tests?|__tests__|spec)(\/|$)|\.(test|spec)\.[cm]?js$/
const SPERRDATEIEN = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|node_modules)(\/|$)/
const AUSGELIEFERT = /^(index\.html|css\/|js\/)/

export function pruefeDateiNamen(pfade) {
  const tests = pfade.filter((p) => TESTDATEI.test(p)).map((p) => `${p}: Testdatei (keine Tests im Repo, Prüfung von außen)`)
  const sperren = pfade.filter((p) => SPERRDATEIEN.test(p)).map((p) => `${p}: Abhängigkeitsdatei`)
  return [...tests, ...sperren]
}

export function pruefePackage(text) {
  const paket = JSON.parse(text)
  const vorhanden = ABHAENGIGKEITEN.filter((feld) => feld in paket)
  const skripte = 'scripts' in paket ? ['package.json: scripts (Aufrufe stehen in CLAUDE.md und den Workflows)'] : []
  return [...vorhanden.map((feld) => `package.json: ${feld} ist verboten`), ...skripte]
}

function hostVon(adresse) {
  return adresse.replace(/^(https?:)?\/\//, '').split(/[/?#"')\s]/)[0]
}

export function pruefeAussenadressen(pfad, text) {
  if (!AUSGELIEFERT.test(pfad)) return []
  const adressen = [...text.matchAll(/(?:https?:)?\/\/[\w.-]+\.[a-z]{2,}[^\s"')]*/g)].map((m) => m[0])
  const fremd = adressen.filter((a) => !ERLAUBTE_HOSTS.includes(hostVon(a).replace(/^www\./, '')))
  const importe = /@import|url\(\s*['"]?(https?:)?\/\//.test(text) ? [`${pfad}: @import oder url(http, //) in CSS`] : []
  return [...fremd.map((a) => `${pfad}: Fremdadresse ${a}`), ...importe]
}
