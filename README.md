# [kleineAnfragen](https://kleineanfragen.de/) visualisiert

Visualisierung kleiner und großer Anfragen zusammengetragen von [kleineAnfragen.de](https://kleineanfragen.de/) aus dem Bundestag und aus den Landesparlamenten

Link: https://sophiamersmann.github.io/kleine-anfragen-visualised/dist/

## Daten: Quelle und Aufbereitung

Die Daten, die auf dieser Webseite visualisiert sind, wurden am 1.1.2021 von [kleineAnfragen.de](https://kleineanfragen.de/) heruntergeladen. Dabei wurde nicht die zur Verfügung stehende [Datenbank](https://kleineanfragen.de/info/daten) heruntergeladen, sondern alle zu diesem Zeitpunkt verfügbaren `*.json` Dateien zu den einzelnen Anfragen.

Die heruntergeladenen Daten wurden dann in zwei Schritten bearbeitet:
- Mit Hilfe von [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page) wurden alternative Schreibweisen des Namens eines Abgeordneten vereinheitlicht, indem jeder Abgeordnete dem entsprechenden Eintrag auf [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page) zugeordnet worden ist. Dieser Zuordnungsprozess ist fehleranfällig und es ist möglich, dass vereinzelte Abgeordnete dem falschen Wikidata-Eintrag zugeordnet worden sind oder immer noch in mehreren Schreibweisen in den Daten vorkommen (und damit als verschiedene Personen behandelt werden).
- Die Ministerien, an die sich Anfragen richten, sind ebenfalls in ihrer Schreibweise vereinheitlicht worden. Gegebenenfalls sind Abkürzungen für Ministerien ausformuliert worden.

Anmerkungen zu den Grafiken:
- **Parlamentsgrafik:** Fur jeden Abgeordneten wurde ermittelt an wie vielen Anfragen dieser beteiligt ist. Das beutetet, dass Anfragen, an denen mehrere Personen beteiligt sind, mehrfach gezählt werden. Anfragen, die keiner Person zugeordnet sind, sind in dieser Grafik nicht aufgeführt. Oft handelt es sich dabei um große Anfragen, die typischerweise von der Fraktion gestellt werden.
- **Ringgrafik:** Dargestellt sind Anfragen, die während der Legislaturperiode veröffentlicht wurden. Wenn die Legislaturperiode noch nicht beendet ist, dann ist Dezember 2020 der letzte dargestellte Monat. Anfragen, die außerhalb dieser Zeitperiode veröffentlicht wurden, sind nicht aufgeführt. Ebenso sind Anfragen, die keiner Partei und keinem Abgeordneten zugeordnet sind, nicht aufgeführt. Anfragen, die von mehreren Parteien gestellt wurden, sind auch mehrmals dargestellt (und miteinander verlinkt).

## Code

Dieser Code nutzt die Funktion `forceClusterCollision`, eine Adaption von `d3.forceCollide`, geschrieben von Nadieh Bremer geschrieben und veröffentlicht auf [Observable](https://observablehq.com/@nbremer/custom-cluster-force-layout).

Die Berechnung der Positionen der Parlamentssitze beruht auf Code gefunden auf [Observable](https://observablehq.com/@yu-emilie/european-parliament-elections-of-2014/2).

Die Farben des Parteienspektrums sind inspiriert von dem Farbschema der [Berliner Morgenpost](https://interaktiv.morgenpost.de/bundestagswahl-2021-umfragen-ergebnisse-wahlkarte/). Die Grautöne basieren auf einer Farbskala von [tailwindcss](https://tailwindcss.com/docs/customizing-colors).

## Project setup
```
npm install
```

#### Compiles and hot-reloads for development
```
npm run serve
```

#### Compiles and minifies for production
```
npm run build
```

#### Lints and fixes files
```
npm run lint
```

#### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
