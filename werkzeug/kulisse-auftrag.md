# Auftragstext für ein Kulissenbild

Damit ist am 2026-08-23 die aktuelle Stadt entstanden (`assets/stadt-kulisse.webp`,
Master `stadt-kulisse.png`, 2752 × 1536). Modell: Nano Banana Pro, 16:9.

**Für ein neues Bild wird dieser Text angepasst, nicht neu erfunden.** Die Punkte
unter «Was nicht verhandelbar ist» stehen so in Masterfile Teil 69.3 und dürfen
nicht wegfallen, sonst ist das Ergebnis unbespielbar.

---

## Was nicht verhandelbar ist

1. **Keine Menschen im Bild.** Die kommen aus dem Code.
2. **Offener Liftschacht** über alle Geschosse, auf jeder Etage auf derselben
   senkrechten Linie, mit sichtbarer Kabine und sichtbarem Ausstieg.
3. **Freier Laufgang** vor den Arbeitsplätzen auf jeder Etage, über die ganze
   Breite, ohne Möbel.
4. **Klarer Eingang** auf Strassenniveau, freier Weg von der Tür zum Lift.
5. **Freier Vordergrund** vor den Gebäuden.
6. **Jeder Arbeitsplatz frei anlaufbar.**
7. **Alle Gebäude offen geschnitten**, Möbel sichtbar.
8. **Beschriftung an jedem Ort.**
9. **Freie Fläche für Wachstum**: leere Parzellen mit Schildern, gross genug für
   die Erweiterung des HQ und künftige Kundengebäude.

## Die Palette

Marineblau `#12182B`, Schieferblau `#313B52`, warmes Gebrochenweiss `#EBE6DF`,
heller Putz `#DEDAD3`, warmes Grau `#B2A9A3`, warmer Sand `#D5C1A9`,
gedämpftes Salbeigrün `#7C9670`, blasses Glas `#C3D2DB`, Beckenblau `#8CC3D2`.
Signalblau `#1E6CFF` nur als kleiner Akzent.

---

## Der Text im Wortlaut

```
A charming isometric miniature coastal town seen from a fixed elevated angle,
drawn as an architectural presentation model. Every building is cut open like a
dollhouse so you look inside and see the furniture. Flat vector shading with two
or three tones per surface and thin dark navy outlines. Clean, warm, calm,
grown-up. NO pixel art, NO neon, NO garish saturated colours, NO cartoon
exaggeration.

Palette: deep navy #12182B, slate blue #313B52, warm off-white #EBE6DF, light
plaster #DEDAD3, warm grey #B2A9A3, warm sand #D5C1A9, muted sage green #7C9670,
pale glass #C3D2DB, soft pool blue #8CC3D2, and signal blue #1E6CFF only as a
small accent.

THE BUILDINGS, each with a small clean sign showing its name in simple sans-serif
capitals:

1. PLAYER TWO HQ — the largest building, four office floors, the whole front side
removed so all four floors are visible, an open elevator shaft running the full
height on one side aligned on the same vertical line on every floor, rows of desks
with monitors and office chairs, a wide clear walkway along the open front of every
floor, a navy ground floor with a glass entrance and canopy.

2. WOHNHAUS — a four-storey residential block with the front removed, showing small
individual bedrooms side by side, each with a single bed, a lamp and a small desk,
plus a shared kitchen on the ground floor.

3. SCHULE — a two-storey school with the roof off, showing rows of school desks
facing a blackboard, and a small clock on the facade.

4. RESTAURANT — roof removed, dining tables with plates and chairs inside, a kitchen
counter, and an outdoor terrace with tables and parasols.

5. BAR — a small darker navy building, roof removed, a bar counter with bar stools
and two small tables.

6. SCHWIMMBAD — an outdoor swimming pool with marked lanes, a diving board, sun
loungers and parasols around it.

7. SPORT — a green football pitch with white markings and two goals, next to a small
open gym building showing exercise equipment.

8. STRAND — a sandy beach along one edge with parasols, sun loungers and a small
beach bar, meeting a calm turquoise sea.

LAYOUT: paved streets in a clear grid connecting everything, wide clean sidewalks,
small delivery vans parked, street lamps, benches, bicycle racks, trees, hedges and
planters. On the right side, two or three empty building plots of bare earth with
small blue signposts, reserved for future buildings. All walking routes must stay
clear and unobstructed.

ABSOLUTELY NO PEOPLE anywhere. No human figures, no characters, no silhouettes.
The town is completely empty of people. Furniture yes, people no.

Plain light grey background, soft ambient occlusion, every building drawn at exactly
the same isometric angle and the same scale relationship, tidy and coherent like one
single model kit.
```

---

## Am Bild ausgemessene Werte

Gelten für die aktuelle Kulisse. Bei einem neuen Bild **neu ausmessen**, nicht
übernehmen — der Bildgenerator trifft den Winkel nicht auf die Kommastelle.

| Wert | Aktuell |
|---|---|
| Fassadenachse, Gefälle nach rechts | **0,414** (nicht 0,5) |
| Geschossabstand im HQ | **145 Bildpunkte** |
| Liftstopps im HQ | x = 806, y = 505 / 650 / 795 |
| Liegeachse, Kopfende oben rechts | **−0,393 Bogenmass** |
| Liegeachse, Kopfende oben links | **+0,393 Bogenmass** |

Betten, Strandliegen und Hantelbänke stehen **nicht alle in derselben Diagonale**.
Welche gilt, sagt der Richtungspfeil, der beim Platz gesetzt wurde.

## Nacharbeit nach jedem neuen Bild

1. Als `.webp` mit Qualität 90 ablegen (aus 7 MB PNG werden rund 770 KB).
2. Achse und Geschossabstand neu ausmessen.
3. Datenschicht neu setzen — Plätze, Wege, Halte, Vordergrund.
4. `python werkzeug/netz_heilen.py` laufen lassen.
