/* Player Two — die Stadt.

   Die ganze Welt steht als Daten in diesem einen Abschnitt. Wer etwas
   ergaenzen will, schreibt eine Zeile. Kein Bild wird gemalt, kein Bild
   wird nachgeführt. Deshalb kann die Stadt wachsen, ohne dass jemand
   zeichnet. */

(function (global) {
  'use strict'

  var Iso = global.Iso
  var T = global.Teile
  var G = global.Gebaeude
  var PAL = Iso.PAL
  var ton = Iso.ton
  var HG = T.HG

  /* =================================================================
     1. Zusaetzliche Bauteile
     ================================================================= */

  function sonnenschirm (z, x, y, farbe) {
    z.schatten(x + 0.1, y + 0.1, 0.8, 0.8, 0.14, 0.9)
    z.quader(x + 0.46, y + 0.46, 0, 0.08, 0.08, 1.05, PAL.holzDunkel)
    z.kugel(x + 0.5, y + 0.5, 1.02, 0.62, farbe || PAL.weiss, { flach: 0.42 })
  }

  function liege (z, x, y, achse) {
    var bx = achse === 'x' ? 1.05 : 0.45
    var by = achse === 'x' ? 0.45 : 1.05
    z.schatten(x + 0.05, y + 0.05, bx, by, 0.10, 0.15)
    z.quader(x + 0.05, y + 0.05, 0.10, bx, by, 0.08, PAL.weiss)
    if (achse === 'x') z.quader(x + 0.05, y + 0.05, 0.18, 0.34, by, 0.22, PAL.weiss)
    else z.quader(x + 0.05, y + 0.05, 0.18, bx, 0.34, 0.22, PAL.weiss)
  }

  function gartentisch (z, x, y, schirm) {
    z.schatten(x + 0.2, y + 0.2, 0.6, 0.6, 0.10, 0.3)
    z.quader(x + 0.44, y + 0.44, 0, 0.10, 0.10, 0.34, PAL.stahl)
    z.kugel(x + 0.5, y + 0.5, 0.40, 0.42, PAL.weiss, { flach: 0.34 })
    z.quader(x + 0.10, y + 0.34, 0, 0.22, 0.28, 0.26, PAL.holz)
    z.quader(x + 0.70, y + 0.34, 0, 0.22, 0.28, 0.26, PAL.holz)
    if (schirm) {
      z.quader(x + 0.46, y + 0.46, 0.40, 0.06, 0.06, 0.75, PAL.holzDunkel)
      z.kugel(x + 0.5, y + 0.5, 1.12, 0.58, schirm, { flach: 0.40 })
    }
  }

  function tor (z, x, y, achse) {
    var l = 2.2
    if (achse === 'x') {
      z.quader(x, y + 0.45, 0, 0.09, 0.09, 0.72, PAL.weiss)
      z.quader(x + l, y + 0.45, 0, 0.09, 0.09, 0.72, PAL.weiss)
      z.quader(x, y + 0.45, 0.68, l, 0.09, 0.09, PAL.weiss)
    } else {
      z.quader(x + 0.45, y, 0, 0.09, 0.09, 0.72, PAL.weiss)
      z.quader(x + 0.45, y + l, 0, 0.09, 0.09, 0.72, PAL.weiss)
      z.quader(x + 0.45, y, 0.68, 0.09, l, 0.09, PAL.weiss)
    }
  }

  function brunnen (z, x, y) {
    z.schatten(x, y, 2, 2, 0.14, 0.3)
    z.quader(x + 0.1, y + 0.1, 0, 1.8, 1.8, 0.26, PAL.grauHell)
    z.platte(x + 0.28, y + 0.28, 0.24, 1.44, 1.44, PAL.akzentHell, { kontur: ton(PAL.akzentHell, 0.85) })
    z.quader(x + 0.85, y + 0.85, 0.24, 0.3, 0.3, 0.55, PAL.grauHell)
    z.kugel(x + 1.0, y + 1.0, 0.86, 0.30, ton(PAL.akzentHell, 1.25))
  }

  function turmuhr (z, x, y, hoehe) {
    z.quader(x, y, hoehe, 1.5, 1.5, 1.5, PAL.weiss)
    z.quader(x - 0.12, y - 0.12, hoehe + 1.5, 1.74, 1.74, 0.16, PAL.schiefer)
    z.feldLinks(y + 1.5, x + 0.35, x + 1.15, hoehe + 0.55, hoehe + 1.15, PAL.putz)
    z.feldRechts(x + 1.5, y + 0.35, y + 1.15, hoehe + 0.55, hoehe + 1.15, PAL.putz)
    /* Spitze */
    z.quader(x + 0.25, y + 0.25, hoehe + 1.66, 1.0, 1.0, 0.65, PAL.schiefer)
    z.quader(x + 0.6, y + 0.6, hoehe + 2.31, 0.3, 0.3, 0.4, PAL.akzent)
  }

  function fahne (z, x, y) {
    z.quader(x + 0.46, y + 0.46, 0, 0.09, 0.09, 2.1, PAL.grauHell)
    z.quader(x + 0.55, y + 0.44, 1.55, 0.9, 0.05, 0.45, PAL.akzent)
  }

  /* =================================================================
     2. Gebaeudetypen
     ================================================================= */

  /* Allzweckhaus. Aus Zahlen: Stellung, Groesse, Geschosse, Farbe.
     Damit entstehen Restaurant, Bar, Schule und Wohnhaeuser. */
  function haus (z, buehne, def) {
    var x = def.x, y = def.y, b = def.b, t = def.t
    var n = def.geschosse || 1
    var farbe = def.farbe || PAL.putz
    var g

    buehne.setze(x, y, -1, function () {
      z.schatten(x, y, b, t, 0.16, n * HG)
      z.quader(x - 0.20, y - 0.20, 0, b + 0.40, t + 0.40, 0.14, def.sockel || '#CFC9BF')
    }, -1)

    for (g = 0; g < n; g++) {
      (function (etage) {
        buehne.setze(x, y, etage * HG, function () {
          var z0 = etage * HG
          var f = etage === 0 && def.sockelFarbe ? def.sockelFarbe : farbe
          z.quader(x, y, z0, b, t, HG, f)
          fensterBand(z, x, y, b, t, z0 + 0.40, z0 + 1.02, def.glas)
          if (etage === 0 && def.eingang !== false) {
            var tx = x + Math.floor(b / 2) - 1
            z.feldLinks(y + t, tx, tx + 1.5, 0, 0.92, ton(f, 0.82))
            z.feldLinks(y + t, tx + 0.14, tx + 1.36, 0.05, 0.85, PAL.glas)
          }
        }, 1)
      })(g)
    }

    /* Dach */
    buehne.setze(x, y, n * HG, function () {
      var zd = n * HG
      if (def.dach === 'flach') {
        z.quader(x, y, zd, b, t, 0.10, ton(farbe, 0.94))
        z.quader(x, y, zd + 0.10, b, 0.16, 0.24, ton(farbe, 1.04))
        z.quader(x, y + t - 0.16, zd + 0.10, b, 0.16, 0.24, ton(farbe, 1.04))
        z.quader(x, y, zd + 0.10, 0.16, t, 0.24, ton(farbe, 1.04))
        z.quader(x + b - 0.16, y, zd + 0.10, 0.16, t, 0.24, ton(farbe, 1.04))
      } else {
        /* Abgetreppte Schraege. In der flachen Bildsprache genuegen drei Stufen. */
        var stufen = 3, i, ein
        for (i = 0; i < stufen; i++) {
          ein = (i + 1) * 0.42
          z.quader(x + ein - 0.42, y + ein - 0.42, zd + i * 0.30,
            b - (ein - 0.42) * 2, t - (ein - 0.42) * 2, 0.32, def.dachFarbe || PAL.schiefer)
        }
      }
      if (def.schild) beschriftung(z, x, y, b, t, n * HG)
    }, 8)
  }

  function fensterBand (z, x, y, b, t, z0, z1, glas) {
    var i = x + 0.42
    while (i + 0.80 <= x + b - 0.42) {
      z.feldLinks(y + t, i, i + 0.80, z0, z1, glas || PAL.glas)
      i += 1.30
    }
    var j = y + 0.42
    while (j + 0.80 <= y + t - 0.42) {
      z.feldRechts(x + b, j, j + 0.80, z0, z1, glas || PAL.glas)
      j += 1.30
    }
  }

  /* Ein Schriftband ueber dem Eingang. Der Text steht nicht drin, das
     Band ist nur die Form. Beschriftet wird spaeter mit echten Namen. */
  function beschriftung (z, x, y, b, t, hoehe) {
    z.quader(x + 0.8, y + t - 0.05, hoehe - 0.55, b - 1.6, 0.14, 0.42, PAL.navy)
    z.feldLinks(y + t + 0.09, x + 1.1, x + b - 1.9, hoehe - 0.42, hoehe - 0.22, PAL.akzentHell)
  }

  /* Schule mit offenem Dach: man sieht die Schulbaenke.
     Wer noch nicht freigegeben ist, sitzt hier. */
  function schule (z, buehne, def, schueler) {
    var x = def.x, y = def.y, b = def.b, t = def.t
    var i, j

    buehne.setze(x, y, -1, function () {
      z.schatten(x, y, b, t, 0.16, HG * 2)
      z.quader(x - 0.20, y - 0.20, 0, b + 0.40, t + 0.40, 0.14, '#CFC9BF')
    }, -1)

    buehne.setze(x, y, -0.5, function () {
      z.quader(x, y, 0, b, t, HG, '#E7E1D2')
      fensterBand(z, x, y, b, t, 0.42, 1.02)
      var tx = x + Math.floor(b / 2) - 1
      z.feldLinks(y + t, tx, tx + 1.6, 0, 0.95, '#D8CFBC')
      z.feldLinks(y + t, tx + 0.15, tx + 1.45, 0.06, 0.88, PAL.glas)
      z.quader(tx - 0.3, y + t, 0.98, 2.2, 0.5, 0.10, PAL.akzent)
    }, 0)

    /* Offenes Obergeschoss */
    for (i = 0; i < b; i++) {
      for (j = 0; j < t; j++) {
        (function (cx, cy) {
          buehne.setze(x + cx, y + cy, HG, function () {
            var f = (cx + cy) % 2 === 0 ? '#EDE8DC' : '#E9E3D6'
            z.platte(x + cx, y + cy, HG, 1, 1, f, { kontur: ton(f, 0.95) })
          }, 1)
        })(i, j)
      }
    }
    buehne.setze(x, y, HG, function () {
      z.quader(x, y, HG, b, 0.16, HG, '#EDE8DC')
      z.quader(x, y, HG, 0.16, t, HG, '#EDE8DC')
      /* Wandtafel an der hinteren Wand */
      z.feldLinks(y + 0.17, x + 1.2, x + b - 1.2, HG + 0.35, HG + 1.00, '#3E4A44')
    }, 2)

    /* Schulbaenke, so viele wie noetig. */
    var reihen = Math.max(2, Math.ceil(Math.sqrt(schueler)))
    var spalten = Math.ceil(schueler / reihen)
    for (i = 0; i < spalten; i++) {
      for (j = 0; j < reihen; j++) {
        (function (sx, sy) {
          var px = x + 1.5 + sx * 1.6
          var py = y + 2.0 + sy * 1.5
          if (px + 1 > x + b - 1 || py + 1 > y + t - 1) return
          buehne.setze(px, py, HG, function () {
            z.quader(px, py, HG + 0.30, 1.1, 0.5, 0.07, ton(PAL.holz, 1.18))
            z.quader(px + 0.06, py + 0.06, HG, 0.06, 0.06, 0.30, PAL.grau)
            z.quader(px + 0.98, py + 0.38, HG, 0.06, 0.06, 0.30, PAL.grau)
          }, 5)
        })(i, j)
      }
    }
  }

  function schwimmbad (z, buehne, x, y, b, t) {
    var i, j
    for (i = 0; i < b; i++) {
      for (j = 0; j < t; j++) {
        (function (cx, cy) {
          buehne.setze(x + cx, y + cy, 0, function () {
            T.boden(z, x + cx, y + cy, 'gehweg')
          }, 0)
        })(i, j)
      }
    }
    /* Becken */
    var bx = x + 1.5, by = y + 1.5, bb = b - 3, bt = t - 3.4
    buehne.setze(bx, by, 0, function () {
      z.quader(bx - 0.3, by - 0.3, 0, bb + 0.6, bt + 0.6, 0.16, PAL.weiss)
      z.platte(bx, by, 0.10, bb, bt, ton(PAL.akzentHell, 0.92),
        { kontur: ton(PAL.akzentHell, 0.72) })
      /* Bahnenmarkierung */
      var k
      for (k = 1; k < bt; k += 1.6) {
        z.platte(bx + 0.2, by + k, 0.11, bb - 0.4, 0.09, ton(PAL.akzentHell, 1.22), { kontur: false })
      }
    }, 1)
    buehne.setze(x + b - 2, y + t - 2, 0, function () {
      liege(z, x + b - 2.4, y + t - 1.5, 'x')
      liege(z, x + b - 4.0, y + t - 1.5, 'x')
      sonnenschirm(z, x + b - 3.2, y + t - 2.6, ton(PAL.akzent, 1.5))
    }, 6)
  }

  function sportplatz (z, buehne, x, y, b, t) {
    var i, j
    for (i = 0; i < b; i++) {
      for (j = 0; j < t; j++) {
        (function (cx, cy) {
          buehne.setze(x + cx, y + cy, 0, function () {
            var f = (cx + cy) % 2 === 0 ? '#93A886' : '#8CA280'
            z.platte(x + cx, y + cy, 0, 1, 1, f, { kontur: ton(f, 0.95) })
          }, 0)
        })(i, j)
      }
    }
    buehne.setze(x, y, 0, function () {
      /* Linien */
      var w = '#E6E9E0'
      z.platte(x + 0.8, y + 0.8, 0.02, b - 1.6, 0.10, w, { kontur: false })
      z.platte(x + 0.8, y + t - 0.9, 0.02, b - 1.6, 0.10, w, { kontur: false })
      z.platte(x + 0.8, y + 0.8, 0.02, 0.10, t - 1.6, w, { kontur: false })
      z.platte(x + b - 0.9, y + 0.8, 0.02, 0.10, t - 1.6, w, { kontur: false })
      z.platte(x + b / 2 - 0.05, y + 0.8, 0.02, 0.10, t - 1.6, w, { kontur: false })
      z.kugel(x + b / 2, y + t / 2, 0.03, 1.5, '#8CA280', { flach: 0.5, kontur: false })
      z.platte(x + b / 2 - 1.5, y + t / 2 - 0.05, 0.03, 3, 0.10, w, { kontur: false })
    }, 1)
    buehne.setze(x + 1, y + t / 2, 0, function () { tor(z, x + 0.9, y + t / 2 - 1.1, 'y') }, 5)
    buehne.setze(x + b - 1, y + t / 2, 0, function () { tor(z, x + b - 1.1, y + t / 2 - 1.1, 'y') }, 5)
  }

  /* =================================================================
     3. Der Bauplan der Stadt
     ================================================================= */

  var WELT = { b: 66, t: 58 }

  var STRASSEN = [
    { achse: 'y', wert: 24, von: 0, bis: 66 },
    { achse: 'y', wert: 46, von: 0, bis: 66 },
    { achse: 'x', wert: 25, von: 0, bis: 50 },
    { achse: 'x', wert: 48, von: 0, bis: 30 }
  ]

  var RASEN = [
    { x: 0, y: 0, b: 4, t: 24 },
    { x: 16, y: 0, b: 9, t: 4 },
    { x: 27, y: 22, b: 21, t: 2 },
    { x: 0, y: 40, b: 4, t: 6 }
  ]

  var SAND = [{ x: 0, y: 48, b: 66, t: 3 }]
  var WASSER = [{ x: 0, y: 51, b: 66, t: 7 }]

  /* Alles, was gebaut ist. Eine Zeile pro Haus. */
  function bauplan (daten) {
    var digital = daten.anzahl_digital || 0
    var lernende = 0
    daten.abteilungen.forEach(function (a) {
      a.mitarbeitende.forEach(function (m) { if (m.status === 'ausbildung') lernende++ })
    })

    return {
      hq: { x: 27, y: 3 },
      schule: { x: 4, y: 3, b: 12, t: 10, schueler: Math.max(6, Math.min(14, lernende)) },
      wohnhaus: { x: 4, y: 15, b: 10, t: 8, bewohner: digital },
      parzellen: [
        { x: 50, y: 3, b: 7, t: 8 },
        { x: 50, y: 13, b: 7, t: 8 },
        { x: 59, y: 3, b: 6, t: 8 },
        { x: 59, y: 13, b: 6, t: 8 }
      ],
      haeuser: [
        { x: 17, y: 5, b: 6, t: 6, geschosse: 2, farbe: '#E6E0D2', dach: 'schraeg', dachFarbe: '#6E7A84' },
        { x: 17, y: 13, b: 6, t: 8, geschosse: 3, farbe: '#DFE3DA', dach: 'flach' },
        { x: 4, y: 27, b: 10, t: 8, geschosse: 2, farbe: '#E9E1CF', dach: 'schraeg',
          dachFarbe: '#8C6F5C', schild: true, name: 'Restaurant' },
        { x: 16, y: 27, b: 7, t: 7, geschosse: 2, farbe: '#2C3550', sockelFarbe: '#232B44',
          dach: 'flach', glas: '#7C93AC', schild: true, name: 'Bar' },
        { x: 52, y: 27, b: 8, t: 7, geschosse: 2, farbe: '#E4E7DE', dach: 'schraeg', dachFarbe: '#6E7A84' },
        { x: 52, y: 37, b: 8, t: 7, geschosse: 2, farbe: '#EBE4D6', dach: 'schraeg', dachFarbe: '#8C6F5C' },
        { x: 27, y: 48, b: 5, t: 3, geschosse: 1, farbe: '#E9E3D4', dach: 'flach',
          schild: true, name: 'Strandbar' }
      ],
      schwimmbad: { x: 26, y: 27, b: 12, t: 9 },
      sportplatz: { x: 26, y: 37, b: 20, t: 8 },
      brunnen: { x: 20, y: 22 },
      strandDeko: [
        { x: 6, y: 48.6 }, { x: 13, y: 49 }, { x: 20, y: 48.4 },
        { x: 38, y: 48.8 }, { x: 46, y: 48.4 }, { x: 54, y: 49 }
      ],
      gruen: [
        { x: 1, y: 2, g: 1.1 }, { x: 2, y: 8, g: 0.95 }, { x: 1, y: 14, g: 1.05 },
        { x: 2, y: 20, g: 0.9 }, { x: 18, y: 1, g: 1.0 }, { x: 22, y: 2, g: 1.1 },
        { x: 15, y: 11, g: 0.95 }, { x: 15, y: 22, g: 1.05 }, { x: 23, y: 12, g: 1.0 },
        { x: 30, y: 22, g: 1.1 }, { x: 36, y: 22, g: 0.95 }, { x: 42, y: 22, g: 1.05 },
        { x: 24, y: 30, g: 1.0 }, { x: 24, y: 40, g: 1.1 }, { x: 15, y: 36, g: 0.95 },
        { x: 15, y: 42, g: 1.05 }, { x: 47, y: 30, g: 1.0 }, { x: 47, y: 41, g: 0.9 },
        { x: 61, y: 27, g: 1.05 }, { x: 61, y: 38, g: 1.0 }, { x: 4, y: 41, g: 1.1 },
        { x: 1, y: 44, g: 0.95 }, { x: 50, y: 22, g: 1.0 }, { x: 56, y: 22, g: 1.05 }
      ],
      moebel: [
        { was: 'laterne', x: 24, y: 10 }, { was: 'laterne', x: 24, y: 18 },
        { was: 'laterne', x: 24, y: 32 }, { was: 'laterne', x: 24, y: 42 },
        { was: 'laterne', x: 47, y: 10 }, { was: 'laterne', x: 47, y: 18 },
        { was: 'laterne', x: 12, y: 25 }, { was: 'laterne', x: 34, y: 25 },
        { was: 'laterne', x: 12, y: 47 }, { was: 'laterne', x: 40, y: 47 },
        { was: 'bank', x: 21, y: 25, a: 'x' }, { was: 'bank', x: 23, y: 25, a: 'x' },
        { was: 'bank', x: 30, y: 47, a: 'x' }, { was: 'bank', x: 33, y: 47, a: 'x' },
        { was: 'eimer', x: 25, y: 26 }, { was: 'eimer', x: 46, y: 26 },
        { was: 'raeder', x: 20, y: 12, n: 4 }, { was: 'raeder', x: 40, y: 25, n: 3 },
        { was: 'wagen', x: 25.2, y: 14, a: 'y', f: '#3B4761' },
        { was: 'wagen', x: 34, y: 24.3, a: 'x', f: PAL.akzent },
        { was: 'wagen', x: 18, y: 46.3, a: 'x', f: '#7C8794' },
        { was: 'hecke', x: 4, y: 25.4, l: 9, a: 'x' },
        { was: 'hecke', x: 16, y: 25.4, l: 6, a: 'x' },
        { was: 'busch', x: 15, y: 4 }, { was: 'busch', x: 15, y: 14 },
        { was: 'busch', x: 23, y: 5 }, { was: 'busch', x: 23, y: 20 },
        { was: 'fahne', x: 26, y: 23 }
      ],
      terrasse: [
        { x: 5, y: 35.4 }, { x: 7, y: 35.4 }, { x: 9, y: 35.4 }, { x: 11, y: 35.4 }
      ]
    }
  }

  /* =================================================================
     4. Bauen
     ================================================================= */

  function istIn (liste, x, y) {
    for (var i = 0; i < liste.length; i++) {
      var f = liste[i]
      if (x >= f.x && x < f.x + f.b && y >= f.y && y < f.y + f.t) return true
    }
    return false
  }

  function istStrasse (x, y) {
    for (var i = 0; i < STRASSEN.length; i++) {
      var s = STRASSEN[i]
      if (s.achse === 'y' && y >= s.wert && y < s.wert + 2 && x >= s.von && x < s.bis) return true
      if (s.achse === 'x' && x >= s.wert && x < s.wert + 2 && y >= s.von && y < s.bis) return true
    }
    return false
  }

  function belegung (plan) {
    var b = []
    var hqPlan = plan.hqPlan
    b.push({ x: plan.hq.x - 1, y: plan.hq.y - 1, b: hqPlan.breite + 2, t: hqPlan.tiefe + 2 })
    b.push({ x: plan.schule.x - 1, y: plan.schule.y - 1, b: plan.schule.b + 2, t: plan.schule.t + 2 })
    b.push({ x: plan.wohnhaus.x - 1, y: plan.wohnhaus.y - 1, b: plan.wohnhaus.b + 2, t: plan.wohnhaus.t + 2 })
    plan.parzellen.forEach(function (p) { b.push(p) })
    plan.haeuser.forEach(function (h) {
      b.push({ x: h.x - 1, y: h.y - 1, b: h.b + 2, t: h.t + 2 })
    })
    b.push(plan.schwimmbad)
    b.push(plan.sportplatz)
    b.push(SAND[0])
    b.push(WASSER[0])
    return b
  }

  function bauen (z, buehne, daten) {
    var plan = bauplan(daten)
    plan.hqPlan = G.grundriss(daten.abteilungen)
    var belegt = belegung(plan)
    var x, y

    /* --- Boden --- */
    for (y = 0; y < WELT.t; y++) {
      for (x = 0; x < WELT.b; x++) {
        (function (cx, cy) {
          if (istIn(belegt, cx, cy)) return
          var art = istStrasse(cx, cy) ? 'strasse'
            : istIn(RASEN, cx, cy) ? 'rasen' : 'gehweg'
          buehne.setze(cx, cy, 0, function () { T.boden(z, cx, cy, art) }, -2)
        })(x, y)
      }
    }

    /* --- Strand und Wasser --- */
    SAND.forEach(function (s) {
      for (y = 0; y < s.t; y++) {
        for (x = 0; x < s.b; x++) {
          (function (cx, cy) {
            buehne.setze(cx, cy, 0, function () { T.boden(z, cx, cy, 'sand') }, -2)
          })(s.x + x, s.y + y)
        }
      }
    })
    WASSER.forEach(function (w) {
      for (y = 0; y < w.t; y++) {
        for (x = 0; x < w.b; x++) {
          (function (cx, cy, tief) {
            buehne.setze(cx, cy, 0, function () {
              var grund = tief < 2 ? '#A9D6DE' : (tief < 4 ? '#8CC3D2' : '#6FAEC2')
              var f = (cx + cy) % 2 === 0 ? grund : ton(grund, 0.97)
              z.platte(cx, cy, 0, 1, 1, f, { kontur: ton(f, 0.96) })
            }, -2)
          })(w.x + x, w.y + y, y)
        }
      }
    })

    /* --- Anlagen --- */
    schwimmbad(z, buehne, plan.schwimmbad.x, plan.schwimmbad.y, plan.schwimmbad.b, plan.schwimmbad.t)
    sportplatz(z, buehne, plan.sportplatz.x, plan.sportplatz.y, plan.sportplatz.b, plan.sportplatz.t)

    /* --- Freie Parzellen --- */
    plan.parzellen.forEach(function (p) {
      G.parzelle(z, buehne, p.x, p.y, p.b, p.t)
    })

    /* --- Haeuser --- */
    plan.haeuser.forEach(function (h) { haus(z, buehne, h) })

    /* --- Schule --- */
    schule(z, buehne, plan.schule, plan.schule.schueler)

    /* --- Wohnhaus, waechst mit der Belegschaft --- */
    var w = plan.wohnhaus
    var geschosse = G.wohnhaus(z, buehne, w.bewohner, w.x, w.y, w.b, w.t)

    /* --- Das HQ --- */
    var hq = G.hq(z, buehne, daten, plan.hq.x, plan.hq.y)

    /* --- Gruen und Moebel --- */
    plan.gruen.forEach(function (g) {
      buehne.setze(g.x, g.y, 0, function () { T.baum(z, g.x, g.y, g.g) }, 7)
    })

    plan.moebel.forEach(function (m) {
      buehne.setze(m.x, m.y, 0, function () {
        if (m.was === 'laterne') T.laterne(z, m.x, m.y)
        else if (m.was === 'bank') T.bank(z, m.x, m.y, m.a)
        else if (m.was === 'eimer') T.abfalleimer(z, m.x, m.y)
        else if (m.was === 'raeder') T.fahrradstaender(z, m.x, m.y, m.n)
        else if (m.was === 'wagen') T.lieferwagen(z, m.x, m.y, m.a, m.f)
        else if (m.was === 'hecke') T.hecke(z, m.x, m.y, m.l, m.a)
        else if (m.was === 'busch') T.busch(z, m.x, m.y)
        else if (m.was === 'fahne') fahne(z, m.x, m.y)
      }, 7)
    })

    plan.terrasse.forEach(function (t2, i) {
      buehne.setze(t2.x, t2.y, 0, function () {
        gartentisch(z, t2.x, t2.y, i % 2 === 0 ? '#D8CBB4' : null)
      }, 7)
    })

    plan.strandDeko.forEach(function (s, i) {
      buehne.setze(s.x, s.y, 0, function () {
        sonnenschirm(z, s.x, s.y, i % 2 === 0 ? '#E4D9C4' : ton(PAL.akzentHell, 1.2))
        liege(z, s.x + 1.1, s.y + 0.2, 'y')
      }, 7)
    })

    buehne.setze(plan.brunnen.x, plan.brunnen.y, 0, function () {
      brunnen(z, plan.brunnen.x, plan.brunnen.y)
    }, 7)

    return {
      welt: WELT,
      hq: { x: plan.hq.x, y: plan.hq.y, b: hq.breite, t: hq.tiefe, hoehe: hq.hoehe, ebenen: hq.ebenen },
      geschosse: geschosse,
      plan: plan
    }
  }

  global.Welt = { bauen: bauen, WELT: WELT, bauplan: bauplan }
})(window)
