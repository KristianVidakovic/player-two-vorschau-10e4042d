# Abgelegte Hero-Laengen

Am 26. August 2026 standen drei Laengen fuer den Hero-Film zur Wahl.
Gewaehlt wurde **B mit 280vh** - das ist der Wert in `index.html`.

| Fassung | Scrollweg | Wie es sich anfuehlt |
|---|---|---|
| A | 130vh | Eine kraeftige Scrollbewegung. Der Film rauscht durch. |
| **B** | **280vh** | **Zwei bis drei Bewegungen. Jede Textstufe hat Zeit anzukommen.** |
| C | 420vh | Vier Bewegungen. Ruhigstes Tempo, viel Weg vor dem ersten Inhalt. |

## Umstellen

Dafuer braucht es keine Datei aus diesem Ordner. In `index.html` steht die
Laenge an genau einer Stelle:

    .pt-hero{--pt-weg:280vh;--pt-p:1}

Nur die Zahl aendern. Alles andere - Textstaffelung, Filmzeit, das Loesen
des Heros - rechnet sich daraus.

## Was hier liegt

`hero-130vh.html` und `hero-420vh.html` sind vollstaendige Kopien der
Startseite vom Tag der Entscheidung, mit nichts anderem als der geaenderten
Zahl. Sie werden **nicht** ausgeliefert und tragen `noindex`. Sie altern:
sobald `index.html` weitergebaut wird, zeigen sie einen alten Stand.
Zum Vergleichen der Laengen genuegt das.

`../hero-laengen.html` stellt alle drei hintereinander und wird bei jedem
Umbau neu erzeugt. Das ist die Datei zum Vergleichen.
