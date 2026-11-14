# anime-kalender-nativ

Schlanker Zwilling von [anime-kalender.de](https://anime-kalender.de): dieselben Daten (Animation mit deutscher Synchronfassung), aber
nur nativ (HTML, CSS, ES-Module). Läuft parallel zur Hauptseite über GitHub Pages aus einem öffentlichen Repo; kein Cloudflare, keine
bezahlten Minuten. Ziel: alles können, was die App kann, bei einem Bruchteil der Größe. Stand: Woche, Monat, Panel (samt Handlung, Besetzung, Folgentiteln, Disc, Reihe, ähnlichen Titeln und Quellen), Favoriten, Gesehen, ICS-Export, Suche und Filter, News, Saison, Kalender-Abo, Was gucken?, Patch Notes.

**Ziel Design: 1:1 wie live (anime-kalender.de)** (Daniel, 12.11.2026). Die native App sieht aus wie die Live-Seite: gleiche Tokens (`--ak-*`, Quelle `web/src/styles.css` der Hauptseite), gleiche Karten, Abstände und Schrift. Jede visuelle Änderung belegt ein Bildpaar (live und nativ, gleiche Breite 390 px, Hell- und Dunkelmodus, Playwright headless); der PR zeigt oder verlinkt die Bilder und nennt jede Abweichung einzeln. Ohne Bildpaar gilt eine visuelle Aussage als unbelegt.

## Harte Grenzen

1. **Keine Abhängigkeit.** Kein npm-Paket (`package.json` ohne `dependencies`/`devDependencies`, besser ganz ohne), kein CDN, keine
   Webfonts, keine Bibliothek, kein Framework, kein Bundler. Einzige Außenaufrufe im Browser: Cover und Banner als `<img>` vom Bildserver (Hotlink, Entscheidung
   25.10.2026; Banner nur im Panel, nicht beim Start) und Links, die der Nutzer anklickt. Fetch nur auf eigene Dateien.
   Einzige Ausnahme, nur beim Bau (Workflow und `tools/bauen.sh`): Vor Messung und Veröffentlichung wird jede JS- und CSS-Datei in `_site` einzeln minifiziert
   (esbuild mit fester Version über `npx`, `--minify`, kein Bündeln; Daniel, 09.11.2026: „vor live bringung und messung soll uglified
   und minified werden“). Der Quelltext im Repo bleibt lesbar. npm prüft das Paket gegen die Prüfsumme der Registry; eine eigene
   Prüfsumme gibt es nicht, deshalb nur eine feste Version und nie im Browser.
2. **Schrift:** Text `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`; Überschriften
   `'Sitka Banner', Charter, 'Bitstream Charter', Cambria, 'Noto Serif', serif` (Variante E der Hauptseite).
3. **Umfang:** Modul höchstens 200 Zeilen, Funktion höchstens 40, höchstens 3 Parameter (sonst ein Objekt). Neues bekommt ein neues Modul
   statt ein volles zu füllen. Grenzen werden nie angehoben und nie umgangen (keine `;`-Ketten, keine zusammengezogenen Zeilen).
4. **Schichten** `ui → zustand → logik → daten`: ein Modul importiert nur aus seiner Schicht oder aus Schichten weiter rechts, nie
   zurück. `logik/` und `daten/` kennen kein DOM. Seiten in `ui/seiten/` importieren einander nicht; Gemeinsames nach `ui/bausteine/`.
   **Minimal und wiederverwendet** (Daniel, 09.11.2026: „möglichst so programmieren das code-schnipsel wiederverwendet werden können“): Daten holen und anzeigen, einfache Seitenlogik, keine Komplexität ohne Bedarf.
   Dieselbe Aufgabe (Formatieren, Liste, Knopf, Laden, Fehleranzeige) gibt es genau einmal in `ui/bausteine/` bzw. `logik/`; vor jedem
   neuen Baustein wird nach einem vorhandenen gesucht. Eine zweite eigene Fassung ist ein Befund im Review.
5. **Zustand** nur im Store (`js/zustand/store.js`). Keine veränderlichen Modul-Variablen sonst, keine Seiteneffekte beim Import.
6. **DOM** nur über `h()` (`js/ui/dom.js`). Kein `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`,
   `document.write`. Fremdtext landet nur als Textknoten.
7. **Größe: schlank ist das Ziel, die Grenze nur der Notanker** (Daniel, 09.11.2026: „das ziel soll schlanker code sein“, „die regeln sollen
   nicht künstlich umgangen werden“). Start = was vor dem ersten Bild geladen wird
   (HTML + CSS + JS + Startdaten, ohne Cover): Ziel unter 30 KB, hart 50 KB gzip. Nachgeladener Code (`import()`) je Baustein: Ziel
   unter 12 KB, hart 20 KB gzip (`tools/wache/groesse.js`). Gemessen wird immer die minifizierte, gzip-komprimierte Fassung;
   Kommentare zählen nie und werden nie gekürzt, um Platz zu sparen. Dazu zählt die **Gesamtsumme** (Start + alle Bausteine): Wächter-Ausgabe
   und jeder PR nennen sie mit Vorher/Nachher, jeder Zuwachs braucht eine Funktion, die ihn trägt. Grenzen nur senken, nie anheben.
   Nachgeladen wird nur, was der Start wirklich nicht braucht — nie, um eine Grenze zu umgehen (kein Abspalten, weil ein Topf voll
   ist). Liegt eine Zahl über ihrem Ziel, wird erst gekürzt (wiederverwenden, vereinfachen), dann aufgeteilt; der PR nennt, was
   gekürzt wurde. Nachgeladene Inhalte (Bilder, Video) zählen nicht, aber auch dort die sparsamste Variante bei voller Qualität.
8. **Keine Tests im Repo** (Daniel, 25.10.2026). Geprüft wird von außen (Prüfweg). `tools/wache.mjs` ist kein Test, sondern
   ein Regelwächter am Quelltext (Punkte 1 bis 7); `tools/wache-probe.mjs` spielt ihm eingebaute Verstöße vor (Selbstprobe, prüft keine App).
9. **Daten** stammen nur aus dem öffentlichen Repo `danielzaiser91/anime-kalender-de` (`public/data`, `data/kennungen.json`), nie von
   Hand und nie ins Git dieses Repos. Datenfehler dort beheben, nicht hier. Daten werden verdichtet (`tools/verdichten.mjs`) und nur
   bei neuem Stand als Pages-Artefakt veröffentlicht.
10. **Inhalt wie die Hauptseite:** Synchro ist nicht Untertitel; nichts behaupten ohne Beleg; Geschätztes mit "≈" kennzeichnen;
    Uhrzeiten und Folgen unverändert aus den Daten. Newsletter, Push, Abo, Melden und Admin gibt es hier nicht, dafür ein Link auf
    anime-kalender.de.

## Ordner

```
index.html            Hülle mit Lade-Hinweis und noscript
sw.js                 Service Worker (Wurzelordner, sonst gilt sein Geltungsbereich nur für einen Unterordner; `huelle.json` entsteht beim Bau), manifest.webmanifest, icons/
css/                  token.css (Farben hell/dunkel per prefers-color-scheme), basis.css, woche.css, panel.css, monat.css, suche.css; seiten.css (News, Saison, Abo, lazy)
js/main.js            Verdrahtung, höchstens 60 Zeilen
js/daten/             fetch + Cache; kennt nur Adressen (stand, woche/, titel/<Gruppe>; je Titel handlung/ besetzung/ folgen/ disc/ aehnlich/<Kennung>, je Reihe reihe/<Reihe>); speicher.js (localStorage von außen übergeben)
js/logik/             reine Funktionen (Zeit, Woche und Monat (ort.js: eine Tabelle für beide Ansichten), Merken, ICS, Suche (suche*.js) und Filter (filter*.js, katalog.js); Panel: antwort*.js, wege*.js, dub.js, handlung.js, folgen-liste.js, disc-*.js, reihe.js, start.js nach shared/ und web/src/components/detail der Hauptseite)
js/zustand/           store.js, router.js (Hash), ablauf.js (Laden bei Routenwechsel), katalog-lauf.js (lädt die Suche), merk.js (Favoriten, Gesehen, Wahlen ändern und speichern)
js/ui/dom.js          h()
js/ui/zeichnen.js     zeichnet die Ansicht (Monat lazy), hält den Fokus über das Neuzeichnen; ui/aktionen.js: Klicks (data-aktion) und Formulare (data-absenden: Datum-Sprung, Suche)
js/ui/bausteine/      kleine Teile (Kachel, Leiste, Ansichten-Navigation, Zeitkopf, Schalter, Seitenrahmen, Suchformular, Filterleiste, Trefferliste, News-Eintrag, Saison-Karte)
js/ui/seiten/         eine Datei je Ansicht
js/ui/panel-tor.js    lädt das Panel erst beim Öffnen; js/ui/panel/ ist der <dialog> (Bühne, Antwort-Kasten, Wege, Termine, Eckdaten); darunter je ein eigenes Modul pro Baustein (handlung, folgen, disc, reihe, besetzung, aehnlich, quellen), das bausteine-tor.js erst holt, wenn der Titel es braucht (Merkmal `hat` im Titelbaustein)
package.json          nur "type": "module" (Node und Browser lesen dieselben Module)
tools/                wache.mjs (Regelwächter), wache-probe.mjs (dessen Selbstprobe), verdichten.mjs (Datenschritt), huelle.mjs (Dateiliste für den Service Worker), bauen.sh (Bau wie im Workflow, minifiziert), je mit Unterordner; nur Node-Bordmittel (außer esbuild in `bauen.sh`, Punkt 1)
.github/workflows/    daten.yml (Wecker-Dispatch stündlich), pr-pruefer.yml
```

## Stand und bekannte Abweichungen

Gebaut sind (Stand Schritt 8): Wochen- und Monatsansicht, Suche und Filter, Favoriten und Gesehen, Panel je Titel mit allen Bausteinen, News, Saison, Kalender-Abo,
Was gucken?, Patch Notes und Offline/Installation; die Abschnitte je Schritt unten nennen Aufbau und Abweichungen. Gegenüber der Hauptseite fehlen noch:
Bündeln gleicher Titel, Zweitanbieter-Zeilen, "bestätigt" und "Zweitanbieter" als Filter und im Panel Merken (Favorit und Gesehen sind nur an der Kachel bedienbar).
Aus dem Panel-Durchstich (Schritt 2) fehlen weiter: Kinofilm ohne deutsche Fassung (Daten fehlen), widerlegte Termine, Disc-Bände, ausgebliebene Folgen
und "Takt unklar", Teilwege je Staffel (Cartoons), Händler nach Host gruppiert. Die Panel-Logik ist aus der Hauptseite portiert und gegen deren Funktionen an allen Titeln gemessen.

Schritt 3: Monatsansicht (`#/monat/<JJJJ-MM>`, Raster Montag bis Sonntag, schmal eine Liste der Tage mit Terminen; gleiche Termine wie die Woche,
Panel darüber), Datum-Sprung (`<input type="date">` in der Leiste, springt in der gerade gezeigten Ansicht), Favoriten (je Titel) und
"Gesehen bis Folge n" (je Folge, Stand je Titel), Einstellungen (nur "Ecchi-Titel zeigen", Vorgabe aus wie auf der Hauptseite; Hell/Dunkel folgt dem System),
ICS-Export der Favoriten (Termine ab heute, Berliner Zeit als UTC-Stempel plus `X-WR-TIMEZONE` wie die Hauptseite). Speicher (localStorage, Schlüssel wie
auf der Hauptseite): `favorites` (Liste Kennungen), `gesehenBis` (Kennung → Folge), `ecchiZeigen` ("1"), dazu `nurFavoriten` ("1"). Nachgeladen werden
`ui/seiten/monat.js`, `ui/einstellungen/` und `ui/ics/`; der Wächter misst jeden `import()`-Einstieg als eigenen Baustein. Favorit und Gesehen sind im Panel nicht bedienbar (nur an der Kachel).

Schritt 4: Suche und Filter (`#/suche?q=…`, Link "Suche" in der Leiste; teilbar, Panel darüber als `#/suche/t/<Kennung>?q=…`). Erst beim Öffnen der Suche
kommen `data/katalog.json` (je Titel eine Zeile mit Namen, Format, Jahr, FSK, Herkunft, Status und den Listen Genre, Schlagwort, Studio, Plattform, Bezugsquelle, Jahr, Art;
Reihenfolge der Felder in `js/logik/katalog.js`), danach im Hintergrund `data/synonyme.json` (Name in Originalschrift und weitere Namen) und `data/sprecher.json`
(Index; je Gruppe `data/sprecher/<Gruppe>.json` nur für gewählte Sprecher). Suche (`logik/suche*.js`) und Filter (`logik/filter*.js`) sind aus `web/src/lib/search.ts` und
`filters.ts` der Hauptseite nachgebaut (Datenbank-Ansicht: erst Filter, dann Suche über den Rest): 10 Listen (Plattform, Bezugsquelle, Art, Status, FSK, Jahr, Genre,
Schlagwort, Sprecher, Herkunft) je mit Einschluss und Ausschluss (Tipp reihum: nichts, ausgewählt, ausgeschlossen), Genre und Schlagwort verlangen alle gewählten Werte, die
übrigen eines davon. Schnellfilter in der Suche: Favoriten, Cartoon, Kostenlos, TV, Disc, Verfügbar (Favoriten, Kostenlos, Verfügbar mit "ausblenden"). Alle Wahlen sind Links;
der Zustand steht nur in der Adresse (Namen wie auf der Hauptseite: `p`, `anb`, `rt`, `st`, `fsk`, `y`, `g`, `kw`, `sp`, `her`, Ausschluss mit `x` davor; `fav`, `frei`, `wo` = 1 nur das, 0 ausblenden;
`f` = geöffnete Liste). Status, "kostenlos" und "verfügbar" gelten zum Datenstand und werden beim Bau gerechnet (`tools/verdichten/katalog-felder.js`). Abweichungen: Reihenfolge
der Treffer einfacher (Rang, Abstand, Name statt der Fundstellen-Punkte), keine Und/Oder-Umschaltung je Liste, keine Mindest-Vertrauensstufe; "bestätigt" und "Zweitanbieter"
wirken auf Termine und kommen mit dem Filter des Kalenders.

Schritt 5: News (`#/news`, Abfrage `art=<Art>` und `tage=<n>`), Saison (`#/saison`, Abfrage `r=zuletzt|ausblick`), Kalender-Abo (`#/abo`), alle drei lazy
mit gemeinsamem `css/seiten.css`, das erst mit der ersten dieser Ansichten kommt (`ui/css-laden.js`). News: je Woche eine Datei `data/news/<Woche>.json` (Tage, Einträge je Titel,
Meldungen mit fertigem Satz und Quellen; die Sätze entstehen beim Bau, `tools/verdichten/news-text.js` ist aus `news-text.ts` der Hauptseite nachgebaut und am RSS-Feed der Hauptseite
gemessen), `data/news/index.json` nennt die Wochen. Vorn die letzten 14 Tage, Älteres in Schritten von 14 Tagen per Link; überholte Meldungen stehen als "Frühere Stände" unter der geltenden
(`tools/verdichten/news-verlauf.js`), vier und mehr "auch bei …"-Meldungen eines Tages sind eingeklappt, Ecchi folgt dem Schalter aus den Einstellungen. Saison: `data/saison.json` trägt je Serie die Rohwerte
(Japan-Start, erster deutscher Termin, Deutsch belegt oder angekündigt, Anbieter), Stufe, Gruppen und Ausblick rechnet die Seite mit dem heutigen Tag (`logik/saison-*.js`, aus `saison.ts`
und `saison-ausblick.ts` nachgebaut; Serien sind wie auf der Hauptseite die Kerntitel, dazu der Katalog dahinter). Abo: `data/feeds/*.ics` und `data/feeds/news.xml` sind die Dateien der Hauptseite,
unverändert (Quelle: `public/data/feeds`), `data/feeds.json` führt Namen und Terminzahl je Feed; "Abonnieren" ist ein `webcal://`-Link auf dieselbe Adresse. Abweichungen: Nachtrag-Abschnitte
(`abschnitte`) einer Meldung fehlen, der Vermerk (`hinweis`) steht; News-Titel ohne Panel-Baustein sind nicht verlinkt; Ecchi-Titel außerhalb des Kerns bleiben in den News verborgen
(die Hauptseite zeigt sie dort, weil sie nur geladene Titel prüft).

Schritt 6: Panel-Rest. Unter den Eckdaten stehen sieben Bausteine, je ein eigenes Modul (`ui/panel/<Name>.js`), die `bausteine-tor.js` erst holt, wenn der Titelbaustein es verlangt
(`hat`: h Handlung, b Besetzung, f Folgentitel, d Disc, a Ähnliche; `reihe` = Kennung der Reihe; `quellen` steht schon im Baustein) und deren Stil `css/panel-teile.css` mit dem ersten kommt.
Daten je Titel eine kleine Datei `data/<handlung|besetzung|folgen|disc|aehnlich>/<Kennung>.json`, je Reihe `data/reihe/<Reihe>.json` (aus `franchises.json` und den Titeln, Eintrag der Reihe gewinnt);
Besetzung und Folgen öffnen erst auf Klick. Beim Bau entstehen: die Wahl der Handlung (deutsch, sonst englisch von AniList, sonst die des letzten früheren Teils der Reihe, Staffel vor Film;
`tools/verdichten/handlung.js`), die fünf ähnlichen Titel je Titel (`aehnlich.js`, Rechnung wie `shared/aehnlich.ts`, an allen 2.877 Titeln mit der Hauptseite gleich) und die Quellenzeilen
(`quellen.js`, wie `Quellenuebersicht.tsx`); die Seite rechnet nur, was vom Tag abhängt (Hinweis "Noch nicht erschienen", Geplant-Marke, "kommend"). Logik aus der Hauptseite: `logik/handlung.js`, `folgen-liste.js`,
`disc-ausgaben.js` und `disc-varianten.js` (Ausgaben nach Art gruppiert), `reihe.js` (Hauptstaffeln, Gruppen, Namen, Zeile), `start.js` (`erscheintErst`). Ecchi folgt dem Schalter (Reihenteile, Vorschläge).
Abweichungen: Reihenliste als Liste (kein Karussell), ohne Suche und ohne Staffelnummern aus `staffelStaende` ("Staffel n von m" fehlt, Teilnamen nur ohne Reihennamen gekürzt); Genres der Vorschläge
in der Sprache der Daten (englisch, wie die Eckdaten); Disc-Zeilen zeigen Shop und Quelle gleich statt erst nach dem Antippen, kein Kalendereintrag für Disc-Termine; kein Schlagworte-Abschnitt,
keine Neuigkeiten zum Titel, keine Beleg-Bilder (Worker); `deFolgen` der Handlung (2 Titel) fehlt; Besetzung nur mit Rollen oder ANN-Adresse (alle 2.511 Titel mit `hasVoices` haben beides oder eins; gemessen am Datenstand 10.11.2026).

Schritt 7: Was gucken? (`#/gucken`, Abfrage `s=<Zahl>` setzt den Startwert, also dasselbe Duell zum Teilen), Patch Notes, Link-Hinweise. Was gucken?: `data/empfehlung.json` (Pool der Hauptseite mit Kennung ak und Cover,
`tools/verdichten/empfehlung.js`), Rechenkern aus `shared/empfehlung-*.ts` portiert (`logik/gucken-vektor.js`, `gucken-kern.js`, `gucken-reise.js`, `gucken-ablauf.js`; an drei festen Eingaben mit der Hauptseite gleich), Ablauf als Zustand `gucken` im Store
(`zustand/gucken.js`, Handlungen `data-aktion="gucken-<name>"`). Duell: zwei Karten, Tippen oder Wischen zur Seite des Titels (`ui/wischen.js`, `logik/wisch.js`: mindestens 60 px, anderthalbmal so weit wie quer); danach fünf Vorschläge (Cover öffnet das Panel,
Favorit, Schon gesehen, Nicht interessiert; Ablage mit Zurückholen; Speicher `empfehlung:gesehen`, `empfehlung:verworfen` wie die Hauptseite). Patch Notes: `data/patchnotes.json` unverändert aus der Hauptseite, Knopf "Neu auf der Webseite" in den News, Dialog mit Filter, Wischen nach unten am Kopf schließt;
"ansehen" führt auf die Hauptseite. Abo-Seite: Links auf Newsletter und Push der Hauptseite. Abweichungen: keine Animationen im Duell, kein Anbieter-Blatt (Vorrang eigener Anbieter), keine Detail-Leinwand mit Trailer (das Panel ersetzt sie), kein Speichern der Reise über Neuladen,
keine Einleitung mit Cover-Mosaik, kein Ungelesen-Punkt am Patch-Notes-Knopf, Duell-Karten immer im Hochformat-Cover (kein Banner).

Schritt 8: Offline und Installation. `sw.js` (Wurzelordner, klassischer Worker ohne Imports, 0,7 KB gzip, zählt im Wächter zum Gesamt-JS: Gesamt vor der Poster-Woche 79,0 KB, mit ihr 82,4 KB, siehe unten) legt beim Installieren
die Hülle laut `huelle.json` (vom Bau erzeugt, `tools/huelle.mjs`: HTML, alles unter `css/` und `js/`, Manifest; zusammen ca. 75 KB gzip, einmalig) in den Cache `huelle`.
Alles Eigene gilt danach als "Netz zuerst, Cache als Rückfall" (Anfrage mit `no-cache`, damit Pages' Zwischenspeicher nichts Altes liefert); bei Netzfehler, Serverfehler
oder nach 4 s langsamem Netz antwortet der Cache; ein 404 gilt (die Datei ist gewollt weg) und löscht den alten Stand. Daten (`/data/`) liegen im Cache `daten` (höchstens 150 Dateien, die zuletzt geholten bleiben): offline lesbar ist, was zuletzt geladen
wurde; nie Angesehenes (z. B. Was gucken? ohne vorherigen Besuch) zeigt die ehrliche Fehlermeldung. Cover (fremde Adresse) fasst der Worker nicht an. Ein Hüllenstück, das nur offline aus dem Cache kommt, kann einen
Stand älter sein als die übrigen; online holt jede Datei die neue Fassung beim ersten Gebrauch. Anmeldung in `ui/offline.js` (nach dem Laden, `import()` aus `main.js`), das Installationsangebot
(`beforeinstallprompt`) liegt im Store (`installAngebot`, nicht in der Signatur: kein Neuzeichnen); in den Einstellungen `ui/einstellungen/installieren.js`: Hinweis zu Offline,
Knopf "Als App installieren" (Chromium) oder Hinweis auf das Teilen-Menü (iOS). Manifest `manifest.webmanifest` mit Icons der Hauptseite. Barrierefreiheit-Durchgang: Kontrast 0 Fälle unter 4,5:1 (3:1 große Schrift),
Fokus überall sichtbar (außer dem Kalender-Knopf im Datumsfeld, Chromium-Eigendarstellung), Tastatur und Escape im Dialog mit Fokus zurück, `prefers-reduced-motion` ohne Bewegung. Tippziele: bei Berührung 44 px (Monat-Einträge und Titel echt, Titel ohne längere Liste), mit Maus kompakt (WCAG 2.5.8, 24 px).

Poster-Woche (12.11.2026, `css/poster.css`, `ui/bausteine/poster.js`, `kaesten.js`, `logik/woche-teile.js`): je Tag Kopf (Zahl, Wochentag, Zählung), zwei Poster je Zeile mit Uhrzeit-Pille ("seit" ab Start heute, Stand beim Laden), Anbieterstreifen und gedämpften vergangenen Terminen, "Im Handel" als Liste und "Im Fernsehen" als Kacheln zum Wischen. Abweichungen von live: Stern auf dem Cover und "Gesehen" unter der Karte (das Panel kennt kein Merken), keine breite Karte für Staffelstart/Finale, keine Fähnchen (Art, Premiere), kein Auge zum Ausblenden von TV/Handel, keine "in n Min"-Pille und keine Jetzt-Linie, kein Bündeln gleicher Titel und keine Zweitanbieter-Zeilen im Raster, kein Mehrspalten-Layout ab 1024 px. Kopf, Navigation und Pillenleiste der Hauptseite fehlen noch (Leiste mit Text-Knöpfen).

Poster-Woche, gemessen am Bau (12.11.2026, Playwright headless, 390 px, Berührung, `tools/bauen.sh`-Wächter): Start 23,3 KB (Ziel 30, hart 50), Gesamt 82,4 KB gegenüber 79,0 KB vor der Poster-Woche (Ziel 42; der Wächter kennt keinen harten Gesamtwert, die frühere Angabe "von 80 KB" war eine Merkgrenze). Der Zuwachs von 3,4 KB gzip ist `poster.css` 1,6, `poster.js` 0,8, `woche-teile.js` 0,8, `kaesten.js` 0,7 und Tokens 0,1 abzüglich der entfallenen `kachel.js` 0,7; gekürzt wurden ungenutzte Regeln (`.zeit`, `.text .marke`), zwei ungenutzte Token und zwei ungenutzte Funktionen (`spaltenVon`, `metaZeile`). Weiteres Kürzen ginge nur auf Kosten von Teilen der 1:1-Vorgabe (Anbieterstreifen, TV-Zeichen, Handel-Kasten) und ist Daniels Entscheidung. Tippziele bei Berührung: Karten ganz (Titellink über der Karte, 337 px hoch), Stern 44 x 44, "Gesehen" 47 x 44, Fernsehkachel und Handelszeile über die ganze Kachel (Trefferprobe: Tipp in die Mitte trifft den Link bei 25 / 25 Karten, 44 / 44 Kacheln, 4 / 4 Zeilen). Kontrast der neuen Karten (WCAG, beide Themen): kleinster Wert 4,92:1 (hell) und 5,01:1 (dunkel), alles über 4,5:1 (`.poster-marke` und `.tag-leer` kamen im Datenstand nicht vor; ihre Farben `--ak-akzent-text` und `--ak-sehr-leise` sind an anderen Stellen mit 5,44:1 bzw. 4,92:1 gemessen).

## Oberfläche

Hell und dunkel nur über `prefers-color-scheme`. Echte Elemente (`button`, `a`, `nav`, `ol`), sichtbarer Fokus, Kontrast mindestens
4,5:1, Bedienung per Tastatur, `prefers-reduced-motion`, Zielgröße mindestens 44 px bei Berührung (`pointer: coarse`), mit Maus WCAG 2.5.8 (24 px) (Daniel 12.11.2026 zu F130: „a - von mir aus … es muss genauso wie live seite sein“; Maßstab ist die Hauptseite), `lang="de"`, Cover-`alt` leer (Titel steht daneben).
Texte deutsch, Feldnamen englisch, Kommentare nur das Warum (1 bis 3 Zeilen).

## Datenweg

`daten.yml` startet stündlich über den Cloudflare-Wecker (Worker `newsletter` in anime-kalender-de, `worker/src/wecker.ts`) per
`workflow_dispatch`, manuell, bei Push auf main und in jedem Pull Request (im PR nur Bau, sonst Deploy; Push auf main baut und
deployt immer). Kein eigener GitHub-Zeitplan, weil GitHub ihn nach 60 Ruhetagen abschaltet und unpünktlich feuert (25.10.2026).
Der Lauf fragt die letzte Commit-SHA von `public/data` im Altrepo (ohne Token), vergleicht sie mit
`stand.json` der laufenden Veröffentlichung (bei gleichem Stand endet ein Dispatch ohne Bau, außer `erzwingen`), holt bei Änderung
per Sparse-Checkout `public/data` und `data/kennungen.json`, verdichtet (Schemaprüfung, bei Fehler kein Deploy), prüft Größen und
veröffentlicht als Pages-Artefakt. Workflow-Dateien sind hier erlaubt (die Sammler-Sperre gilt nur im Altrepo).

## Änderungen

Alles als Pull Request, nie direkt auf `main` (keine Ausnahme: der Datenlauf braucht keinen Wachhalte-Commit mehr). Der CI-Prüfer (`pr-pruefer.yml`) urteilt einmal je Kopf. Vor dem Push `node tools/wache.mjs` und `node tools/wache-probe.mjs` lokal.

## Prüfweg (von außen)

Playwright-Skript außerhalb des Repos. Ohne Server: `page.route` liefert die Bauausgabe unter einer Scheinadresse aus. Geprüft werden
Screenshots (375 und 1200 px, hell und dunkel), Konsole ohne Fehler, Start-KB (gzip), Stichprobe gegen anime-kalender.de (gleiche
Titel und Zeiten derselben Woche). Nach dem Deploy zusätzlich gegen die echte Pages-Adresse.

Die Bauausgabe entsteht lokal wie im Workflow mit `sh tools/bauen.sh <Altrepo-Ordner> <Ausgabeordner>` (kopieren, verdichten, minifizieren,
messen); Bauer und Prüfer lesen so dieselbe Zahl. Der PR-Bericht nennt Start, je Baustein (Panel, Monat, Suche, Einstellungen, ICS) und die Dateien der Suche (katalog, synonyme, sprecher) und Gesamt (Start + alles Nachgeladene) minifiziert
und gzip, jeweils Vorher/Nachher mit Datenstand; der Wächter markiert jede Zahl über ihrem Ziel mit „über Ziel“ (kein Fehler). Bei einer
Umbau-Änderung ohne Verhaltensänderung gehören Bilder vorher/nachher (byte-gleich) und die Konsole ohne Fehler dazu.
