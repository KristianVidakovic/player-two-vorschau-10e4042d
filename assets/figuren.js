/* Player Two — die Figuren.

   Gezeichnet in derselben flachen Bildsprache wie die Kulisse: wenige Töne,
   dünne dunkle Kontur, keine Details, die bei dieser Grösse ohnehin
   verschwinden. Aussehen entsteht aus dem Namen, damit dieselbe Person
   immer gleich aussieht und ein neuer Mitarbeiter kein Bild braucht. */

(function (global) {
  'use strict'

  var KONTUR = '#1B2233'

  var HAUT = ['#E9C6A4', '#DCB08A', '#C08C64', '#9A6E4E', '#F1D8C0', '#B8845C']
  var HAAR = ['#2C2926', '#54402F', '#8A6A47', '#C6A268', '#7B7671', '#3C2C46', '#A8552F']
  var OBEN = ['#1E6CFF', '#58A8FF', '#31405C', '#7C9670', '#C0A886', '#B2A9A3',
              '#EBE6DF', '#5D6973', '#8C6F5C', '#4A5B7A']
  var UNTEN = ['#31405C', '#1B2233', '#5D6973', '#8A7A66', '#9E9A92', '#3E4A5E']
  var BADE = ['#1E6CFF', '#E2705A', '#3FA79B', '#E8B84B', '#7C9670', '#B45E9B']

  /* Die beiden Achsen, in denen im Bild Betten, Liegen und Bänke stehen.
     Welche gilt, sagt der Pfeil, den der Benutzer beim Platz gesetzt hat. */
  var ACHSE_RECHTS = -0.393    /* Kopfende oben rechts */
  var ACHSE_LINKS = 0.393      /* Kopfende oben links */

  function streu (text) {
    var h = 2166136261, i
    for (i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = (h * 16777619) >>> 0
    }
    return h
  }

  function aussehen (name, geschlecht) {
    var h = streu(name || 'unbekannt')
    return {
      haut: HAUT[h % HAUT.length],
      haar: HAAR[(h >>> 3) % HAAR.length],
      oben: OBEN[(h >>> 7) % OBEN.length],
      unten: UNTEN[(h >>> 11) % UNTEN.length],
      bade: BADE[(h >>> 13) % BADE.length],
      /* Frauen lange Haare, Männer kurze. */
      lang: geschlecht === 'w',
      frau: geschlecht === 'w'
    }
  }

  /* ---------------------------------------------------------- Grundformen */
  function rund (ctx, x, y, b, h, r, farbe, strich) {
    var rr = Math.min(r, Math.abs(b) / 2, Math.abs(h) / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.lineTo(x + b - rr, y)
    ctx.quadraticCurveTo(x + b, y, x + b, y + rr)
    ctx.lineTo(x + b, y + h - rr)
    ctx.quadraticCurveTo(x + b, y + h, x + b - rr, y + h)
    ctx.lineTo(x + rr, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
    ctx.lineTo(x, y + rr)
    ctx.quadraticCurveTo(x, y, x + rr, y)
    ctx.closePath()
    ctx.fillStyle = farbe
    ctx.fill()
    if (strich !== false) ctx.stroke()
  }

  function kreis (ctx, x, y, r, farbe, strich) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = farbe
    ctx.fill()
    if (strich !== false) ctx.stroke()
  }

  /* Kopf. blick: 'weg' zeigt den Hinterkopf, 'seite' das Gesicht schräg,
     'oben' das Gesicht von vorne — so schaut jemand, der auf dem Rücken liegt. */
  function kopf (ctx, x, y, r, a, blick, nachLinks, augen) {
    kreis(ctx, x, y, r, a.haut)

    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.beginPath()
    if (blick === 'weg') {
      ctx.arc(x, y, r, 0, Math.PI * 2)
      if (a.lang) ctx.rect(x - r, y - r, r * 2, r * 2.2)
    } else {
      ctx.rect(x - r, y - r, r * 2, r * 1.02)
      if (a.lang) {
        ctx.rect(x - r, y - r, r * 0.52, r * 2.2)
        ctx.rect(x + r * 0.48, y - r, r * 0.52, r * 2.2)
      }
    }
    ctx.fillStyle = a.haar
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.stroke()

    if (blick === 'weg' || augen === 'keine' || r < 3.0) return
    var dx = blick === 'oben' ? 0 : (nachLinks ? -r * 0.14 : r * 0.14)
    if (augen === 'zu') {
      ctx.save()
      ctx.lineWidth = Math.max(0.7, r * 0.13)
      ctx.beginPath()
      ctx.moveTo(x - r * 0.46 + dx, y + r * 0.10); ctx.lineTo(x - r * 0.16 + dx, y + r * 0.10)
      ctx.moveTo(x + r * 0.14 + dx, y + r * 0.10); ctx.lineTo(x + r * 0.44 + dx, y + r * 0.10)
      ctx.stroke()
      ctx.restore()
      return
    }
    ctx.fillStyle = KONTUR
    ctx.beginPath(); ctx.arc(x - r * 0.30 + dx, y + r * 0.10, r * 0.11, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + r * 0.28 + dx, y + r * 0.10, r * 0.11, 0, Math.PI * 2); ctx.fill()
  }

  /* Rumpf als abgerundetes Trapez: oben Schultern, unten Hüfte. */
  function rumpf (ctx, x, yOben, yUnten, bSchulter, bHuefte, farbe) {
    var h = yUnten - yOben
    var r = Math.min(h * 0.30, bSchulter * 0.34)
    var xs = bSchulter / 2, xh = bHuefte / 2
    ctx.beginPath()
    ctx.moveTo(x - xs + r, yOben)
    ctx.lineTo(x + xs - r, yOben)
    ctx.quadraticCurveTo(x + xs, yOben, x + xs, yOben + r)
    ctx.lineTo(x + xh, yUnten - r)
    ctx.quadraticCurveTo(x + xh, yUnten, x + xh - r * 0.6, yUnten)
    ctx.lineTo(x - xh + r * 0.6, yUnten)
    ctx.quadraticCurveTo(x - xh, yUnten, x - xh, yUnten - r)
    ctx.lineTo(x - xs, yOben + r)
    ctx.quadraticCurveTo(x - xs, yOben, x - xs + r, yOben)
    ctx.closePath()
    ctx.fillStyle = farbe
    ctx.fill()
    ctx.stroke()
  }

  /* Arme hängen herunter. Nur ein winziger Ausschlag beim Gehen. */
  function arm (ctx, x, y, laenge, dicke, winkel, farbe) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(winkel)
    rund(ctx, -dicke / 2, 0, dicke, laenge, dicke / 2, farbe)
    ctx.restore()
  }

  function hals (ctx, x, y, b, h, farbe) {
    rund(ctx, x - b / 2, y, b, h, b * 0.3, farbe)
  }

  /* Badekleidung: nackter Oberkörper mit Hose, bei Frauen zusätzlich ein
     Oberteil. Wird am Strand und im Schwimmbad benutzt. */
  function badeOben (ctx, x, yOben, yUnten, bS, bH, a) {
    rumpf(ctx, x, yOben, yUnten, bS, bH, a.haut)
    if (a.frau) {
      var y = yOben + (yUnten - yOben) * 0.10
      rund(ctx, x - bS * 0.46, y, bS * 0.92, (yUnten - yOben) * 0.24, bS * 0.14, a.bade)
    }
  }

  /* ------------------------------------------------------------- Haltungen
     H ist die Höhe einer stehenden Figur in Bildpunkten. */

  function stehend (ctx, x, y, H, a, blick, links, phase, o) {
    var bS = H * 0.30, bH = H * 0.26
    var kr = H * 0.135
    var hose = o.bade ? a.bade : a.unten
    rund(ctx, x - bH * 0.50, y - H * 0.42, bH * 0.42, H * 0.42, H * 0.055, hose)
    rund(ctx, x + bH * 0.08, y - H * 0.42, bH * 0.42, H * 0.42, H * 0.055, hose)
    if (!o.bade) {
      rund(ctx, x - bH * 0.54, y - H * 0.05, bH * 0.50, H * 0.06, H * 0.03, '#2A3242')
      rund(ctx, x + bH * 0.04, y - H * 0.05, bH * 0.50, H * 0.06, H * 0.03, '#2A3242')
    }
    var armfarbe = o.bade ? a.haut : a.oben
    arm(ctx, x - bS * 0.44, y - H * 0.72, H * 0.31, H * 0.082, 0.05, armfarbe)
    arm(ctx, x + bS * 0.44, y - H * 0.72, H * 0.31, H * 0.082, -0.05, armfarbe)
    if (o.bade) badeOben(ctx, x, y - H * 0.76, y - H * 0.40, bS, bH, a)
    else rumpf(ctx, x, y - H * 0.76, y - H * 0.40, bS, bH, a.oben)
    hals(ctx, x, y - H * 0.80, H * 0.09, H * 0.06, a.haut)
    kopf(ctx, x, y - H * 0.87, kr, a, blick, links, 'offen')
  }

  function gehend (ctx, x, y, H, a, blick, links, phase, o) {
    var bS = H * 0.30, bH = H * 0.26
    var kr = H * 0.135
    /* Kleiner Schritt: die Beine gingen vorher viel zu weit auseinander. */
    var s = Math.sin(phase) * H * 0.042
    var hose = o.bade ? a.bade : a.unten
    rund(ctx, x - bH * 0.46 + s, y - H * 0.42, bH * 0.40, H * 0.42, H * 0.055, hose)
    rund(ctx, x + bH * 0.06 - s, y - H * 0.42, bH * 0.40, H * 0.42, H * 0.055, hose)
    if (!o.bade) {
      rund(ctx, x - bH * 0.50 + s, y - H * 0.05, bH * 0.48, H * 0.06, H * 0.03, '#2A3242')
      rund(ctx, x + bH * 0.02 - s, y - H * 0.05, bH * 0.48, H * 0.06, H * 0.03, '#2A3242')
    }
    /* Arme hängen fast senkrecht, nur ein Hauch Bewegung. */
    var armfarbe = o.bade ? a.haut : a.oben
    var w = s * 0.02
    arm(ctx, x - bS * 0.44, y - H * 0.72, H * 0.31, H * 0.082, 0.05 - w, armfarbe)
    arm(ctx, x + bS * 0.44, y - H * 0.72, H * 0.31, H * 0.082, -0.05 + w, armfarbe)
    if (o.bade) badeOben(ctx, x, y - H * 0.76, y - H * 0.40, bS, bH, a)
    else rumpf(ctx, x, y - H * 0.76, y - H * 0.40, bS, bH, a.oben)
    hals(ctx, x, y - H * 0.80, H * 0.09, H * 0.06, a.haut)
    kopf(ctx, x, y - H * 0.87, kr, a, blick, links, 'offen')
  }

  /* Sitzend: der Punkt liegt auf der SITZFLÄCHE. Gesäss auf y, Rumpf
     darüber, Oberschenkel waagrecht nach vorne, Unterschenkel hinunter. */
  function sitzend (ctx, x, y, H, a, blick, links, phase, o) {
    var bS = H * 0.29, bH = H * 0.25
    var kr = H * 0.130
    var v = links ? -1 : 1
    var hose = o.bade ? a.bade : a.unten
    rund(ctx, x + v * H * 0.13 - H * 0.055, y + H * 0.03, H * 0.11, H * 0.23, H * 0.05, hose)
    if (!o.bade) rund(ctx, x + v * H * 0.12 - H * 0.065, y + H * 0.23, H * 0.14, H * 0.055, H * 0.027, '#2A3242')
    rund(ctx, x - H * 0.02 + (v < 0 ? -H * 0.20 : 0), y - H * 0.09, H * 0.22, H * 0.12, H * 0.05, hose)
    /* Beide Arme hängen herunter. */
    var armfarbe = o.bade ? a.haut : a.oben
    arm(ctx, x - v * bS * 0.44, y - H * 0.35, H * 0.24, H * 0.078, -v * 0.12, armfarbe)
    if (o.bade) badeOben(ctx, x, y - H * 0.40, y - H * 0.02, bS, bH, a)
    else rumpf(ctx, x, y - H * 0.40, y - H * 0.02, bS, bH, a.oben)
    arm(ctx, x + v * bS * 0.44, y - H * 0.35, H * 0.24, H * 0.078, v * 0.12, armfarbe)
    hals(ctx, x, y - H * 0.44, H * 0.085, H * 0.05, a.haut)
    kopf(ctx, x, y - H * 0.51, kr, a, blick, links, 'offen')
  }

  /* Liegend auf Liege, Bank oder Hantelbank: auf dem Rücken, Blick nach oben,
     Körper der Länge nach auf der Fläche. */
  function liegend (ctx, x, y, H, a, blick, links, phase, o) {
    var L = H * 0.84
    var winkel = o.achse
    var sp = winkel < 0 ? 1 : -1        /* in welche Richtung das Kopfende zeigt */
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(winkel)
    var hose = o.bade ? a.bade : a.unten
    /* Beine zum Fussende */
    rund(ctx, -sp * L * 0.50 - (sp > 0 ? 0 : L * 0.42), -H * 0.062, L * 0.42, H * 0.125, H * 0.055, hose)
    /* Rumpf zum Kopfende */
    rund(ctx, sp * L * 0.02 - (sp > 0 ? 0 : L * 0.34), -H * 0.088, L * 0.34, H * 0.176, H * 0.070,
      o.bade ? a.haut : a.oben)
    if (o.bade && a.frau) {
      rund(ctx, sp * L * 0.06 - (sp > 0 ? 0 : L * 0.16), -H * 0.086, L * 0.16, H * 0.172, H * 0.05, a.bade)
    }
    /* Arm liegt am Körper */
    rund(ctx, sp * L * 0.06 - (sp > 0 ? 0 : L * 0.26), H * 0.042, L * 0.26, H * 0.052, H * 0.026,
      o.bade ? a.haut : a.oben)
    /* Kopf am oberen Ende, Gesicht nach oben */
    kopf(ctx, sp * L * 0.40, -H * 0.030, H * 0.118, a, 'oben', false, o.augen || 'offen')
    ctx.restore()
  }

  /* Im Bett: Seitenlage unter der Decke, Kopf auf dem Kissen. */
  function schlafend (ctx, x, y, H, a, blick, links, phase, o) {
    var L = H * 0.88
    var winkel = o.achse
    var sp = winkel < 0 ? 1 : -1
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(winkel)
    rund(ctx, -sp * L * 0.52 - (sp > 0 ? 0 : L * 0.70), -H * 0.092, L * 0.70, H * 0.170, H * 0.052, '#A9BCBC')
    rund(ctx, sp * L * 0.16 - (sp > 0 ? 0 : L * 0.16), -H * 0.078, L * 0.16, H * 0.146, H * 0.058, a.oben)
    kopf(ctx, sp * L * 0.36, -H * 0.036, H * 0.116, a, 'seite', sp < 0, 'zu')
    ctx.restore()
  }

  /* Schwimmend: Kopf, Schultern und ein Arm über dem Wasser. */
  function schwimmend (ctx, x, y, H, a, blick, links, phase, o) {
    var v = links ? -1 : 1
    rund(ctx, x - H * 0.19, y - H * 0.09, H * 0.38, H * 0.11, H * 0.055, a.haut)
    arm(ctx, x + v * H * 0.16, y - H * 0.07, H * 0.17, H * 0.062, v * 2.3, a.haut)
    kopf(ctx, x, y - H * 0.16, H * 0.115, a, 'oben', false, 'offen')
  }

  /* -------------------------------------------------------------- Zeichnen */
  var HALTUNG = {
    sitzt: sitzend, steht: stehend, geht: gehend,
    liegt: liegend, schlaeft: schlafend, schwimmt: schwimmend
  }

  /* richtung: nw, no, so, sw. nw und no schauen von uns weg.
     extras: { geschlecht, bade, achse } */
  function zeichnen (ctx, x, y, name, haltung, richtung, hoehe, phase, extras) {
    extras = extras || {}
    var a = aussehen(name, extras.geschlecht)
    var H = hoehe || 40
    var blick = (richtung === 'nw' || richtung === 'no') ? 'weg' : 'seite'
    var links = richtung === 'nw' || richtung === 'sw'
    var f = HALTUNG[haltung] || stehend

    /* Die beiden isometrischen Achsen: der Pfeil beim Platz sagt, welche. */
    var achse = (richtung === 'nw' || richtung === 'so') ? ACHSE_LINKS : ACHSE_RECHTS

    ctx.save()
    ctx.lineWidth = Math.max(0.8, H * 0.032)
    ctx.lineJoin = 'round'
    ctx.strokeStyle = KONTUR

    if (haltung === 'steht' || haltung === 'geht') {
      ctx.save()
      ctx.globalAlpha = 0.16
      ctx.beginPath()
      ctx.ellipse(x, y + H * 0.02, H * 0.19, H * 0.07, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#101828'
      ctx.fill()
      ctx.restore()
    }

    f(ctx, x, y, H, a, blick, links, phase || 0, {
      bade: !!extras.bade,
      achse: achse,
      augen: extras.augen
    })
    ctx.restore()
  }

  global.Figuren = { zeichnen: zeichnen, aussehen: aussehen, streu: streu }
})(window)
