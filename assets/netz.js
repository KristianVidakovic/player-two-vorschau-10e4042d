/* Player Two — das Wegenetz.

   Aus einzelnen gezeichneten Linien wird ein zusammenhängendes Netz: Punkte
   verschiedener Linien, die nahe beieinander liegen, werden zu einer Kreuzung
   verschmolzen. Danach findet der Code selbst den kürzesten Weg von jedem
   Ort zu jedem anderen.

   Die Innenräume der Gebäude sind bewusst NICHT mit den Strassen verbunden.
   Man läuft nicht durch die Wand. Verbunden werden sie über die Ein- und
   Ausstiege: Wer zum Eingang läuft, verschwindet dort und taucht drinnen am
   Ausstieg wieder auf. Im Netz ist das ein unsichtbarer Knoten pro Gebäude,
   an dem alle Ein- und Ausstiege desselben Hauses zusammenlaufen. */

(function (global) {
  'use strict'

  var SCHNAPP = 34       /* näher beieinander heisst dieselbe Kreuzung */
  var ANSCHLUSS = 110    /* so weit darf ein Ein-/Ausstieg vom Weg entfernt sein */
  var ANLAUF = 150       /* so weit darf ein Platz von der naechsten Linie entfernt sein.
                            Weiter weg heisst: dorthin gibt es keinen Weg. Ohne diese
                            Grenze wuerde der Code quer durch Waende laufen lassen. */

  /* Aus dem Namen eines Halts ableiten, zu welchem Haus er gehört und ob er
     hinein- oder hinausführt. Der Name wird von Hand vergeben, deshalb
     grosszügig auslegen und Tippfehler mitnehmen. */
  function haltLesen (name) {
    var s = String(name || '').toLowerCase()
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a').replace(/ß/g, 'ss')
    var gruppe =
      /zwischen/.test(s) ? 'zwischenstueck' :
      /wohnhaus/.test(s) ? 'wohnhaus' :
      /schule/.test(s) ? 'schule' :
      /restaur/.test(s) ? 'restaurant' :
      /schwimm|becken/.test(s) ? 'schwimmbad' :
      /sport|gerat/.test(s) ? 'sport' :
      /(^|[^a-z])bar([^a-z]|$)/.test(s) ? 'bar' :
      /hq|lift|buro/.test(s) ? 'hq' : 'sonstige'
    var hinaus = /ausgang|ausstieg|austieg|ausst/.test(s)
    return { gruppe: gruppe, richtung: hinaus ? 'aus' : 'ein' }
  }

  function Netz (wege, halte) {
    this.knoten = []          /* {x, y, nachbarn:[{k,l}], sprung:bool, name} */
    this.raster = {}
    this.gruppen = {}
    this._ausWegen(wege || [])
    this._ausHalten(halte || [])
  }

  Netz.prototype._schluessel = function (x, y) {
    return Math.floor(x / SCHNAPP) + ':' + Math.floor(y / SCHNAPP)
  }

  Netz.prototype._knoten = function (x, y, neuErzwingen) {
    if (!neuErzwingen) {
      var gx = Math.floor(x / SCHNAPP), gy = Math.floor(y / SCHNAPP)
      for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
          var feld = this.raster[(gx + i) + ':' + (gy + j)]
          if (!feld) continue
          for (var k = 0; k < feld.length; k++) {
            var n = this.knoten[feld[k]]
            if (!n.sprung && Math.hypot(n.x - x, n.y - y) <= SCHNAPP) return feld[k]
          }
        }
      }
    }
    var id = this.knoten.length
    this.knoten.push({ x: x, y: y, nachbarn: [] })
    var s = this._schluessel(x, y)
    if (!this.raster[s]) this.raster[s] = []
    this.raster[s].push(id)
    return id
  }

  Netz.prototype._kante = function (a, b, kosten) {
    if (a === b) return
    var ka = this.knoten[a], kb = this.knoten[b]
    var l = kosten === undefined ? Math.hypot(ka.x - kb.x, ka.y - kb.y) : kosten
    for (var i = 0; i < ka.nachbarn.length; i++) if (ka.nachbarn[i].k === b) return
    ka.nachbarn.push({ k: b, l: l })
    kb.nachbarn.push({ k: a, l: l })
  }

  Netz.prototype._ausWegen = function (wege) {
    var selbst = this
    wege.forEach(function (w) {
      var p = w.punkte || w
      if (!p || p.length < 2) return
      var vorher = selbst._knoten(p[0][0], p[0][1])
      for (var i = 1; i < p.length; i++) {
        var jetzt = selbst._knoten(p[i][0], p[i][1])
        selbst._kante(vorher, jetzt)
        vorher = jetzt
      }
    })
  }

  /* Ein- und Ausstiege anschliessen und pro Haus zusammenführen. */
  Netz.prototype._ausHalten = function (halte) {
    var selbst = this
    var nachGruppe = {}

    halte.forEach(function (h) {
      var art = haltLesen(h.name)
      var k = selbst._knoten(h.x, h.y)
      selbst.knoten[k].name = h.name
      selbst.knoten[k].halt = art
      /* An den nächstgelegenen Weg anbinden, damit man überhaupt hinkommt. */
      var nah = selbst.naechster(h.x, h.y, k)
      if (nah.k >= 0 && nah.abstand <= ANSCHLUSS) selbst._kante(k, nah.k)
      if (!nachGruppe[art.gruppe]) nachGruppe[art.gruppe] = []
      nachGruppe[art.gruppe].push(k)
    })

    /* Pro Haus ein unsichtbarer Knoten, an dem alle Türen zusammenlaufen.
       Der Weg durch ihn hindurch ist der Sprung. */
    Object.keys(nachGruppe).forEach(function (g) {
      var mitglieder = nachGruppe[g]
      if (mitglieder.length < 2) return
      var mx = 0, my = 0
      mitglieder.forEach(function (k) { mx += selbst.knoten[k].x; my += selbst.knoten[k].y })
      var nabe = selbst._knoten(mx / mitglieder.length, my / mitglieder.length, true)
      selbst.knoten[nabe].sprung = true
      selbst.knoten[nabe].name = 'nabe-' + g
      /* Kosten klein halten, aber nicht null: sonst wird der Sprung als
         Abkürzung für Wege benutzt, die man auch laufen könnte. */
      mitglieder.forEach(function (k) { selbst._kante(k, nabe, 60) })
      selbst.gruppen[g] = { nabe: nabe, mitglieder: mitglieder }
    })
  }

  Netz.prototype.naechster = function (x, y, ausser) {
    var best = -1, bestL = Infinity
    for (var i = 0; i < this.knoten.length; i++) {
      if (i === ausser || this.knoten[i].sprung) continue
      var l = Math.hypot(this.knoten[i].x - x, this.knoten[i].y - y)
      if (l < bestL) { bestL = l; best = i }
    }
    return { k: best, abstand: bestL }
  }

  Netz.prototype.route = function (vonK, nachK) {
    if (vonK === nachK) return [vonK]
    var n = this.knoten.length
    var kosten = new Float64Array(n)
    var vorher = new Int32Array(n)
    var fertig = new Uint8Array(n)
    var i
    for (i = 0; i < n; i++) { kosten[i] = Infinity; vorher[i] = -1 }
    kosten[vonK] = 0

    for (;;) {
      var beste = -1, besteK = Infinity
      for (i = 0; i < n; i++) if (!fertig[i] && kosten[i] < besteK) { besteK = kosten[i]; beste = i }
      if (beste < 0 || beste === nachK) break
      fertig[beste] = 1
      var nb = this.knoten[beste].nachbarn
      for (i = 0; i < nb.length; i++) {
        var neu = besteK + nb[i].l
        if (neu < kosten[nb[i].k]) { kosten[nb[i].k] = neu; vorher[nb[i].k] = beste }
      }
    }

    if (kosten[nachK] === Infinity) return null
    var kette = [], z = nachK
    while (z >= 0) { kette.unshift(z); z = vorher[z] }
    return kette
  }

  /* Der fertige Weg, zerlegt in Abschnitte: Laufen und Sprünge.
     Ein Sprung ist der Gang durch eine Tür oder die Fahrt im Lift. */
  Netz.prototype.wegVon = function (vx, vy, nx, ny) {
    if (!this.knoten.length) return null
    var a = this.naechster(vx, vy)
    var b = this.naechster(nx, ny)
    if (a.k < 0 || b.k < 0) return null
    if (a.abstand > ANLAUF || b.abstand > ANLAUF) return null
    var kette = this.route(a.k, b.k)
    if (!kette) return null

    var selbst = this
    var abschnitte = []
    var laufend = [[vx, vy]]

    function laufendAbschliessen () {
      var sauber = laufend.filter(function (p, i) {
        return i === 0 || Math.hypot(p[0] - laufend[i - 1][0], p[1] - laufend[i - 1][1]) > 1
      })
      if (sauber.length >= 2) abschnitte.push({ art: 'gehen', punkte: sauber })
      laufend = []
    }

    for (var i = 0; i < kette.length; i++) {
      var k = selbst.knoten[kette[i]]
      if (k.sprung) {
        /* Der Knoten davor ist die Tür hinein, der danach die Tür hinaus. */
        var vonK = selbst.knoten[kette[i - 1]]
        var nachK = selbst.knoten[kette[i + 1]]
        if (vonK && nachK) {
          laufendAbschliessen()
          abschnitte.push({
            art: 'sprung',
            von: [vonK.x, vonK.y],
            nach: [nachK.x, nachK.y],
            gruppe: (k.name || '').replace('nabe-', '')
          })
          laufend = [[nachK.x, nachK.y]]
        }
        continue
      }
      laufend.push([k.x, k.y])
    }
    laufend.push([nx, ny])
    laufendAbschliessen()

    return abschnitte.length ? abschnitte : null
  }

  global.Netz = Netz
  global.Netz.haltLesen = haltLesen
})(window)
