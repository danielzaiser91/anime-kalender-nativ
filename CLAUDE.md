# anime-kalender-nativ

Schlanker Zwilling von [anime-kalender.de](https://anime-kalender.de): dieselben Daten (Animation mit deutscher Synchronfassung), aber
nur nativ (HTML, CSS, ES-Module). Läuft parallel zur Hauptseite über GitHub Pages aus einem öffentlichen Repo; kein Cloudflare, keine
bezahlten Minuten. Ziel: alles können, was die App kann, bei einem Bruchteil der Größe. Stand: Durchstich Wochenansicht.

## Harte Grenzen

1. **Keine Abhängigkeit.** Kein npm-Paket (`package.json` ohne `dependencies`/`devDependencies`, besser ganz ohne), kein CDN, keine
   Webfonts, keine Bibliothek, kein Framework, kein Bundler. Einzige Außenaufrufe im Browser: Cover als `<img>` (Hotlink, Entscheidung
   25.10.2026) und Links, die der Nutzer anklickt. Fetch nur auf eigene Dateien.
2. **Schrift:** Text `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`; Überschriften
   `'Sitka Banner', Charter, 'Bitstream Charter', Cambria, 'Noto Serif', serif` (Variante E der Hauptseite).
3. **Umfang:** Modul höchstens 200 Zeilen, Funktion höchstens 40, höchstens 3 Parameter (sonst ein Objekt). Neues bekommt ein neues Modul
   statt ein volles zu füllen. Grenzen werden nie angehoben und nie umgangen (keine `;`-Ketten, keine zusammengezogenen Zeilen).
4. **Schichten** `ui → zustand → logik → daten`: ein Modul importiert nur aus seiner Schicht oder aus Schichten weiter rechts, nie
   zurück. `logik/` und `daten/` kennen kein DOM. Seiten in `ui/seiten/` importieren einander nicht; Gemeinsames nach `ui/bausteine/`.
5. **Zustand** nur im Store (`js/zustand/store.js`). Keine veränderlichen Modul-Variablen sonst, keine Seiteneffekte beim Import.
6. **DOM** nur über `h()` (`js/ui/dom.js`). Kein `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`,
   `document.write`. Fremdtext landet nur als Textknoten.
7. **Startbudget 50 KB gzip hart** (HTML + CSS + JS + Startdaten, ohne Cover), Ziel unter 30 KB. Nur senken, nie anheben.
8. **Keine Tests im Repo** (Daniel, 25.10.2026). Geprüft wird von außen (Prüfweg). `tools/wache.mjs` ist kein Test, sondern
   ein Regelwächter am Quelltext (Punkte 1 bis 7).
9. **Daten** stammen nur aus dem öffentlichen Repo `danielzaiser91/anime-kalender-de` (`public/data`, `data/kennungen.json`), nie von
   Hand und nie ins Git dieses Repos. Datenfehler dort beheben, nicht hier. Daten werden verdichtet (`tools/verdichten.mjs`) und nur
   bei neuem Stand als Pages-Artefakt veröffentlicht.
10. **Inhalt wie die Hauptseite:** Synchro ist nicht Untertitel; nichts behaupten ohne Beleg; Geschätztes mit "≈" kennzeichnen;
    Uhrzeiten und Folgen unverändert aus den Daten. Newsletter, Push, Abo, Melden und Admin gibt es hier nicht, dafür ein Link auf
    anime-kalender.de.

## Ordner

```
index.html            Hülle mit Lade-Hinweis und noscript
css/                  token.css (Farben hell/dunkel per prefers-color-scheme), basis.css, woche.css
js/main.js            Verdrahtung, höchstens 60 Zeilen
js/daten/             fetch + Cache; kennt nur Adressen
js/logik/             reine Funktionen (Zeit, Woche gruppieren)
js/zustand/           store.js, router.js (Hash), ablauf.js (Laden bei Routenwechsel)
js/ui/dom.js          h()
js/ui/bausteine/      kleine Teile (Kachel, Kopf)
js/ui/seiten/         eine Datei je Ansicht
package.json          nur "type": "module" (Node und Browser lesen dieselben Module)
tools/                wache.mjs (Regelwächter), verdichten.mjs (Datenschritt), je mit Unterordner; nur Node-Bordmittel
.github/workflows/    daten.yml (stündlich), pr-pruefer.yml
```

## Stand und bekannte Abweichungen

Durchstich: Wochenansicht (Woche blättern, Titel, Uhrzeit, Anbieter, Folge, Marken, Link auf die Titelseite der Hauptseite). Gegenüber der
Hauptseite fehlt noch: Bündeln gleicher Titel, Zweitanbieter-Zeilen, Monat, Suche, Filter, Favoriten, Detail-Panel, Offline.

## Oberfläche

Hell und dunkel nur über `prefers-color-scheme`. Echte Elemente (`button`, `a`, `nav`, `ol`), sichtbarer Fokus, Kontrast mindestens
4,5:1, Bedienung per Tastatur, `prefers-reduced-motion`, Zielgröße mindestens 44 px, `lang="de"`, Cover-`alt` leer (Titel steht daneben).
Texte deutsch, Feldnamen englisch, Kommentare nur das Warum (1 bis 3 Zeilen).

## Datenweg

`daten.yml` (stündlich und manuell): fragt die letzte Commit-SHA von `public/data` im Altrepo (ohne Token), vergleicht sie mit
`stand.json` der laufenden Veröffentlichung, holt bei Änderung per Sparse-Checkout `public/data` und `data/kennungen.json`,
verdichtet (Schemaprüfung, bei Fehler kein Deploy), prüft Größen und veröffentlicht als Pages-Artefakt. Ein Keepalive-Schritt
hält den Zeitplan gegen die 60-Tage-Abschaltung wach. Workflow-Dateien sind hier erlaubt (die Sammler-Sperre gilt nur im Altrepo).

## Änderungen

Alles als Pull Request, nie direkt auf `main`. Der CI-Prüfer (`pr-pruefer.yml`) urteilt einmal je Kopf. Vor dem Push
`node tools/wache.mjs` lokal.

## Prüfweg (von außen)

Playwright-Skript außerhalb des Repos. Ohne Server: `page.route` liefert die Bauausgabe unter einer Scheinadresse aus. Geprüft werden
Screenshots (375 und 1200 px, hell und dunkel), Konsole ohne Fehler, Start-KB (gzip), Stichprobe gegen anime-kalender.de (gleiche
Titel und Zeiten derselben Woche). Nach dem Deploy zusätzlich gegen die echte Pages-Adresse.
