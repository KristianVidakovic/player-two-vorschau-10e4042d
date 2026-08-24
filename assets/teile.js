/* Player Two — Teilesammlung.
   Jedes Teil ist eine Funktion, kein Bild. Deshalb kann der Code die Stadt
   beliebig neu zusammensetzen, ohne dass jemand etwas nachzeichnet. */

(function (global) {
  'use strict'

  var Iso = global.Iso
  var PAL = Iso.PAL
  var ton = Iso.ton

  /* Hoehe eines Geschosses in Hoeheneinheiten. */
  var HG = 1.30

  /* ------------------------------------------------------------ Bodenbelag */
  var BODEN = {
    gehweg:   [PAL.gehwegHell, PAL.gehwegDunkel],
    strasse:  [PAL.strasse, ton(PAL.strasse, 0.96)],
    rasen:    [PAL.rasen, PAL.rasenDunkel],
    erde:     [PAL.erde, ton(PAL.erde, 0.96)],
    sand:     [PAL.sand, ton(PAL.sand, 0.97)],
    parkett:  [PAL.holz, ton(PAL.holz, 0.97)],
    innen:    [PAL.putz, ton(PAL.putz, 0.98)]
  }

  function boden (z, x, y, art) {
    var p = BODEN[art] || BODEN.gehweg
    var f = p[(x + y) % 2]
    z.platte(x, y, 0, 1, 1, f, { kontur: ton(f, 0.90) })
  }

  /* Bodenplatte auf beliebiger Hoehe, fuer Geschossdecken. */
  function decke (z, x, y, bx, by, hoehe, art) {
    var p = BODEN[art] || BODEN.innen
    var i, j, f
    for (i = 0; i < bx; i++) {
      for (j = 0; j < by; j++) {
        f = p[(i + j) % 2]
        z.platte(x + i, y + j, hoehe, 1, 1, f, { kontur: ton(f, 0.93) })
      }
    }
  }

  /* ---------------------------------------------------------------- Gruen */
  function baum (z, x, y, groesse) {
    groesse = groesse || 1
    var h = 0.50 * groesse
    var r = 0.44 * groesse
    z.schatten(x + 0.5 - r, y + 0.5 - r, r * 2, r * 2, 0.16, h)
    z.quader(x + 0.43, y + 0.43, 0, 0.14, 0.14, h, PAL.stamm)
    z.kugel(x + 0.5, y + 0.5, h + 0.30 * groesse, r * 1.05, PAL.laub)
    z.kugel(x + 0.30, y + 0.66, h + 0.16 * groesse, r * 0.62, ton(PAL.laub, 0.94))
    z.kugel(x + 0.68, y + 0.36, h + 0.52 * groesse, r * 0.58, PAL.laubHell)
  }

  function busch (z, x, y) {
    z.schatten(x + 0.16, y + 0.16, 0.68, 0.68, 0.12, 0)
    z.kugel(x + 0.42, y + 0.58, 0.20, 0.36, PAL.laub)
    z.kugel(x + 0.66, y + 0.40, 0.26, 0.28, PAL.laubHell)
  }

  function hecke (z, x, y, laenge, achse) {
    var bx = achse === 'x' ? laenge : 0.55
    var by = achse === 'x' ? 0.55 : laenge
    z.schatten(x + 0.22, y + 0.22, bx, by, 0.12, 0)
    z.quader(x + 0.22, y + 0.22, 0, bx, by, 0.32, PAL.laub)
  }

  function pflanztopf (z, x, y, hoehe) {
    hoehe = hoehe || 0
    z.schatten(x + 0.30, y + 0.30, 0.42, 0.42, 0.10, 0.3)
    z.quader(x + 0.32, y + 0.32, hoehe, 0.36, 0.36, 0.18, ton(PAL.grauHell, 1.06))
    z.kugel(x + 0.5, y + 0.5, hoehe + 0.34, 0.30, PAL.laub)
  }

  /* -------------------------------------------------------- Strassenmoebel */
  function bank (z, x, y, achse) {
    var bx = achse === 'x' ? 0.90 : 0.32
    var by = achse === 'x' ? 0.32 : 0.90
    z.schatten(x + 0.05, y + 0.05, bx, by, 0.12, 0.2)
    z.quader(x + 0.08, y + 0.34, 0, 0.10, 0.10, 0.14, PAL.stahl)
    z.quader(x + 0.05, y + 0.05, 0.14, bx, by, 0.07, PAL.holz)
    if (achse === 'x') z.quader(x + 0.05, y + 0.05, 0.21, bx, 0.07, 0.26, PAL.holz)
    else z.quader(x + 0.05, y + 0.05, 0.21, 0.07, by, 0.26, PAL.holz)
  }

  function laterne (z, x, y) {
    z.schatten(x + 0.40, y + 0.40, 0.22, 0.22, 0.14, 1.2)
    z.quader(x + 0.44, y + 0.44, 0, 0.14, 0.14, 1.55, PAL.schiefer)
    z.quader(x + 0.30, y + 0.44, 1.50, 0.34, 0.14, 0.09, PAL.schiefer)
    z.quader(x + 0.26, y + 0.44, 1.44, 0.16, 0.14, 0.07, PAL.akzentHell)
  }

  function fahrradstaender (z, x, y, anzahl) {
    var i, ox, n = anzahl || 3
    for (i = 0; i < n; i++) {
      ox = x + 0.16 + i * 0.26
      z.quader(ox, y + 0.30, 0, 0.05, 0.05, 0.34, PAL.stahl)
      z.quader(ox, y + 0.62, 0, 0.05, 0.05, 0.34, PAL.stahl)
      z.quader(ox, y + 0.30, 0.30, 0.05, 0.36, 0.05, PAL.stahl)
    }
  }

  function abfalleimer (z, x, y) {
    z.klumpen(x + 0.5, y + 0.5, 0, 0.16, 0.38, PAL.stahl)
  }

  function lieferwagen (z, x, y, achse, farbe) {
    farbe = farbe || PAL.schiefer
    var bx = achse === 'x' ? 1.75 : 0.85
    var by = achse === 'x' ? 0.85 : 1.75
    z.schatten(x, y, bx, by, 0.15, 0.4)
    z.quader(x + 0.10, y + 0.10, 0, 0.18, 0.18, 0.16, PAL.navy)
    z.quader(x + bx - 0.28, y + by - 0.28, 0, 0.18, 0.18, 0.16, PAL.navy)
    z.quader(x, y, 0.10, bx, by, 0.52, farbe)
    if (achse === 'x') {
      z.quader(x + bx - 0.62, y + 0.03, 0.62, 0.60, by - 0.06, 0.20, ton(farbe, 1.18))
      z.quader(x, y, 0.62, bx - 0.62, by, 0.34, PAL.weiss)
      z.feldRechts(x + bx - 0.62, y + 0.06, y + by - 0.06, 0.66, 0.80, PAL.glas)
    } else {
      z.quader(x + 0.03, y + by - 0.62, 0.62, bx - 0.06, 0.60, 0.20, ton(farbe, 1.18))
      z.quader(x, y, 0.62, bx, by - 0.62, 0.34, PAL.weiss)
    }
  }

  /* ---------------------------------------------------------------- Buero */
  function schreibtisch (z, x, y, richtung) {
    z.schatten(x + 0.05, y + 0.05, 0.90, 0.62, 0.10, 0.3)
    z.quader(x + 0.05, y + 0.05, 0.36, 0.90, 0.62, 0.07, ton(PAL.holz, 1.22))
    z.quader(x + 0.10, y + 0.10, 0, 0.06, 0.06, 0.36, PAL.grau)
    z.quader(x + 0.84, y + 0.60, 0, 0.06, 0.06, 0.36, PAL.grau)
    var mx = richtung === 'links' ? x + 0.12 : x + 0.62
    z.quader(mx, y + 0.24, 0.43, 0.06, 0.30, 0.03, PAL.grau)
    z.quader(mx, y + 0.24, 0.46, 0.05, 0.30, 0.26, PAL.navy)
    z.feldRechts(mx + 0.05, y + 0.26, y + 0.52, 0.48, 0.70, PAL.glasDunkel)
    z.quader(x + 0.40, y + 0.18, 0.43, 0.16, 0.12, 0.01, PAL.weiss)
    z.quader(x + 0.62, y + 0.44, 0.43, 0.08, 0.08, 0.10, PAL.akzentHell)
  }

  function buerostuhl (z, x, y) {
    z.quader(x + 0.36, y + 0.36, 0, 0.06, 0.06, 0.22, PAL.grau)
    z.quader(x + 0.24, y + 0.24, 0.22, 0.32, 0.32, 0.06, PAL.schiefer)
    z.quader(x + 0.24, y + 0.48, 0.28, 0.32, 0.07, 0.34, PAL.schiefer)
  }

  function besprechungstisch (z, x, y, bx, by) {
    z.quader(x + 0.15, y + 0.15, 0.34, bx - 0.30, by - 0.30, 0.08, PAL.weiss)
    z.quader(x + 0.35, y + 0.35, 0, 0.14, 0.14, 0.34, PAL.grau)
    z.quader(x + bx - 0.49, y + by - 0.49, 0, 0.14, 0.14, 0.34, PAL.grau)
  }

  function wandtafel (z, x, y, achse) {
    if (achse === 'x') z.quader(x + 0.05, y + 0.02, 0.45, 0.90, 0.05, 0.55, PAL.weiss)
    else z.quader(x + 0.02, y + 0.05, 0.45, 0.05, 0.90, 0.55, PAL.weiss)
  }

  function wasserspender (z, x, y) {
    z.quader(x + 0.32, y + 0.32, 0, 0.34, 0.34, 0.55, PAL.grauHell)
    z.quader(x + 0.36, y + 0.36, 0.55, 0.26, 0.26, 0.28, PAL.akzentHell)
  }

  function aktenschrank (z, x, y) {
    z.quader(x + 0.12, y + 0.22, 0, 0.76, 0.50, 0.75, PAL.grauHell)
    z.feldRechts(x + 0.88, y + 0.26, y + 0.68, 0.10, 0.34, ton(PAL.grauHell, 0.86))
    z.feldRechts(x + 0.88, y + 0.26, y + 0.68, 0.40, 0.64, ton(PAL.grauHell, 0.86))
  }

  function sofa (z, x, y, achse, hoehe) {
    hoehe = hoehe || 0
    var bx = achse === 'x' ? 1.35 : 0.62
    var by = achse === 'x' ? 0.62 : 1.35
    z.quader(x + 0.05, y + 0.05, hoehe, bx, by, 0.24, PAL.schiefer)
    if (achse === 'x') z.quader(x + 0.05, y + 0.05, hoehe, bx, 0.16, 0.52, ton(PAL.schiefer, 1.12))
    else z.quader(x + 0.05, y + 0.05, hoehe, 0.16, by, 0.52, ton(PAL.schiefer, 1.12))
  }

  function teppich (z, x, y, bx, by, hoehe, farbe) {
    z.platte(x + 0.12, y + 0.12, (hoehe || 0) + 0.008, bx - 0.24, by - 0.24,
      farbe || ton(PAL.glas, 0.98), { kontur: ton(PAL.glasDunkel, 0.95) })
  }

  function kaffeeecke (z, x, y, hoehe) {
    hoehe = hoehe || 0
    z.quader(x + 0.10, y + 0.22, hoehe, 0.80, 0.52, 0.42, PAL.holz)
    z.quader(x + 0.20, y + 0.32, hoehe + 0.42, 0.22, 0.22, 0.26, PAL.stahl)
    z.quader(x + 0.55, y + 0.34, hoehe + 0.42, 0.12, 0.12, 0.12, PAL.weiss)
  }

  /* ---------------------------------------------------------------- Schild
     Steht auf einer freien Parzelle: hier koennte bald ein Kunde stehen. */
  function schild (z, x, y) {
    z.quader(x + 0.30, y + 0.46, 0, 0.07, 0.07, 0.55, PAL.stahl)
    z.quader(x + 0.62, y + 0.46, 0, 0.07, 0.07, 0.55, PAL.stahl)
    z.quader(x + 0.22, y + 0.44, 0.52, 0.58, 0.05, 0.38, PAL.akzent)
    z.feldLinks(y + 0.44, x + 0.28, x + 0.74, 0.62, 0.68, ton(PAL.akzent, 1.5))
    z.feldLinks(y + 0.44, x + 0.28, x + 0.66, 0.72, 0.77, ton(PAL.akzent, 1.35))
  }

  /* ----------------------------------------------------------------- Figur
     Eine einzige Figur fuer alle. Haar, Oberteil und Hose kommen aus den
     Daten. Deshalb kostet ein neuer Mitarbeiter kein einziges Bild. */
  var HAUT = ['#E8C4A0', '#D9AE86', '#B98A63', '#8D6448', '#F0D6BC']
  var HAAR = ['#2E2A28', '#5B4331', '#8C6A45', '#C9A063', '#7A7570', '#3F2E4A']
  var OBEN = ['#1E6CFF', '#58A8FF', '#313B52', '#8A968C', '#C0A886', '#B2A9A3', '#EBE6DF', '#5D6973']
  var UNTEN = ['#313B52', '#12182B', '#5D6973', '#8A7A66', '#9E9A92']

  /* Aus dem Namen entsteht immer dasselbe Aussehen. Kein Zufall pro Aufruf. */
  function streu (text) {
    var h = 2166136261, i
    for (i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = (h * 16777619) >>> 0
    }
    return h
  }

  function aussehen (name) {
    var h = streu(name)
    return {
      haut:  HAUT[h % HAUT.length],
      haar:  HAAR[(h >>> 3) % HAAR.length],
      oben:  OBEN[(h >>> 7) % OBEN.length],
      unten: UNTEN[(h >>> 11) % UNTEN.length],
      lang:  ((h >>> 15) & 1) === 1
    }
  }

  function figur (z, x, y, name, pose, hoehe) {
    var a = aussehen(name)
    var b = 0.30, t = 0.24
    var ox = x + 0.5 - b / 2, oy = y + 0.5 - t / 2
    var z0 = hoehe || 0
    if (pose !== 'sitzt') z.schatten(ox - 0.03, oy - 0.03, b + 0.06, t + 0.06, 0.16, 0.3)

    if (pose === 'sitzt') {
      z.quader(ox, oy, z0 + 0.28, b, t, 0.26, a.oben)
      z.quader(ox, oy - 0.10, z0 + 0.22, b, t, 0.07, a.unten)
      z.quader(ox + 0.03, oy + 0.03, z0 + 0.54, b - 0.06, t - 0.06, 0.19, a.haut)
      z.quader(ox + 0.01, oy + 0.01, z0 + 0.70, b - 0.02, t - 0.02, 0.08, a.haar)
      if (a.lang) z.quader(ox + 0.01, oy + t - 0.05, z0 + 0.54, b - 0.02, 0.05, 0.18, a.haar)
      return
    }
    z.quader(ox + 0.02, oy + 0.04, z0, 0.10, t - 0.08, 0.06, PAL.navy)
    z.quader(ox + b - 0.12, oy + 0.04, z0, 0.10, t - 0.08, 0.06, PAL.navy)
    z.quader(ox + 0.02, oy + 0.03, z0 + 0.05, b - 0.04, t - 0.06, 0.30, a.unten)
    z.quader(ox, oy, z0 + 0.34, b, t, 0.30, a.oben)
    z.quader(ox + 0.03, oy + 0.03, z0 + 0.64, b - 0.06, t - 0.06, 0.19, a.haut)
    z.quader(ox + 0.01, oy + 0.01, z0 + 0.80, b - 0.02, t - 0.02, 0.08, a.haar)
    if (a.lang) z.quader(ox + 0.01, oy + t - 0.05, z0 + 0.64, b - 0.02, 0.05, 0.18, a.haar)
  }

  global.Teile = {
    HG: HG,
    boden: boden, decke: decke,
    baum: baum, busch: busch, hecke: hecke, pflanztopf: pflanztopf,
    bank: bank, laterne: laterne, fahrradstaender: fahrradstaender,
    abfalleimer: abfalleimer, lieferwagen: lieferwagen,
    schreibtisch: schreibtisch, buerostuhl: buerostuhl,
    besprechungstisch: besprechungstisch, wandtafel: wandtafel,
    wasserspender: wasserspender, aktenschrank: aktenschrank,
    sofa: sofa, teppich: teppich, kaffeeecke: kaffeeecke,
    schild: schild, figur: figur, aussehen: aussehen, streu: streu
  }
})(window)
