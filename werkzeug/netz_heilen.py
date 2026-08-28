# -*- coding: utf-8 -*-
"""Findet abgehaengte Inseln im Wegenetz und bindet sie an.

Ein Weg, der nirgends an einen anderen anschliesst, bildet eine Insel: Man
kommt dorthin nicht hin. Das passiert leicht, wenn beim Zeichnen ein paar
Bildpunkte fehlen. Dieses Werkzeug rechnet die Inseln aus und legt jeweils
die kuerzest moegliche Verbindung zum Rest.

Aufruf:  python werkzeug/netz_heilen.py [--pruefen]
Mit --pruefen wird nur berichtet, nichts geaendert.
"""
import io
import json
import math
import os
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATEI = os.path.join(WURZEL, 'data', 'stadt-wege.json')

SCHNAPP = 34        # muss zu netz.js passen
ANSCHLUSS = 110


def netz_bauen(daten):
    """Baut dasselbe Netz wie netz.js, gibt Knoten und Nachbarschaft zurueck."""
    knoten = []          # [x, y, ist_nabe]
    raster = {}
    kanten = {}

    def hole(x, y, neu=False):
        if not neu:
            gx, gy = int(x // SCHNAPP), int(y // SCHNAPP)
            for i in (-1, 0, 1):
                for j in (-1, 0, 1):
                    for k in raster.get((gx + i, gy + j), []):
                        if knoten[k][2]:
                            continue
                        if math.hypot(knoten[k][0] - x, knoten[k][1] - y) <= SCHNAPP:
                            return k
        knoten.append([x, y, neu])
        raster.setdefault((int(x // SCHNAPP), int(y // SCHNAPP)), []).append(len(knoten) - 1)
        return len(knoten) - 1

    def kante(a, b):
        if a == b:
            return
        kanten.setdefault(a, set()).add(b)
        kanten.setdefault(b, set()).add(a)

    wegknoten = {}
    for w in daten['wege']:
        p = w['punkte']
        if len(p) < 2:
            continue
        ids = []
        vor = hole(*p[0])
        ids.append(vor)
        for q in p[1:]:
            jetzt = hole(*q)
            kante(vor, jetzt)
            ids.append(jetzt)
            vor = jetzt
        wegknoten[w['name']] = ids

    gruppen = {}
    for h in daten.get('halte', []):
        k = hole(h['x'], h['y'])
        best = None
        for i, n in enumerate(knoten):
            if i == k or n[2]:
                continue
            l = math.hypot(n[0] - h['x'], n[1] - h['y'])
            if best is None or l < best[0]:
                best = (l, i)
        if best and best[0] <= ANSCHLUSS:
            kante(k, best[1])
        s = h['name'].lower().replace('ü', 'u').replace('ö', 'o').replace('ä', 'a')
        g = ('zwischen' if 'zwischen' in s else
             'wohnhaus' if 'wohnhaus' in s else
             'schule' if 'schule' in s else
             'restaurant' if 'restaur' in s else
             'schwimmbad' if 'schwimm' in s else
             'sport' if 'sport' in s else
             'bar' if s.strip().endswith('bar') or ' bar' in s else
             'hq' if ('hq' in s or 'lift' in s or 'buro' in s) else 'sonstige')
        gruppen.setdefault(g, []).append(k)

    for g, ms in gruppen.items():
        if len(ms) < 2:
            continue
        nabe = hole(sum(knoten[m][0] for m in ms) / len(ms),
                    sum(knoten[m][1] for m in ms) / len(ms), True)
        for m in ms:
            kante(m, nabe)

    return knoten, kanten, wegknoten


def teile(knoten, kanten):
    gesehen = {}
    gruppen = []
    for start in range(len(knoten)):
        if start in gesehen:
            continue
        stapel = [start]
        gruppe = []
        gesehen[start] = len(gruppen)
        while stapel:
            k = stapel.pop()
            gruppe.append(k)
            for nb in kanten.get(k, ()):
                if nb not in gesehen:
                    gesehen[nb] = len(gruppen)
                    stapel.append(nb)
        gruppen.append(gruppe)
    return gruppen, gesehen


def main():
    nur_pruefen = '--pruefen' in sys.argv
    d = json.load(io.open(DATEI, encoding='utf-8'))
    geaendert = False

    vorher = len(d['wege'])
    d['wege'] = [w for w in d['wege'] if len(w.get('punkte', [])) >= 2]
    if len(d['wege']) != vorher:
        print('%d Wege ohne Strecke entfernt' % (vorher - len(d['wege'])))
        geaendert = True

    # Eine Flaeche braucht mindestens drei Ecken, sonst umschliesst sie nichts.
    vorher = len(d.get('vorne', []))
    d['vorne'] = [p for p in d.get('vorne', []) if len(p) >= 3]
    if len(d['vorne']) != vorher:
        print('%d Vordergrundflaechen mit weniger als drei Ecken entfernt'
              % (vorher - len(d['vorne'])))
        geaendert = True

    # Plaetze ohne brauchbare Angaben.
    vorher = len(d.get('plaetze', []))
    d['plaetze'] = [p for p in d.get('plaetze', [])
                    if isinstance(p.get('x'), (int, float)) and isinstance(p.get('y'), (int, float))]
    if len(d['plaetze']) != vorher:
        print('%d unvollstaendige Plaetze entfernt' % (vorher - len(d['plaetze'])))
        geaendert = True

    neue = 0
    for runde in range(12):
        knoten, kanten, wegknoten = netz_bauen(d)
        gruppen, gesehen = teile(knoten, kanten)
        if len(gruppen) <= 1:
            print('Netz ist zusammenhaengend: %d Knoten in einem Stueck.' % len(knoten))
            break

        gruppen.sort(key=len, reverse=True)
        haupt = set(gruppen[0])
        insel = gruppen[1]
        namen = sorted({n for n, ids in wegknoten.items()
                        if any(gesehen[x] == gesehen[insel[0]] for x in ids)})

        best = None
        for a in insel:
            if knoten[a][2]:
                continue
            for b in haupt:
                if knoten[b][2]:
                    continue
                l = math.hypot(knoten[a][0] - knoten[b][0], knoten[a][1] - knoten[b][1])
                if best is None or l < best[0]:
                    best = (l, a, b)

        if not best:
            print('Insel gefunden, aber keine Verbindung moeglich.')
            break

        print('Insel mit %d Knoten (%s) haengt %.0f Bildpunkte vom Netz entfernt.'
              % (len(insel), ', '.join(namen)[:70], best[0]))
        if nur_pruefen:
            break

        a, b = best[1], best[2]
        d['wege'].append({
            'name': 'anschluss %d' % (runde + 1),
            'punkte': [[int(knoten[a][0]), int(knoten[a][1])],
                       [int(knoten[b][0]), int(knoten[b][1])]]
        })
        neue += 1

    if (neue or geaendert) and not nur_pruefen:
        json.dump(d, io.open(DATEI, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('Gesichert: %d Verbindungsstuecke eingesetzt, %d Wege, %d Flaechen, %d Plaetze.'
              % (neue, len(d['wege']), len(d['vorne']), len(d['plaetze'])))
    elif not neue and not geaendert:
        print('Nichts zu tun.')


if __name__ == '__main__':
    main()
