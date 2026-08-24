/* Player Two — isometrischer Zeichenkern.
   Alles wird aus Zahlen gezeichnet, nichts ist ein fertiges Bild.
   Ein Stockwerk mehr ist eine Zahl mehr. Ein Mitarbeiter mehr ist eine Zeile mehr. */

(function (global) {
  'use strict'

  /* ---------------------------------------------------------------- Palette
     Abgelesen aus der freigegebenen Stilvorlage. Gedaempft, ernsthaft,
     Signalblau nur als Akzent. */
  var PAL = {
    himmel:        '#DFDFDF',
    gehwegHell:    '#E4E0D9',
    gehwegDunkel:  '#DCD7CE',
    strasse:       '#B2A9A3',
    bordstein:     '#C6C0B8',
    sand:          '#D5C1A9',
    erde:          '#C9B79E',
    rasen:         '#A3B398',
    rasenDunkel:   '#98A88D',
    laub:          '#7C9670',
    laubHell:      '#93AC85',
    stamm:         '#8A7A66',
    navy:          '#12182B',
    schiefer:      '#313B52',
    stahl:         '#5D6973',
    grau:          '#9E9A92',
    grauHell:      '#C0BAB7',
    weiss:         '#EBE6DF',
    putz:          '#DEDAD3',
    glas:          '#C3D2DB',
    glasDunkel:    '#9DB0BC',
    holz:          '#C0A886',
    holzDunkel:    '#9A8365',
    akzent:        '#1E6CFF',
    akzentHell:    '#58A8FF',
    kontur:        '#232A3D'
  }

  /* ------------------------------------------------------------ Farbhelfer */
  function zuRgb (hex) {
    var h = hex.charAt(0) === '#' ? hex.slice(1) : hex
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  function zuHex (r, g, b) {
    function t (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16) }
    return '#' + t(r) + t(g) + t(b)
  }
  /* Ton abdunkeln oder aufhellen. f < 1 dunkler, f > 1 heller. */
  function ton (hex, f) {
    var c = zuRgb(hex)
    if (f <= 1) return zuHex(c[0] * f, c[1] * f, c[2] * f)
    var k = f - 1
    return zuHex(c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k)
  }
  function mischen (a, b, t) {
    var x = zuRgb(a), y = zuRgb(b)
    return zuHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t)
  }

  /* ---------------------------------------------------------- Projektion
     Strenge 2:1 Dimetrie. Eine Rasterzelle ist KW breit und KH hoch,
     eine Hoeheneinheit ist KZ hoch. */
  var KW = 60, KH = 30, KZ = 30

  function proj (x, y, z) {
    return {
      x: (x - y) * (KW / 2),
      y: (x + y) * (KH / 2) - (z || 0) * KZ
    }
  }

  /* Licht von oben links. Deckflaeche am hellsten, rechte Flaeche am dunkelsten. */
  var F_OBEN = 1.0, F_LINKS = 0.80, F_RECHTS = 0.60

  /* ------------------------------------------------------------- Zeichner */
  function Zeichner (ctx) {
    this.ctx = ctx
    this.kontur = true
    this.strichbreite = 1.15
  }

  Zeichner.prototype.flaeche = function (punkte, fuellung, konturFarbe) {
    var c = this.ctx, i
    c.beginPath()
    c.moveTo(punkte[0].x, punkte[0].y)
    for (i = 1; i < punkte.length; i++) c.lineTo(punkte[i].x, punkte[i].y)
    c.closePath()
    if (fuellung) { c.fillStyle = fuellung; c.fill() }
    if (this.kontur && konturFarbe !== false) {
      c.lineWidth = this.strichbreite
      c.lineJoin = 'round'
      c.strokeStyle = konturFarbe || PAL.kontur
      c.stroke()
    }
  }

  /* Waagrechte Platte auf Hoehe z, Groesse bx mal by ab (x,y). */
  Zeichner.prototype.platte = function (x, y, z, bx, by, farbe, opt) {
    opt = opt || {}
    this.flaeche([
      proj(x, y, z), proj(x + bx, y, z), proj(x + bx, y + by, z), proj(x, y + by, z)
    ], farbe, opt.kontur)
  }

  /* Senkrechte Flaeche auf der rechten Seite (Ebene x = konstant). */
  Zeichner.prototype.feldRechts = function (x, y0, y1, z0, z1, farbe, opt) {
    opt = opt || {}
    this.flaeche([
      proj(x, y0, z1), proj(x, y1, z1), proj(x, y1, z0), proj(x, y0, z0)
    ], farbe, opt.kontur)
  }

  /* Senkrechte Flaeche auf der linken Seite (Ebene y = konstant). */
  Zeichner.prototype.feldLinks = function (y, x0, x1, z0, z1, farbe, opt) {
    opt = opt || {}
    this.flaeche([
      proj(x0, y, z1), proj(x1, y, z1), proj(x1, y, z0), proj(x0, y, z0)
    ], farbe, opt.kontur)
  }

  /* Quader. Das Arbeitspferd. Aus diesem einen Bauteil besteht fast alles. */
  Zeichner.prototype.quader = function (x, y, z, bx, by, bz, farbe, opt) {
    opt = opt || {}
    var oben   = opt.oben   || ton(farbe, F_OBEN)
    var links  = opt.links  || ton(farbe, F_LINKS)
    var rechts = opt.rechts || ton(farbe, F_RECHTS)
    var k = opt.kontur
    /* Reihenfolge: hinten liegende Flaechen zuerst, damit die Kanten stimmen. */
    this.feldLinks(y + by, x, x + bx, z, z + bz, links, { kontur: k })
    this.feldRechts(x + bx, y, y + by, z, z + bz, rechts, { kontur: k })
    this.platte(x, y, z + bz, bx, by, oben, { kontur: k })
  }

  /* Runder Koerper, als Achteck genaehert. Fuer Baeume und Buesche. */
  Zeichner.prototype.klumpen = function (x, y, z, r, h, farbe, opt) {
    opt = opt || {}
    var n = 10, oben = [], unten = [], i, a, px, py
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2
      px = x + Math.cos(a) * r
      py = y + Math.sin(a) * r
      oben.push(proj(px, py, z + h))
      unten.push(proj(px, py, z))
    }
    /* Mantel als ein Streifen, danach die Deckflaeche. */
    var mantel = [], j
    for (i = 0; i < n; i++) mantel.push(unten[i])
    for (j = n - 1; j >= 0; j--) mantel.push(oben[j])
    this.flaeche(mantel, ton(farbe, 0.86), opt.kontur)
    this.flaeche(oben, ton(farbe, 1.10), opt.kontur)
  }

  /* Weiche Kugel. Baumkronen und Buesche sind runde Koerper, keine Stapel.
     In der flachen Bildsprache genuegen drei Toene fuer ein weiches Volumen. */
  Zeichner.prototype.kugel = function (x, y, z, r, farbe, opt) {
    opt = opt || {}
    var c = this.ctx
    var p = proj(x, y, z)
    var rx = r * (KW / 2)
    var ry = rx * (opt.flach || 0.94)
    c.save()
    c.beginPath()
    c.ellipse(p.x, p.y - ry * 0.1, rx, ry, 0, 0, Math.PI * 2)
    c.fillStyle = ton(farbe, 0.80)
    c.fill()
    if (this.kontur && opt.kontur !== false) {
      c.lineWidth = this.strichbreite
      c.strokeStyle = opt.kontur || PAL.kontur
      c.stroke()
    }
    c.beginPath()
    c.ellipse(p.x - rx * 0.14, p.y - ry * 0.30, rx * 0.84, ry * 0.82, 0, 0, Math.PI * 2)
    c.fillStyle = farbe
    c.fill()
    c.beginPath()
    c.ellipse(p.x - rx * 0.30, p.y - ry * 0.48, rx * 0.46, ry * 0.44, 0, 0, Math.PI * 2)
    c.fillStyle = ton(farbe, 1.12)
    c.fill()
    c.restore()
  }

  /* Weicher Schlagschatten auf dem Boden. Licht faellt von oben links,
     der Schatten liegt deshalb leicht nach unten rechts versetzt. */
  Zeichner.prototype.schatten = function (x, y, bx, by, staerke, hoehe) {
    var c = this.ctx
    var v = 0.10 + (hoehe || 0) * 0.09
    c.save()
    c.globalAlpha = staerke === undefined ? 0.13 : staerke
    this.platte(x + v, y + v, 0.006, bx, by, '#1C2436', { kontur: false })
    c.restore()
  }

  /* ------------------------------------------------------------ Sortierung
     Klassische Malerreihenfolge. Alles bekommt einen Tiefenwert, hinten wird
     zuerst gezeichnet. */
  function Buehne () {
    this.eintraege = []
  }
  Buehne.prototype.setze = function (x, y, z, zeichnen, rang, ebene) {
    this.eintraege.push({ e: ebene || 0, t: x + y, h: z || 0, r: rang || 0, f: zeichnen })
  }
  Buehne.prototype.malen = function () {
    /* Ebene zuerst: bei einem Haus mit mehreren Geschossen muss das untere
       Geschoss vollstaendig fertig sein, bevor die Decke darueber kommt. */
    this.eintraege.sort(function (a, b) {
      if (a.e !== b.e) return a.e - b.e
      if (a.t !== b.t) return a.t - b.t
      if (a.h !== b.h) return a.h - b.h
      return a.r - b.r
    })
    for (var i = 0; i < this.eintraege.length; i++) this.eintraege[i].f()
  }

  global.Iso = {
    PAL: PAL, KW: KW, KH: KH, KZ: KZ,
    proj: proj, ton: ton, mischen: mischen,
    Zeichner: Zeichner, Buehne: Buehne
  }
})(window)
