# Pruefstand: warum es ihn braucht

Der Vorschau-Bereich in der Claude-App **loest keine Scroll-Ereignisse und
keine Animationsbilder aus**, solange er nicht sichtbar auf dem Schirm
steht. Gemessen am 26.08.2026: `window.scrollTo` veraendert `scrollY`,
aber `addEventListener('scroll', …)` feuert null Mal und
`requestAnimationFrame` laeuft null Mal.

Damit laesst sich dort **grundsaetzlich nichts pruefen, was am Scrollen
haengt** — der Hero-Film, die Textstufen, jede Einblendung. Es sieht dann
so aus, als waere die Seite kaputt, obwohl sie laeuft.

`pruefstand.js` startet ein echtes Chrome im Hintergrund und haengt sich
ueber das Entwicklerprotokoll an. Dort laeuft die Bildschleife normal.

## Aufruf

    node werkzeug/pruefstand.js <url> <datei-mit-js> [lage]

`lage` ist optional und steuert Geraet und Medienmerkmale:

    node werkzeug/pruefstand.js http://localhost:5180/index.html werkzeug/pruefungen/messung-hero.js
    node werkzeug/pruefstand.js http://localhost:5180/team.html  werkzeug/pruefungen/messung-team.js '{"breite":390,"hoehe":844,"grob":true}'
    node werkzeug/pruefstand.js http://localhost:5180/index.html werkzeug/pruefungen/halte.js '{"wenigBewegung":true}'
    node werkzeug/pruefstand.js http://localhost:5180/index.html werkzeug/pruefungen/halte.js '{"bild":"hero.png"}'

- `breite`, `hoehe`, `dpr`, `grob` — Bildschirm und Zeigerart. `grob`
  schaltet Beruehrungssteuerung ein, damit die fuenf Tore greifen.
- `wenigBewegung` — stellt `prefers-reduced-motion: reduce`.
- `bild` — legt einen Bildschirmabzug in `werkzeug/bilder/` ab.

## Zwei Fallen beim Messen

1. **`html{scroll-behavior:smooth}`** (index.html Zeile 66) faelscht jede
   Messung: `window.scrollTo(0,700)` und sofort danach `scrollY` lesen
   ergibt 0. Jedes Pruefskript setzt deshalb zuerst
   `document.documentElement.style.scrollBehavior='auto'`.

2. **Der Entwicklungsserver musste Bereichsanfragen lernen.** Ohne
   HTTP-Range meldet der Browser einen leeren `seekable`-Bereich und
   klemmt jedes `currentTime` auf 0 — der Film scrubbt dann auf einem
   echten Hoster und lokal nie. `server.py` kann es seit dem 26.08.2026;
   zusaetzlich holt `assets/hero-film.js` das Video als Blob, damit die
   Frage auf keinem Hoster mehr auftaucht.

## Was in pruefungen/ liegt

| Datei | prueft |
|---|---|
| `messung-hero.js` | Scrollweg, Videozeit, Textstufen ueber den ganzen Hero |
| `messung-flick.js` | Flick-Test: haelt jede Textstufe fuenf Radschritte? |
| `messung-tor.js` | die fuenf Tore: laedt das Video, wo es soll |
| `halte.js` | haelt an einer Stelle an, fuer Bildabzuege (`?p=0.35`) |
| `messung-team.js` | stehen die Namen ueber der Bildschirmkante? |
| `pruef-schaufenster.js` | Abschnittshoehe, Knoepfe, tote Sprungmarken |
| `pruef-katalog.js` | Filter, Suche, Zaehler auf loesungen.html |
