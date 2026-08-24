/* Player Two — Gebaeude entstehen aus Daten, nicht aus Bildern.
   Kommt eine Abteilung dazu, wird der Grundriss neu gerechnet und das Haus
   ist groesser. Kommt ein Mitarbeiter dazu, steht ein Tisch mehr im Raum.
   Niemand zeichnet etwas nach. */

(function (global) {
  'use strict'

  var Iso = global.Iso
  var T = global.Teile
  var PAL = Iso.PAL
  var ton = Iso.ton
  var HG = T.HG

  /* Jede Abteilung bekommt einen eigenen Bodenton. Das macht den Grundriss
     lesbar und bringt Farbe hinein, ohne bunt zu werden. */
  var RAUMTON = ['#E9E2D4', '#DFE8DD', '#EDE4D0', '#D9E2EC', '#EAE0DA', '#DEE9E2', '#E2E2EC']
  var TEPPICHTON = ['#C9D4DA', '#C8D2C3', '#DCD1BE', '#C4CAD8', '#D6CDC3', '#C9D4C9', '#D0D0D8']

  var WANDDICKE = 0.16
  var TRENNHOEHE = 0.86

  /* ------------------------------------------------------------- Grundriss
     Aus der Anzahl Mitarbeitender pro Abteilung entsteht die Raumgroesse,
     aus der Anzahl Abteilungen die Zahl der Geschosse. Reine Rechnung.
     Zwei Abteilungen teilen sich ein Geschoss. */
  /* Geometrisches Gesetz der Isometrie: ein Geschoss ist genau so tief
     einsehbar, wie es hoch ist. Ist der Raum tiefer als die Geschosshoehe,
     verschwindet der hintere Teil hinter der Decke darueber. Deshalb sind
     die Geschosse flach und breit, nicht quadratisch. */
  var HGQ = 3.10        /* Geschosshoehe im HQ. */
  var RAUMTIEFE = 3     /* Muss kleiner bleiben als HGQ. */
  var SOCKEL = 1.35     /* Empfangsgeschoss, geschlossen. */
  var PRO_EBENE = 2

  function grundriss (abteilungen) {
    var raeume = abteilungen.map(function (a) {
      var n = Math.max(1, a.mitarbeitende.length)
      /* Zwei Tischreihen, so tief wie das Geschoss erlaubt. Der Rest
         waechst in die Breite. */
      var reihen = Math.min(2, n)
      var spalten = Math.ceil(n / reihen)
      return { abteilung: a, tischSpalten: spalten, tischReihen: reihen }
    })

    var maxSp = 2, i
    for (i = 0; i < raeume.length; i++) {
      if (raeume[i].tischSpalten > maxSp) maxSp = raeume[i].tischSpalten
    }

    var raumB = maxSp + 2
    var raumT = RAUMTIEFE
    var ebenen = Math.ceil(raeume.length / PRO_EBENE)

    raeume.forEach(function (raum, k) {
      raum.ebene = Math.floor(k / PRO_EBENE)
      raum.spalte = k % PRO_EBENE
      raum.x = raum.spalte * raumB
      raum.y = 0
      raum.b = raumB
      raum.t = raumT
    })

    return {
      raeume: raeume,
      raumB: raumB, raumT: raumT,
      ebenen: ebenen, proEbene: PRO_EBENE,
      breite: raumB * PRO_EBENE,
      tiefe: raumT,
      hoehe: SOCKEL + ebenen * HGQ
    }
  }

  /* ----------------------------------------------------------- Fensterband */
  function fensterLinks (z, y, x0, x1, z0, z1, farbe) {
    var x = x0 + 0.35
    while (x + 0.85 <= x1 - 0.35) {
      z.feldLinks(y, x, x + 0.85, z0, z1, farbe || PAL.glas)
      x += 1.35
    }
  }
  function fensterRechts (z, x, y0, y1, z0, z1, farbe) {
    var y = y0 + 0.35
    while (y + 0.85 <= y1 - 0.35) {
      z.feldRechts(x, y, y + 0.85, z0, z1, farbe || PAL.glas)
      y += 1.35
    }
  }

  /* ------------------------------------------------------------------ HQ
     Ein richtiges Haus mit mehreren Geschossen. Die Vorderseite fehlt,
     damit man in jedes Geschoss hineinsieht. Die Figuren gehen unten
     hinein und tauchen oben an ihrem Platz wieder auf.

     Alles im Inneren wird auf einer eigenen Buehne sortiert. Sonst laege
     ein Schreibtisch aus dem ersten Geschoss vor der Decke des zweiten. */
  function hq (z, buehne, daten, ox, oy) {
    var plan = grundriss(daten.abteilungen)
    var B = plan.breite, TT = plan.tiefe
    var innen = new Iso.Buehne()
    var e, i, j

    /* --- Empfangsgeschoss, geschlossen --- */
    innen.setze(ox, oy, 0, function () {
      z.schatten(ox, oy, B, TT, 0.18, plan.hoehe)
      z.quader(ox - 0.24, oy - 0.24, 0, B + 0.48, TT + 0.48, 0.15, '#C7C1B7')
      z.quader(ox, oy, 0, B, TT, SOCKEL, PAL.navy, {
        oben: PAL.navy, links: ton(PAL.navy, 1.38), rechts: ton(PAL.navy, 1.14)
      })
      fensterLinks(z, oy + TT, ox, ox + B, 0.45, 1.10)
      fensterRechts(z, ox + B, oy, oy + TT, 0.45, 1.10)
      var tx = ox + Math.floor(B / 2) - 1
      z.feldLinks(oy + TT, tx, tx + 1.7, 0, 1.02, ton(PAL.navy, 1.62))
      z.feldLinks(oy + TT, tx + 0.16, tx + 1.54, 0.06, 0.94, PAL.glas)
      z.quader(tx - 0.35, oy + TT, 1.05, 2.4, 0.55, 0.11, PAL.akzent)
    }, 0, 0)

    /* --- Die Geschosse --- */
    for (e = 0; e < plan.ebenen; e++) {
      (function (ebene) {
        var z0 = SOCKEL + ebene * HGQ
        var ordnung = ebene + 1
        var raumFuerFeld = {}

        plan.raeume.forEach(function (raum, index) {
          if (raum.ebene !== ebene) return
          var a, b2
          for (a = 0; a < raum.b; a++) {
            for (b2 = 0; b2 < raum.t; b2++) {
              raumFuerFeld[(raum.x + a) + ':' + (raum.y + b2)] = index
            }
          }
        })

        for (i = 0; i < B; i++) {
          for (j = 0; j < TT; j++) {
            (function (cx, cy) {
              var idx = raumFuerFeld[cx + ':' + cy]
              var grund = idx === undefined ? PAL.putz : RAUMTON[idx % RAUMTON.length]
              var f = (cx + cy) % 2 === 0 ? grund : ton(grund, 0.985)
              innen.setze(ox + cx, oy + cy, z0, function () {
                z.platte(ox + cx, oy + cy, z0, 1, 1, f, { kontur: ton(f, 0.955) })
              }, 1, ordnung)
            })(i, j)
          }
        }

        /* Die beiden hinteren Aussenwaende, von innen gesehen */
        innen.setze(ox, oy, z0, function () {
          z.quader(ox, oy, z0, B, WANDDICKE, HGQ, PAL.putz)
          fensterLinks(z, oy + WANDDICKE, ox, ox + B, z0 + 0.55, z0 + 1.55)
          z.quader(ox, oy, z0, WANDDICKE, TT, HGQ, PAL.putz)
          fensterRechts(z, ox + WANDDICKE, oy, oy + TT, z0 + 0.55, z0 + 1.55)
        }, 2, ordnung)

        /* Die rechte Seite bleibt geschlossen. Sonst sieht es aus wie ein
           Regal und nicht wie ein Haus. Offen ist nur die Vorderseite. */
        innen.setze(ox + B, oy, z0, function () {
          z.quader(ox + B - WANDDICKE, oy, z0, WANDDICKE, TT, HGQ, PAL.putz, {
            oben: ton(PAL.putz, 0.94),
            links: ton(PAL.putz, 0.90),
            rechts: ton(PAL.putz, 0.74)
          })
          fensterRechts(z, ox + B, oy, oy + TT, z0 + 0.55, z0 + 1.55)
        }, 8, ordnung)

        /* Die Raeume dieses Geschosses */
        plan.raeume.forEach(function (raum, index) {
          if (raum.ebene !== ebene) return
          var rx = ox + raum.x, ry = oy + raum.y
          var mitarbeitende = raum.abteilung.mitarbeitende
          var wandTon = { oben: PAL.weiss, links: ton(PAL.putz, 0.88), rechts: ton(PAL.putz, 0.72) }

          if (raum.spalte < plan.proEbene - 1) {
            innen.setze(rx + raum.b, ry, z0, function () {
              z.quader(rx + raum.b - WANDDICKE, ry, z0, WANDDICKE, raum.t - 1.1, HGQ * 0.55,
                PAL.putz, wandTon)
            }, 3, ordnung)
          }

          /* Tische stehen vorne, damit sie nicht hinter der Decke verschwinden */
          var startY = Math.max(0.55, raum.t - 0.2 - raum.tischReihen)
          var startX = 1

          innen.setze(rx + startX, ry + startY, z0, function () {
            T.teppich(z, rx + startX, ry + startY, raum.tischSpalten, raum.tischReihen, z0,
              TEPPICHTON[index % TEPPICHTON.length])
          }, 2, ordnung)

          mitarbeitende.forEach(function (person, k) {
            var sp = k % raum.tischSpalten
            var re = Math.floor(k / raum.tischSpalten)
            var tx = rx + startX + sp
            var ty = ry + startY + re
            innen.setze(tx, ty, z0, function () {
              T.schreibtisch(z, tx, ty, sp % 2 === 0 ? 'links' : 'rechts')
              T.buerostuhl(z, tx, ty + 0.55)
              T.figur(z, tx, ty + 0.52, person.name, 'sitzt', z0)
            }, 5, ordnung)
          })

          /* An den Raumenden Pflanzen, Schrank und Kaffee. */
          var enden = [
            { x: rx + 0.3, y: ry + raum.t - 1.3, art: index % 3 },
            { x: rx + raum.b - 1.3, y: ry + raum.t - 1.3, art: (index + 1) % 3 }
          ]
          enden.forEach(function (m) {
            innen.setze(m.x, m.y, z0, function () {
              if (m.art === 0) T.pflanztopf(z, m.x, m.y, z0)
              else if (m.art === 1) T.aktenschrank(z, m.x, m.y, z0)
              else T.kaffeeecke(z, m.x, m.y, z0)
            }, 4, ordnung)
          })
        })

        /* Sichtbare Deckenstaerke an der offenen Vorderkante */
        innen.setze(ox + B, oy + TT, z0, function () {
          z.feldLinks(oy + TT, ox, ox + B - WANDDICKE, z0 - 0.22, z0, ton(PAL.putz, 0.78))
        }, 9, ordnung)
      })(e)
    }

    /* --- Dach --- */
    innen.setze(ox, oy, plan.hoehe, function () {
      var zd = plan.hoehe
      z.quader(ox, oy, zd, B, TT, 0.12, '#DAD6CD')
      z.quader(ox, oy, zd + 0.12, B, 0.18, 0.30, '#E9E4DA')
      z.quader(ox, oy + TT - 0.18, zd + 0.12, B, 0.18, 0.30, '#E9E4DA')
      z.quader(ox, oy, zd + 0.12, 0.18, TT, 0.30, '#E9E4DA')
      z.quader(ox + B - 0.18, oy, zd + 0.12, 0.18, TT, 0.30, '#E9E4DA')
      z.quader(ox + 0.8, oy + 0.8, zd + 0.12, 2.0, 1.6, 0.75, '#E4DFD5')
      T.pflanztopf(z, ox + B - 2.2, oy + TT - 1.9, zd + 0.12)
      T.pflanztopf(z, ox + B - 3.3, oy + TT - 1.6, zd + 0.12)
      T.bank(z, ox + B - 4.8, oy + TT - 1.8, 'x')
      z.feldLinks(oy + TT - 0.18, ox + 1.2, ox + B - 1.2, zd + 0.16, zd + 0.36, PAL.akzent)
    }, 7, plan.ebenen + 1)

    buehne.setze(ox, oy, -0.5, function () { innen.malen() }, 0)

    return { breite: B, tiefe: TT, hoehe: plan.hoehe, ebenen: plan.ebenen, plan: plan }
  }

  /* ----------------------------------------------------------- Wohnhaus
     Waechst mit der Belegschaft: pro sechs Personen ein Geschoss mehr. */
  function wohnhaus (z, buehne, anzahlPersonen, ox, oy, breite, tiefe) {
    var geschosse = Math.min(8, Math.max(3, Math.ceil(anzahlPersonen / 12)))
    var g
    buehne.setze(ox, oy, -1, function () {
      z.schatten(ox, oy, breite, tiefe, 0.17, geschosse * HG)
      z.quader(ox - 0.22, oy - 0.22, 0, breite + 0.44, tiefe + 0.44, 0.16, '#CFC9BF')
    }, -1)
    for (g = 0; g < geschosse; g++) {
      (function (etage) {
        buehne.setze(ox, oy, etage * HG, function () {
          var basis = etage % 2 === 0 ? '#EBE5D9' : '#E1E5DC'
          var z0 = etage * HG
          var i
          z.quader(ox, oy, z0, breite, tiefe, HG, basis)
          fensterLinks(z, oy + tiefe, ox, ox + breite, z0 + 0.38, z0 + 1.02, PAL.glas)
          fensterRechts(z, ox + breite, oy, oy + tiefe, z0 + 0.38, z0 + 1.02, PAL.glas)
          /* Einzelne Balkone statt durchgehender Betonbaender. */
          for (i = 0; i + 1.6 < breite; i += 2) {
            z.quader(ox + i + 0.3, oy + tiefe, z0, 1.4, 0.40, 0.07, ton(basis, 0.94))
            z.quader(ox + i + 0.3, oy + tiefe + 0.34, z0 + 0.07, 1.4, 0.06, 0.30, ton(PAL.grauHell, 1.06))
          }
          for (i = 0; i + 1.6 < tiefe; i += 2) {
            z.quader(ox + breite, oy + i + 0.3, z0, 0.40, 1.4, 0.07, ton(basis, 0.94))
            z.quader(ox + breite + 0.34, oy + i + 0.3, z0 + 0.07, 0.06, 1.4, 0.30, ton(PAL.grauHell, 1.06))
          }
        })
      })(g)
    }
    /* Flachdach mit Attika */
    buehne.setze(ox, oy, geschosse * HG, function () {
      var zd = geschosse * HG
      z.quader(ox, oy, zd, breite, tiefe, 0.10, '#DDD9D0')
      /* Attika ringsum */
      z.quader(ox, oy, zd + 0.10, breite, 0.16, 0.26, '#E9E4DA')
      z.quader(ox, oy + tiefe - 0.16, zd + 0.10, breite, 0.16, 0.26, '#E9E4DA')
      z.quader(ox, oy, zd + 0.10, 0.16, tiefe, 0.26, '#E9E4DA')
      z.quader(ox + breite - 0.16, oy, zd + 0.10, 0.16, tiefe, 0.26, '#E9E4DA')
      /* Treppenhaus und ein Stueck Dachgarten. */
      z.quader(ox + 0.7, oy + 0.7, zd + 0.10, 1.9, 1.5, 0.62, '#E4DFD5')
      T.pflanztopf(z, ox + breite - 2.0, oy + tiefe - 1.9, zd + 0.10)
      T.pflanztopf(z, ox + breite - 3.1, oy + tiefe - 1.6, zd + 0.10)
      T.bank(z, ox + breite - 4.4, oy + tiefe - 1.8, 'x')
    }, 9)
    return geschosse
  }

  /* ------------------------------------------------------- Freie Parzelle
     Hier koennte bald ein Kunde stehen. */
  function parzelle (z, buehne, ox, oy, breite, tiefe) {
    var i, j
    for (i = 0; i < breite; i++) {
      for (j = 0; j < tiefe; j++) {
        (function (cx, cy) {
          buehne.setze(ox + cx, oy + cy, 0, function () {
            T.boden(z, ox + cx, oy + cy, 'erde')
          }, 0)
        })(i, j)
      }
    }
    var sx = ox + Math.floor(breite / 2), sy = oy + tiefe - 1
    buehne.setze(sx, sy, 0, function () { T.schild(z, sx, sy) }, 6)
  }

  global.Gebaeude = { hq: hq, wohnhaus: wohnhaus, parzelle: parzelle, grundriss: grundriss }
})(window)
