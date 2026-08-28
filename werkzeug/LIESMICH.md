# Die Stadt später anpassen

## Kurz: Wo was liegt

| Was | Wo | Wie oft ändert sich das |
|---|---|---|
| **Die Bauweise** — wie die Stadt gemacht wird | Masterfile **Teil 69** | selten, nur wenn wir das Verfahren ändern |
| **Dein Inhalt** — Wege, Plätze, Türen, Vordergrund | `data/stadt-wege.json` | jedes Mal, wenn du den Editor öffnest |
| Die Kulisse | `assets/stadt-kulisse.webp` | nur bei baulichen Änderungen |
| Die Mitarbeitenden | `data/team.json` | wenn jemand dazukommt |

**Deine Anpassungen kommen nicht in die Masterfile.** Sie stehen alle in einer
einzigen Datei, und die änderst du mit dem Editor, so oft du willst.

## Anpassen

Server läuft über den Vorschau-Knopf. Dann:

    http://localhost:5180/werkzeug/editor.html     bearbeiten
    http://localhost:5180/stadt.html               anschauen

Im Editor: Tasten **1** Weg, **2** Platz, **3** Tür, **4** Vordergrund.
Punkt verschieben durch Ziehen, löschen mit Alt und Klick. Gesichert wird
automatisch.

**Vor dem ersten Klick den Editor neu laden** (Strg+F5), sonst überschreibt er
mit seinem alten Stand, was seither geändert wurde.

## Die drei Befehle

**Vorher sichern**, damit du zurückkannst:

    python "C:\Users\krist\Desktop\PLAYER TWO\Website\werkzeug\stand_sichern.py"

**Nachher prüfen und reparieren.** Findet abgehängte Inseln im Wegenetz und
entfernt Wege ohne Strecke und Flächen mit zu wenig Ecken:

    python "C:\Users\krist\Desktop\PLAYER TWO\Website\werkzeug\netz_heilen.py"

Mit `--pruefen` dahinter wird nur berichtet, nichts geändert.

**Zurückholen**, wenn etwas schiefging:

    python "C:\Users\krist\Desktop\PLAYER TWO\Website\werkzeug\stand_sichern.py" --liste
    python "C:\Users\krist\Desktop\PLAYER TWO\Website\werkzeug\stand_sichern.py" --zurueck stadt-wege_2026-08-23

Beim Zurückholen wird der jetzige Stand vorher automatisch gesichert.

## Woran man merkt, dass etwas kaputt ist

- **Ein Ort wirkt tot**, niemand geht hin: Das Wegenetz ist dort abgerissen.
  `netz_heilen.py` laufen lassen.
- **Jemand läuft durch eine Wand**: Es fehlt ein Weg, und der Code nimmt den
  nächstgelegenen Punkt. Weg einzeichnen.
- **Jemand liegt quer auf der Liege**: Beim Platz den Richtungspfeil auf die
  andere Diagonale klicken.
- **Jemand klebt über einem Geländer**: Fehlende Vordergrundfläche, Taste 4.

## Wenn ein neues Kulissenbild nötig wird

Siehe `kulisse-auftrag.md` im selben Ordner — der Auftragstext im Wortlaut, die
neun Pflichtpunkte und die Nacharbeitsliste.
