#!/bin/sh
# Bau wie im Workflow: sh tools/bauen.sh <Altrepo-Ordner> <Ausgabe-Ordner> [Quell-SHA]
# Kopiert, verdichtet die Daten, minifiziert jede JS/CSS-Datei (je Datei, kein Bündeln, Pfade unverändert) und misst erst dann.
set -e
altrepo=$1
site=$2
test -n "$altrepo" && test -n "$site"
mkdir "$site"
cp -r index.html css js "$site/"
node tools/verdichten.mjs "$altrepo" "$site/data" "$3"
dateien=$(find "$site/js" "$site/css" -name '*.js' -o -name '*.css')
npx --yes esbuild@0.28.2 $dateien --minify --allow-overwrite --outdir="$site" --outbase="$site" --log-level=warning
node tools/wache.mjs "$site"
