/* ============================================================
   Setzmodus — die drei Meldungen im Hero von Hand setzen

   Aufruf: index-vorschlag.html?setzen
   Ohne diesen Zusatz in der Adresse wird die Datei gar nicht geladen.
   Sie gehört zum Werkzeug, nicht zur Seite.

   Jede Meldung hat genau einen Platz. Die zwei Knöpfe oben zeigen nur,
   wie es in der jeweiligen Phase aussieht - die Lage bleibt gleich, sonst
   würden die Meldungen beim Scrollen wandern.

   Bedienung: Karte anfassen und ziehen. Pfeiltasten bewegen die
   ausgewählte Karte um ein Zehntelprozent, mit Shift um ein
   Hundertstel. Die Werte stehen live im Feld unten links und lassen
   sich von dort ins CSS kopieren.
   ============================================================ */
(function () {
  'use strict';

  var hero = document.querySelector('[data-pt-hero]');
  if (!hero) { console.warn('Setzmodus: kein Hero gefunden.'); return; }

  var karten = [].slice.call(hero.querySelectorAll('.pt-task'));
  if (karten.length !== 3) { console.warn('Setzmodus: drei Karten erwartet.'); return; }

  var NAMEN = ['Maler', 'Bäckerei', 'Treuhand', 'Player Two'];
  var WAHL = ['.pt-painter', '.pt-bakery', '.pt-office'];

  /* Der Kreis in der Mitte. Er hat einen einzigen Platz fuer alle
     Stellungen, darum steht er neben werte[] und nicht darin. */
  var kreis = hero.querySelector('.pt-hub');
  var kreisWert = null;
  var alle = karten.concat(kreis ? [kreis] : []);

  /* Nur zwei Ansichten, keine zwei Stellungen: beide schreiben dieselben
     Regeln. Phase 1 zeigt den Eingang, Phase 2 die Arbeit. */
  var STELLUNG = [
    {name: 'Eingang', phase: 1},
    {name: 'Beim Arbeiten', phase: 2}
  ];
  var stellung = 0, gewaehlt = 0;

  /* ---------- eigenes Stilblatt, ganz am Schluss ----------
     Muss in den Body und dort ans Ende: das .pt-CSS der Seite steht
     selbst in einem <style> im Body. Ein Blatt im <head> stuende
     weiter vorne und wuerde bei gleicher Staerke verlieren. */
  var stil = document.createElement('style');
  stil.id = 'setz-stil';
  document.body.appendChild(stil);

  var werte = {};   /* Wahl -> {links, oben}, einmal fuer alle Phasen */

  /* ---------- Hilfen ---------- */
  function eltern() { return karten[0].offsetParent || hero.querySelector('.pt-stage'); }

  function lesen(i) {
    var el = alle[i], e = el.offsetParent || eltern();
    return {
      links: el.offsetLeft / e.offsetWidth * 100,
      oben: el.offsetTop / e.offsetHeight * 100
    };
  }

  /* Beim Wechsel der Stellung einmal ablesen, was das CSS vorgibt. */
  function grundwerteHolen() {
    var s = STELLUNG[stellung];
    if (kreis && !kreisWert) kreisWert = lesen(3);
    if (werte[WAHL[0]]) return;
    for (var i = 0; i < 3; i++) werte[WAHL[i]] = lesen(i);
  }

  function schreiben() {
    var zeilen = [];
    for (var i = 0; i < 3; i++) {
      var w = werte[WAHL[i]];
      zeilen.push(WAHL[i] + '{left:' + w.links.toFixed(2) + '%;top:' + w.oben.toFixed(2) + '%}');
    }
    var zusatz = [];
    if (kreisWert) {
      zeilen.push('.pt-hub{left:' + kreisWert.links.toFixed(2) +
                  '%;top:' + kreisWert.oben.toFixed(2) + '%}');
    }
    stil.textContent = zeilen.concat(zusatz).join('\n');
    /* Die Linien laufen vom Kreis zu den Karten und muessen mit. */
    if (hero.ptLinien) hero.ptLinien();
    anzeigen();
  }

  /* ---------- Bedienfeld ---------- */
  var feld = document.createElement('div');
  feld.id = 'setz-feld';
  feld.innerHTML =
    '<div class="sf-kopf">Setzmodus<button class="sf-zu" title="schliessen">×</button></div>' +
    '<div class="sf-schalter"></div>' +
    '<table class="sf-tabelle"></table>' +
    '<div class="sf-abstand"></div>' +
    '<div class="sf-knoepfe">' +
      '<button data-tu="verteilen">gleichmässig verteilen</button>' +
      '<button data-tu="zurueck">zurücksetzen</button>' +
    '</div>' +
    '<textarea class="sf-css" readonly rows="3"></textarea>' +
    '<div class="sf-knoepfe">' +
      '<button class="sf-speichern" data-tu="speichern">In die Datei speichern</button>' +
      '<button data-tu="kopieren">CSS kopieren</button>' +
    '</div>' +
    '<p class="sf-meldung"></p>' +
    '<p class="sf-hilfe">Ziehen · Pfeiltasten = 0,1 % · Shift+Pfeil = 0,01 % · Esc schliesst.<br>' +
      'Der Kreis erscheint erst bei „Beim Arbeiten“; die Linien folgen von selbst.<br>' +
      'Die beiden Knöpfe oben zeigen nur die Ansicht — die Plätze gelten für beide.</p>';
  document.body.appendChild(feld);

  var stilFeld = document.createElement('style');
  stilFeld.textContent =
    '#setz-feld{position:fixed;left:14px;bottom:14px;z-index:99999;width:310px;' +
      'padding:12px 13px 11px;border-radius:12px;background:rgba(11,18,32,.94);' +
      'color:#E8EDF5;font:12px/1.45 ui-monospace,Consolas,monospace;' +
      'box-shadow:0 18px 48px rgba(0,0,0,.45);backdrop-filter:blur(10px)}' +
    '.sf-kopf{display:flex;justify-content:space-between;align-items:center;' +
      'font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:10px;' +
      'color:#7FD4FF;margin-bottom:9px}' +
    '.sf-zu{background:none;border:0;color:#8697AE;font-size:17px;line-height:1;cursor:pointer;padding:0 2px}' +
    '.sf-schalter{display:flex;gap:6px;margin-bottom:9px}' +
    '.sf-schalter button{flex:1;padding:6px 4px;border-radius:7px;cursor:pointer;' +
      'border:1px solid rgba(255,255,255,.16);background:transparent;color:#B9C6D8;font:inherit}' +
    '.sf-schalter button.an{background:#1E6CFF;border-color:#1E6CFF;color:#fff}' +
    '.sf-tabelle{width:100%;border-collapse:collapse}' +
    '.sf-tabelle td{padding:2px 0}' +
    '.sf-tabelle tr.an td{color:#7FD4FF}' +
    '.sf-tabelle td:first-child{width:74px;cursor:pointer}' +
    '.sf-tabelle td.z{text-align:right;width:60px;font-variant-numeric:tabular-nums}' +
    '.sf-abstand{margin:8px 0 9px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12);color:#B9C6D8}' +
    '.sf-abstand b{color:#fff}' +
    '.sf-abstand .gut{color:#5BD98A}' +
    '.sf-knoepfe{display:flex;gap:6px;margin-bottom:8px}' +
    '.sf-knoepfe button,.sf-kopieren{padding:6px 8px;border-radius:7px;cursor:pointer;' +
      'border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#E8EDF5;font:inherit}' +
    '.sf-knoepfe button{flex:1}' +
    '.sf-speichern{background:#1E6CFF;border-color:#1E6CFF;font-weight:700}' +
    '.sf-meldung{margin:7px 0 0;min-height:14px;font-size:10.5px;color:#5BD98A}' +
    '.sf-css{width:100%;box-sizing:border-box;background:rgba(0,0,0,.35);color:#9FE6C0;' +
      'border:1px solid rgba(255,255,255,.12);border-radius:7px;padding:7px;' +
      'font:11px/1.5 ui-monospace,Consolas,monospace;resize:vertical}' +
    '.sf-hilfe{margin:8px 0 0;color:#8697AE;font-size:10.5px;line-height:1.5}' +
    /* Im Setzmodus lassen sich die Karten anfassen und springen nicht nach. */
    'body.setzt .pt-tasks,body.setzt .pt-hub{pointer-events:auto}' +
    'body.setzt .pt-hub{cursor:grab;transition:none!important}' +
    'body.setzt .pt-task{transition:none!important;cursor:grab}' +
    'body.setzt .pt-task.zieht{cursor:grabbing}' +
    'body.setzt .pt-task.gewaehlt,body.setzt .pt-hub.gewaehlt'+
      '{outline:2px solid #1E6CFF;outline-offset:3px}';
  document.body.appendChild(stilFeld);
  document.body.classList.add('setzt');
  /* Der Randschutz der Seite schiebt Karten mit einem Rand zurueck.
     Der muss weg, sonst liest der Setzmodus den korrigierten statt den
     gesetzten Platz - und schriebe ihn beim Speichern fest. */
  alle.forEach(function (k) { k.style.margin = ''; });

  var schalter = feld.querySelector('.sf-schalter');
  STELLUNG.forEach(function (s, i) {
    var b = document.createElement('button');
    b.textContent = s.name;
    b.onclick = function () { stellungSetzen(i); };
    schalter.appendChild(b);
  });

  var tab = feld.querySelector('.sf-tabelle');
  NAMEN.forEach(function (n, i) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + n + '</td><td class="z" data-l></td><td class="z" data-o></td>';
    tr.firstChild.onclick = function () { waehlen(i); };
    tab.appendChild(tr);
  });

  /* ---------- Anzeige ---------- */
  function anzeigen() {
    var zeilen = tab.querySelectorAll('tr');
    for (var i = 0; i < alle.length; i++) {
      var w = i === 3 ? kreisWert : werte[WAHL[i]];
      if (!w) continue;
      zeilen[i].querySelector('[data-l]').textContent = w.links.toFixed(2) + ' %';
      zeilen[i].querySelector('[data-o]').textContent = w.oben.toFixed(2) + ' %';
      zeilen[i].classList.toggle('an', i === gewaehlt);
      alle[i].classList.toggle('gewaehlt', i === gewaehlt);
    }
    [].forEach.call(schalter.children, function (b, i) { b.classList.toggle('an', i === stellung); });

    /* Die Abstände in der Breite - das ist der Punkt, auf den es ankommt. */
    var r = karten.map(function (k) { return k.getBoundingClientRect(); });
    var a1 = Math.round(r[1].left - r[0].right), a2 = Math.round(r[2].left - r[1].right);
    var gleich = Math.abs(a1 - a2) <= 2;
    feld.querySelector('.sf-abstand').innerHTML =
      'Abstände: <b>' + a1 + ' px</b> · <b>' + a2 + ' px</b>' +
      (gleich ? ' <span class="gut">✓ gleich</span>' : ' <span>Δ ' + Math.abs(a1 - a2) + ' px</span>');

    feld.querySelector('.sf-css').value = stil.textContent
      .split('\n').filter(function (z) {
        return z.indexOf('.pt-') === 0;
      }).join('\n');
  }

  function waehlen(i) {
    /* Der Kreis erscheint erst, waehrend Player Two arbeitet. */
    if (i === 3 && stellung !== 1) stellungSetzen(1);
    gewaehlt = i;
    anzeigen();
  }

  function stellungSetzen(i) {
    stellung = i;
    hero.setAttribute('data-pt-halt', '');
    if (hero.ptPhaseSetzen) hero.ptPhaseSetzen(STELLUNG[i].phase);
    else hero.className = 'pt-hero pt-phase-' + STELLUNG[i].phase;
    /* Umbruch erzwingen, dann steht die neue Stellung im Layout. */
    void hero.offsetWidth;
    grundwerteHolen();
    schreiben();
  }

  /* ---------- Ziehen ---------- */
  var zieht = null;
  alle.forEach(function (k, i) {
    k.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      waehlen(i);
      var e = k.offsetParent || eltern(), w = wertVon(i);
      zieht = {i: i, x: ev.clientX, y: ev.clientY, l: w.links, o: w.oben,
               bw: e.offsetWidth, bh: e.offsetHeight};
      k.classList.add('zieht');
      k.setPointerCapture(ev.pointerId);
    });
    k.addEventListener('pointermove', function (ev) {
      if (!zieht || zieht.i !== i) return;
      var w = wertVon(i);
      w.links = grenze(zieht.l + (ev.clientX - zieht.x) / zieht.bw * 100, 0, 97);
      w.oben = grenze(zieht.o + (ev.clientY - zieht.y) / zieht.bh * 100, 0, 92);
      schreiben();
    });
    k.addEventListener('pointerup', function () { zieht = null; k.classList.remove('zieht'); });
    k.addEventListener('pointercancel', function () { zieht = null; k.classList.remove('zieht'); });
  });

  function wertVon(i) { return i === 3 ? kreisWert : werte[WAHL[i]]; }

  function grenze(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* ---------- Tastatur ---------- */
  addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { schliessen(); return; }
    var richtung = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[ev.key];
    if (!richtung) return;
    ev.preventDefault();
    var schritt = ev.shiftKey ? 0.01 : 0.1;
    var w = wertVon(gewaehlt);
    w.links = grenze(w.links + richtung[0] * schritt, 0, 97);
    w.oben = grenze(w.oben + richtung[1] * schritt, 0, 92);
    schreiben();
  });

  /* ---------- Knöpfe ---------- */
  feld.addEventListener('click', function (ev) {
    var tu = ev.target.getAttribute && ev.target.getAttribute('data-tu');
    if (!tu) return;

    if (tu === 'verteilen') {
      /* Aussen bleiben stehen, die mittlere rückt so, dass beide
         Lücken gleich gross sind. */
      var b = karten.map(function (k) { return k.getBoundingClientRect().width; });
      var e = eltern(), bw = e.offsetWidth;
      var links = werte[WAHL[0]].links;
      var rechts = werte[WAHL[2]].links;
      var spanne = (rechts - links) * bw / 100;          /* in Bildpunkten */
      var luecke = (spanne - b[0] - b[1]) / 2;
      werte[WAHL[1]].links = links + (b[0] + luecke) / bw * 100;
      schreiben();
    }

    if (tu === 'zurueck') {
      werte = {};
      kreisWert = null;
      stil.textContent = '';
      void hero.offsetWidth;
      grundwerteHolen();
      schreiben();
    }

    if (tu === 'speichern') {
      /* Beide Stellungen mitschicken - auch die, die gerade nicht
         angezeigt wird, falls sie schon gesetzt wurde. */
      var regeln = [];
      WAHL.forEach(function (w) {
        if (!werte[w]) return;
        regeln.push({wahl: w, links: +werte[w].links.toFixed(2),
                     oben: +werte[w].oben.toFixed(2)});
      });
      if (kreisWert) {
        regeln.push({wahl: '.pt-hub', links: +kreisWert.links.toFixed(2),
                     oben: +kreisWert.oben.toFixed(2)});
      }
      var meldung = feld.querySelector('.sf-meldung');
      meldung.style.color = '#B9C6D8';
      meldung.textContent = 'speichert …';
      fetch('/hero', {
        method: 'POST',
        body: JSON.stringify({datei: location.pathname.split('/').pop(), regeln: regeln})
      }).then(function (a) { return a.ok ? a.text() : a.text().then(function(x){ throw new Error(x); }); })
        .then(function (text) {
          meldung.style.color = '#5BD98A';
          meldung.textContent = '✓ ' + text;
        })
        .catch(function (f) {
          meldung.style.color = '#FF8A8A';
          meldung.textContent = 'ging nicht: ' + f.message;
        });
    }

    if (tu === 'kopieren') {
      var text = feld.querySelector('.sf-css').value;
      var knopf = ev.target;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          knopf.textContent = 'kopiert';
          setTimeout(function () { knopf.textContent = 'CSS kopieren'; }, 1400);
        });
      } else {
        feld.querySelector('.sf-css').select();
      }
    }
  });

  feld.querySelector('.sf-zu').onclick = schliessen;

  function schliessen() {
    document.body.classList.remove('setzt');
    hero.removeAttribute('data-pt-halt');
    feld.remove();
    alle.forEach(function (k) { k.classList.remove('gewaehlt', 'zieht'); });
    console.log('Setzmodus aus. Das gesetzte CSS bleibt bis zum Neuladen stehen.');
  }

  /* ---------- Los ---------- */
  scrollTo(0, 0);
  stellungSetzen(0);
  console.log('Setzmodus an.');
})();
