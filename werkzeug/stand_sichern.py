# -*- coding: utf-8 -*-
"""Sichert oder holt einen Stand der Datenschicht zurueck.

Die ganze Arbeit an der Stadt — Wege, Plaetze, Tueren, Vordergrund — steht in
einer einzigen Datei: data/stadt-wege.json. Dieses Werkzeug legt davon
datierte Kopien an, damit man jederzeit zu einem frueheren Stand zurueck kann.

    python werkzeug/stand_sichern.py                sichert den aktuellen Stand
    python werkzeug/stand_sichern.py --liste        zeigt alle gesicherten Staende
    python werkzeug/stand_sichern.py --zurueck NAME holt einen Stand zurueck
"""
import datetime
import io
import json
import os
import shutil
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUELLE = os.path.join(WURZEL, 'data', 'stadt-wege.json')
ORDNER = os.path.join(WURZEL, 'werkzeug', 'staende')


def umfang(pfad):
    d = json.load(io.open(pfad, encoding='utf-8'))
    return ('%d Wege, %d Tueren, %d Plaetze, %d Flaechen'
            % (len(d.get('wege', [])), len(d.get('halte', [])),
               len(d.get('plaetze', [])), len(d.get('vorne', []))))


def liste():
    if not os.path.isdir(ORDNER):
        print('Noch kein Stand gesichert.')
        return
    namen = sorted(n for n in os.listdir(ORDNER) if n.endswith('.json'))
    if not namen:
        print('Noch kein Stand gesichert.')
        return
    print('Gesicherte Staende in werkzeug/staende:')
    for n in namen:
        print('   %-40s %s' % (n, umfang(os.path.join(ORDNER, n))))


def sichern():
    os.makedirs(ORDNER, exist_ok=True)
    stempel = datetime.datetime.now().strftime('%Y-%m-%d_%H%M')
    ziel = os.path.join(ORDNER, 'stadt-wege_%s.json' % stempel)
    shutil.copyfile(QUELLE, ziel)
    print('Gesichert: %s' % os.path.relpath(ziel, WURZEL))
    print('   %s' % umfang(ziel))


def zurueck(name):
    pfad = os.path.join(ORDNER, name if name.endswith('.json') else name + '.json')
    if not os.path.exists(pfad):
        print('Kein Stand mit diesem Namen. Vorhanden:')
        liste()
        return
    # Vor dem Zurueckholen den jetzigen Stand sichern, sonst ist er weg.
    sichern()
    shutil.copyfile(pfad, QUELLE)
    print('Zurueckgeholt: %s' % name)
    print('   %s' % umfang(QUELLE))
    print('Editor und Stadtseite neu laden.')


if __name__ == '__main__':
    if '--liste' in sys.argv:
        liste()
    elif '--zurueck' in sys.argv:
        i = sys.argv.index('--zurueck')
        if i + 1 >= len(sys.argv):
            print('Bitte den Namen des Standes angeben.')
            liste()
        else:
            zurueck(sys.argv[i + 1])
    else:
        sichern()
