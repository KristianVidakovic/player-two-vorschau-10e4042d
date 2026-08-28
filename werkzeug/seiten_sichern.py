# -*- coding: utf-8 -*-
"""Sichert einen Stand der Website oder holt ihn zurueck.

Das Gegenstueck zu stand_sichern.py, das nur die Stadtdaten sichert.
Hier geht es um die Seiten selbst.

    python werkzeug/seiten_sichern.py "warum"        sichert den Stand
    python werkzeug/seiten_sichern.py --liste        zeigt alle Staende
    python werkzeug/seiten_sichern.py --zurueck NAME holt einen Stand zurueck

Gesichert werden die vier Seiten, der Ordner data und die Werkzeugskripte -
also alles, woran gearbeitet wird. Die Bilder in assets kommen NICHT mit:
sie sind 94 MB gross und aendern sich fast nie. Stattdessen wird eine Liste
mit ihren Groessen und Pruefsummen abgelegt. Beim Zurueckholen wird geprueft,
ob noch dieselben Bilder da sind, und gemeldet, wenn nicht.
"""
import datetime
import hashlib
import io
import json
import os
import shutil
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDNER = os.path.join(WURZEL, 'werkzeug', 'staende')

SEITEN = ['index.html', 'loesungen.html', 'team.html', 'stadt.html', 'stil.html']
MIT = ['data', 'werkzeug']            # Ordner, die ganz mitkommen
OHNE = ['werkzeug/staende', 'werkzeug/abzuege', 'werkzeug/abgelegt',
        'werkzeug/kulisse']   # 35 MB Bildentwuerfe der Stadt, aendern sich nicht


def pruefsumme(pfad):
    h = hashlib.sha256()
    with open(pfad, 'rb') as f:
        for brocken in iter(lambda: f.read(65536), b''):
            h.update(brocken)
    return h.hexdigest()[:16]


def bilderliste():
    """Groesse und Pruefsumme jeder Datei in assets."""
    liste = {}
    fuer = os.path.join(WURZEL, 'assets')
    for wurzel, _, dateien in os.walk(fuer):
        for d in dateien:
            voll = os.path.join(wurzel, d)
            rel = os.path.relpath(voll, WURZEL).replace(os.sep, '/')
            liste[rel] = {'groesse': os.path.getsize(voll),
                          'pruefsumme': pruefsumme(voll)}
    return liste


def sichern(grund):
    jetzt = datetime.datetime.now()
    name = 'website_' + jetzt.strftime('%Y-%m-%d_%H%M')
    ziel = os.path.join(ORDNER, name)
    if os.path.exists(ziel):
        shutil.rmtree(ziel)
    os.makedirs(ziel)

    anzahl = 0
    for s in SEITEN:
        q = os.path.join(WURZEL, s)
        if os.path.exists(q):
            shutil.copy2(q, os.path.join(ziel, s))
            anzahl += 1

    for unter in MIT:
        for wurzel, _, dateien in os.walk(os.path.join(WURZEL, unter)):
            rel_ordner = os.path.relpath(wurzel, WURZEL).replace(os.sep, '/')
            if any(rel_ordner == a or rel_ordner.startswith(a + '/') for a in OHNE):
                continue
            for d in dateien:
                voll = os.path.join(wurzel, d)
                rel = os.path.relpath(voll, WURZEL)
                zp = os.path.join(ziel, rel)
                os.makedirs(os.path.dirname(zp), exist_ok=True)
                shutil.copy2(voll, zp)
                anzahl += 1

    zettel = {
        'stand': jetzt.strftime('%Y-%m-%d %H:%M'),
        'grund': grund,
        'dateien': anzahl,
        'bilder': bilderliste(),
    }
    io.open(os.path.join(ziel, '_ZETTEL.json'), 'w', encoding='utf-8').write(
        json.dumps(zettel, ensure_ascii=False, indent=1))

    groesse = sum(os.path.getsize(os.path.join(w, f))
                  for w, _, fs in os.walk(ziel) for f in fs)
    print('Gesichert: %s' % name)
    print('  %d Dateien, %.1f MB, dazu %d Bilder als Pruefliste'
          % (anzahl, groesse / 1048576, len(zettel['bilder'])))
    print('  Grund: %s' % grund)
    return name


def liste():
    if not os.path.isdir(ORDNER):
        print('Noch nichts gesichert.')
        return
    staende = sorted(d for d in os.listdir(ORDNER)
                     if d.startswith('website_') and
                     os.path.isdir(os.path.join(ORDNER, d)))
    if not staende:
        print('Noch kein Stand der Seiten gesichert.')
        return
    for s in staende:
        z = os.path.join(ORDNER, s, '_ZETTEL.json')
        grund = ''
        if os.path.exists(z):
            grund = json.load(io.open(z, encoding='utf-8')).get('grund', '')
        print('  %-28s %s' % (s, grund))


def zurueck(name):
    quelle = os.path.join(ORDNER, name)
    if not os.path.isdir(quelle):
        print('Kein solcher Stand: %s' % name)
        liste()
        return

    # Vor dem Zurueckholen den jetzigen Stand sichern - sonst ist er weg.
    sichern('automatisch vor dem Zurueckholen von ' + name)

    zettel = os.path.join(quelle, '_ZETTEL.json')
    anders = []
    if os.path.exists(zettel):
        alt = json.load(io.open(zettel, encoding='utf-8')).get('bilder', {})
        neu = bilderliste()
        for pfad, wert in alt.items():
            if pfad not in neu:
                anders.append('fehlt jetzt: ' + pfad)
            elif neu[pfad]['pruefsumme'] != wert['pruefsumme']:
                anders.append('hat sich geaendert: ' + pfad)

    anzahl = 0
    for wurzel, _, dateien in os.walk(quelle):
        for d in dateien:
            if d == '_ZETTEL.json':
                continue
            voll = os.path.join(wurzel, d)
            rel = os.path.relpath(voll, quelle)
            zp = os.path.join(WURZEL, rel)
            os.makedirs(os.path.dirname(zp), exist_ok=True)
            shutil.copy2(voll, zp)
            anzahl += 1

    print('Zurueckgeholt: %s  (%d Dateien)' % (name, anzahl))
    if anders:
        print('ACHTUNG - die Bilder stimmen nicht mehr mit diesem Stand ueberein:')
        for a in anders[:10]:
            print('   ' + a)
        if len(anders) > 10:
            print('   ... und %d weitere' % (len(anders) - 10))


if __name__ == '__main__':
    os.makedirs(ORDNER, exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == '--liste':
        liste()
    elif len(sys.argv) > 2 and sys.argv[1] == '--zurueck':
        zurueck(sys.argv[2])
    else:
        sichern(' '.join(sys.argv[1:]) or 'ohne Angabe')
