/* ============================================================
   Player Two, die lebende Stadt
   Platzhalter-Fassung: einfache Formen statt gerenderter Bilder.

   Bewusst getrennt:
     WELT   = Karte, Gebaeude, Arbeitsplaetze, Zimmer      (bleibt)
     LEBEN  = Zustaende, Wege, Tagesrhythmus, Ereignisse   (bleibt)
     BILD   = das Zeichnen                                 (wird spaeter ersetzt)

   Regeln aus dem Konzept, die hier hart verdrahtet sind:
   - Wer im HQ am Platz sitzt, hat WIRKLICH gearbeitet.
   - Eine Arbeitseinheit dauert mindestens vier Minuten, sonst sieht
     man von einem Lauf ueber Millisekunden nichts.
   - Ereignisse, die innerhalb einer Minute eintreffen, zaehlen als eines.
   - Ohne Arbeit entscheidet ein Zufall MIT Rhythmus, was die Figur tut,
     und zwar fuer alle Besucher gleich (Hash aus Name und Zeitfenster).
   - Kein Weg ist versperrt: jedes Gebaeude hat eine Tuer aufs Freie.
   ============================================================ */
'use strict';

var Stadt = (function () {

/* ---------------- Grundmasse ---------------- */
var BREITE = 80, HOEHE = 60;         // Kacheln
var KW = 44, KH = 22;                // Kachelmass auf dem Schirm
var ARBEIT_MS = 4 * 60 * 1000;       // Mindestdauer einer Arbeitseinheit
var BUENDEL_MS = 60 * 1000;          // Ereignisse innerhalb einer Minute = eines
var TEMPO = 2.6;                     // Kacheln pro Sekunde

/* ---------------- Karte ---------------- */
var BODEN = {WIESE:0, STRASSE:1, WASSER:2, SAND:3, PLATTE:4, PARZELLE:5};

var GEBAEUDE = [
  {id:'hq',     name:'Player Two HQ',   x:40, y:6,  b:23, h:23, tueren:[[46,28],[56,28]], farbe:'#12203A', dach:'#1A2E52', art:'hq'},
  {id:'wohnen', name:'Wohnhaus',        x:4,  y:6,  b:15, h:19, tueren:[[11,24]],          farbe:'#2A3448', dach:'#3B4760', art:'wohnen'},
  {id:'schule', name:'Schule',          x:23, y:6,  b:11, h:11, tueren:[[28,16]],          farbe:'#264268', dach:'#33578A', art:'schule'},
  {id:'restaurant', name:'Restaurant',  x:23, y:20, b:11, h:7,  tueren:[[28,26]],          farbe:'#3A3A46', dach:'#4C4C5C', art:'freizeit'},
  {id:'bar',    name:'Bar',             x:4,  y:34, b:11, h:7,  tueren:[[9,34]],           farbe:'#33303F', dach:'#464154', art:'freizeit'},
  {id:'sport',  name:'Sportplatz',      x:18, y:34, b:11, h:9,  tueren:[[23,34]],          farbe:'#28402F', dach:'#35563F', art:'freizeit'},
  {id:'bad',    name:'Schwimmbad',      x:32, y:34, b:11, h:9,  tueren:[[37,34]],          farbe:'#1E4A5C', dach:'#276076', art:'bad'}
];

var STRASSEN = [
  {x:2,  y:30, b:76, h:2},   // Hauptstrasse
  {x:36, y:2,  b:2,  h:54},  // Mitte hoch
  {x:20, y:4,  b:2,  h:28},
  {x:64, y:4,  b:2,  h:40},
  {x:20, y:44, b:58, h:2},
  {x:8,  y:24, b:2,  h:8},   // Zufahrt Wohnhaus
  {x:27, y:16, b:2,  h:6}    // Zufahrt Schule
];

/* Bauland: freie Parzellen fuer Kundengebaeude */
var PARZELLEN = [];
(function(){
  for (var r = 0; r < 3; r++) for (var c = 0; c < 2; c++) {
    PARZELLEN.push({x:67 + c*6, y:7 + r*8, b:5, h:6, belegt:false,
                    nr:'Parzelle ' + (PARZELLEN.length + 1)});
  }
})();

var karte = null, begehbar = null;

function bauKarte(){
  karte = new Uint8Array(BREITE * HOEHE);
  begehbar = new Uint8Array(BREITE * HOEHE);
  var i;
  for (i = 0; i < karte.length; i++) { karte[i] = BODEN.WIESE; begehbar[i] = 1; }

  // See und Strand unten rechts
  fuelle(46, 34, 32, 22, function(x, y){
    var tief = y >= 40;
    setz(x, y, tief ? BODEN.WASSER : BODEN.SAND);
    if (tief) sperre(x, y);
  });

  // Strassen
  STRASSEN.forEach(function(s){ fuelle(s.x, s.y, s.b, s.h, function(x,y){ setz(x,y,BODEN.STRASSE); }); });

  // Parzellen
  PARZELLEN.forEach(function(p){ fuelle(p.x, p.y, p.b, p.h, function(x,y){ setz(x,y,BODEN.PARZELLE); }); });

  // Gebaeude: Boden begehbar, Aussenwand gesperrt, Tueren frei
  GEBAEUDE.forEach(function(g){
    fuelle(g.x, g.y, g.b, g.h, function(x,y){ setz(x,y,BODEN.PLATTE); });
    for (var x = g.x; x < g.x + g.b; x++) { sperre(x, g.y); sperre(x, g.y + g.h - 1); }
    for (var y = g.y; y < g.y + g.h; y++) { sperre(g.x, y); sperre(g.x + g.b - 1, y); }
    g.tueren.forEach(function(t){ frei(t[0], t[1]); frei(t[0]+1, t[1]); });
    if (g.id === 'bad') {   // Becken in der Mitte
      fuelle(g.x+3, g.y+3, g.b-6, g.h-6, function(x,y){ setz(x,y,BODEN.WASSER); });
    }
  });
}

function idx(x,y){ return y * BREITE + x; }
function setz(x,y,v){ if (x>=0&&y>=0&&x<BREITE&&y<HOEHE) karte[idx(x,y)] = v; }
function sperre(x,y){ if (x>=0&&y>=0&&x<BREITE&&y<HOEHE) begehbar[idx(x,y)] = 0; }
function frei(x,y){ if (x>=0&&y>=0&&x<BREITE&&y<HOEHE) begehbar[idx(x,y)] = 1; }
function fuelle(x,y,b,h,fn){ for (var j=0;j<h;j++) for (var i=0;i<b;i++) fn(x+i, y+j); }
function begehbarAn(x,y){
  return x>=0 && y>=0 && x<BREITE && y<HOEHE && begehbar[idx(x,y)] === 1;
}

/* ---------------- Wegfindung (A*) ---------------- */
function weg(von, nach){
  if (!begehbarAn(nach.x, nach.y)) nach = naechsteFreie(nach);
  var start = idx(von.x, von.y), ziel = idx(nach.x, nach.y);
  if (start === ziel) return [];
  var offen = [start], kam = {}, gWert = {}, fWert = {};
  gWert[start] = 0; fWert[start] = dist(von, nach);
  var runden = 0;
  while (offen.length && runden++ < 20000) {
    var besterI = 0;
    for (var k = 1; k < offen.length; k++) if (fWert[offen[k]] < fWert[offen[besterI]]) besterI = k;
    var akt = offen.splice(besterI, 1)[0];
    if (akt === ziel) {
      var pfad = [], p = akt;
      while (p !== start) { pfad.unshift({x: p % BREITE, y: (p / BREITE) | 0}); p = kam[p]; }
      return pfad;
    }
    var ax = akt % BREITE, ay = (akt / BREITE) | 0;
    var nach4 = [[ax+1,ay],[ax-1,ay],[ax,ay+1],[ax,ay-1]];
    for (var n = 0; n < 4; n++) {
      var nx = nach4[n][0], ny = nach4[n][1];
      if (!begehbarAn(nx, ny)) continue;
      var ni = idx(nx, ny), g = gWert[akt] + 1;
      if (gWert[ni] !== undefined && g >= gWert[ni]) continue;
      kam[ni] = akt; gWert[ni] = g;
      fWert[ni] = g + Math.abs(nx - nach.x) + Math.abs(ny - nach.y);
      if (offen.indexOf(ni) < 0) offen.push(ni);
    }
  }
  return [];
}
function dist(a,b){ return Math.abs(a.x-b.x) + Math.abs(a.y-b.y); }
function naechsteFreie(p){
  for (var r = 1; r < 12; r++)
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++)
      if (begehbarAn(p.x+dx, p.y+dy)) return {x:p.x+dx, y:p.y+dy};
  return {x:38, y:31};
}

/* ---------------- Orte ---------------- */
var ORTE = {arbeitsplatz:[], zimmer:[], schulbank:[], freizeit:{}};

function bauOrte(anzahl){
  var hq = GEBAEUDE[0], i, x, y;
  // Arbeitsplaetze in Reihen im HQ
  for (i = 0; i < anzahl; i++) {
    var sp = i % 9, re = (i / 9) | 0;
    x = hq.x + 2 + sp * 2;
    y = hq.y + 3 + re * 3;
    if (y > hq.y + hq.h - 3) { y = hq.y + hq.h - 3; }
    ORTE.arbeitsplatz.push({x:x, y:y});
  }
  // Zimmer im Wohnhaus
  var wh = GEBAEUDE[1];
  for (i = 0; i < anzahl; i++) {
    var s2 = i % 6, r2 = (i / 6) | 0;
    x = wh.x + 2 + s2 * 2;
    y = wh.y + 2 + r2 * 2;
    if (y > wh.y + wh.h - 3) y = wh.y + wh.h - 3;
    ORTE.zimmer.push({x:x, y:y});
  }
  // Schulbaenke
  var sc = GEBAEUDE[2];
  for (i = 0; i < 12; i++) {
    ORTE.schulbank.push({x: sc.x + 2 + (i % 4) * 2, y: sc.y + 3 + ((i/4)|0) * 2});
  }
  ORTE.freizeit = {
    restaurant: flaeche(GEBAEUDE[3]),
    bar:        flaeche(GEBAEUDE[4]),
    sport:      flaeche(GEBAEUDE[5]),
    bad:        randUm(GEBAEUDE[6]),
    strand:     rechteck(48, 35, 26, 4),
    spaziergang:rechteck(22, 46, 40, 6)
  };
}
function flaeche(g){ return rechteck(g.x+2, g.y+2, g.b-4, g.h-4); }
function randUm(g){
  var l = [];
  for (var x = g.x+2; x < g.x+g.b-2; x++){ l.push({x:x, y:g.y+2}); l.push({x:x, y:g.y+g.h-3}); }
  return l;
}
function rechteck(x,y,b,h){
  var l = [];
  for (var j=0;j<h;j++) for (var i=0;i<b;i++) if (begehbarAn(x+i,y+j)) l.push({x:x+i,y:y+j});
  return l;
}

/* ---------------- Zufall mit Rhythmus ---------------- */
function hash(text){
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h;
}
/* Gleiches Ergebnis fuer alle Besucher: Name plus Zeitfenster */
function wuerfel(name, fenster){ return (hash(name + '|' + fenster) % 10000) / 10000; }

function tagesGewichte(stunde){
  if (stunde >= 22 || stunde < 6)  return {zimmer:80, bar:6,  spaziergang:4,  restaurant:2,  sport:2,  bad:1,  strand:5};
  if (stunde < 9)                  return {zimmer:30, restaurant:30, spaziergang:20, sport:15, bad:2,  strand:3, bar:0};
  if (stunde < 12)                 return {spaziergang:30, sport:20, restaurant:10, strand:20, bad:10, zimmer:10, bar:0};
  if (stunde < 14)                 return {restaurant:50, spaziergang:15, strand:15, bad:10, sport:5, zimmer:5, bar:0};
  if (stunde < 18)                 return {strand:25, sport:25, spaziergang:20, bad:15, restaurant:5, zimmer:10, bar:0};
  return {restaurant:25, bar:25, spaziergang:15, sport:10, zimmer:20, bad:2, strand:3};
}
var DAUER = {   // Millisekunden, wie lange eine Beschaeftigung anhaelt
  zimmer:      [40*60000, 180*60000],
  restaurant:  [25*60000, 45*60000],
  bar:         [30*60000, 70*60000],
  sport:       [20*60000, 45*60000],
  bad:         [20*60000, 40*60000],
  strand:      [25*60000, 60*60000],
  spaziergang: [12*60000, 25*60000],
  schule:      [35*60000, 70*60000]
};

/* ---------------- Figuren ---------------- */
function Figur(person, nr){
  this.name = person.name;
  this.rolle = person.rolle;
  this.aufgabe = person.aufgabe;
  this.charakter = person.charakter;
  this.abteilung = person.abteilung;
  this.status = person.status;                 // arbeitet | bereit | ausbildung
  this.nr = nr;
  this.arbeitsplatz = ORTE.arbeitsplatz[nr] || {x:50, y:20};
  this.zimmer = ORTE.zimmer[nr % ORTE.zimmer.length];
  this.pos = {x:this.zimmer.x, y:this.zimmer.y};
  this.ziel = null; this.pfad = []; this.schritt = 0;
  this.tun = 'zimmer';                         // zimmer | unterwegs | arbeit | schule | freizeit
  this.ort = 'zimmer';
  this.bis = 0;
  this.warteschlange = 0;                      // gebuendelte Arbeitseinheiten
  this.letztesEreignis = 0;
  this.ton = (hash(this.name) % 360);
}

Figur.prototype.gehZu = function(ziel){
  this.pfad = weg({x: Math.round(this.pos.x), y: Math.round(this.pos.y)}, ziel);
  this.schritt = 0;
  this.ziel = ziel;
  if (this.pfad.length) this.tun = 'unterwegs';
};

Figur.prototype.ereignis = function(jetzt){
  // Ein echter Lauf im HQ. Buendeln, wenn kurz hintereinander.
  if (jetzt - this.letztesEreignis < BUENDEL_MS && this.tun === 'arbeit') { this.letztesEreignis = jetzt; return; }
  this.letztesEreignis = jetzt;
  if (this.tun === 'arbeit') { this.warteschlange = Math.min(3, this.warteschlange + 1); return; }
  this.zurArbeit(jetzt);
};

Figur.prototype.zurArbeit = function(jetzt){
  this.gehZu(this.arbeitsplatz);
  this.nachAnkunft = function(){
    this.tun = 'arbeit'; this.ort = 'hq';
    this.bis = jetzt + ARBEIT_MS;
  };
};

Figur.prototype.neueBeschaeftigung = function(jetzt, stunde){
  var fenster = Math.floor(jetzt / (20 * 60000));            // 20-Minuten-Fenster
  var w = wuerfel(this.name, fenster + '-' + this.nr);

  if (this.status === 'ausbildung') {
    // Auszubildende: mal Schule, mal Leben. Mindestens eine ist immer da.
    var schulZeit = stunde >= 8 && stunde < 17;
    if (schulZeit && w < 0.45) return this.geheDahin('schule', jetzt, w);
  }
  var gew = tagesGewichte(stunde), summe = 0, k;
  for (k in gew) summe += gew[k];
  var wahl = w * summe, lauf = 0, ziel = 'zimmer';
  for (k in gew) { lauf += gew[k]; if (wahl <= lauf) { ziel = k; break; } }
  this.geheDahin(ziel, jetzt, w);
};

Figur.prototype.geheDahin = function(art, jetzt, w){
  var liste;
  if (art === 'zimmer') liste = [this.zimmer];
  else if (art === 'schule') liste = ORTE.schulbank;
  else liste = ORTE.freizeit[art] || [this.zimmer];
  var punkt = liste[Math.floor(w * liste.length) % liste.length];
  var d = DAUER[art] || DAUER.spaziergang;
  var dauer = d[0] + w * (d[1] - d[0]);
  this.gehZu(punkt);
  var selbst = this;
  this.nachAnkunft = function(){
    selbst.tun = art === 'schule' ? 'schule' : 'freizeit';
    selbst.ort = art;
    selbst.bis = jetzt + dauer;
  };
};

Figur.prototype.schrittWeiter = function(dt, jetzt, stunde){
  if (this.tun === 'unterwegs') {
    if (this.schritt >= this.pfad.length) {
      if (this.nachAnkunft) { this.nachAnkunft(); this.nachAnkunft = null; }
      else { this.tun = 'freizeit'; this.bis = jetzt + 60000; }
      return;
    }
    var z = this.pfad[this.schritt];
    var dx = z.x - this.pos.x, dy = z.y - this.pos.y;
    var laenge = Math.sqrt(dx*dx + dy*dy);
    var s = TEMPO * dt / 1000;
    if (laenge <= s) { this.pos.x = z.x; this.pos.y = z.y; this.schritt++; }
    else { this.pos.x += dx / laenge * s; this.pos.y += dy / laenge * s; }
    return;
  }
  if (jetzt >= this.bis) {
    if (this.tun === 'arbeit') {
      if (this.warteschlange > 0) { this.warteschlange--; this.bis = jetzt + ARBEIT_MS; return; }
      this.neueBeschaeftigung(jetzt, stunde);
    } else {
      this.neueBeschaeftigung(jetzt, stunde);
    }
  }
};

/* ---------------- Welt ---------------- */
var figuren = [], team = null, vorfuehrung = true, letzterStand = null;

function start(daten){
  team = daten;
  bauKarte();
  var alle = [];
  daten.abteilungen.forEach(function(abt){
    abt.mitarbeitende.forEach(function(m){
      alle.push({name:m.name, rolle:m.rolle, aufgabe:m.aufgabe, charakter:m.charakter,
                 abteilung:abt.name, status:m.status});
    });
  });
  bauOrte(alle.length);
  figuren = alle.map(function(p, i){ return new Figur(p, i); });
  // Startzustand: jede an einem sinnvollen Ort
  var jetzt = Date.now(), stunde = new Date().getHours();
  figuren.forEach(function(f){ f.neueBeschaeftigung(jetzt, stunde); if (f.nachAnkunft){ f.pos = {x:f.ziel.x, y:f.ziel.y}; f.schritt = f.pfad.length; f.nachAnkunft(); f.nachAnkunft = null; } });
  return figuren;
}

/* Echte Ereignisse aus dem HQ, sonst Vorfuehrung */
function standLesen(){
  return fetch('data/stadt.json', {cache:'no-store'})
    .then(function(r){ if (!r.ok) throw 0; return r.json(); })
    .then(function(d){
      var alter = Date.now() - new Date(d.stand).getTime();
      vorfuehrung = false;
      letzterStand = d;
      if (alter > 10 * 60000) return {feierabend:true, arbeiten:[]};
      return {feierabend:false, arbeiten:(d.mitarbeitende || []).filter(function(m){ return m.status === 'arbeitet'; }).map(function(m){ return m.name; })};
    })
    .catch(function(){ vorfuehrung = true; return null; });
}

var naechsteVorfuehrung = 0;
function vorfuehrungsEreignis(jetzt){
  // Nur solange kein HQ verbunden ist: hin und wieder ein Auftritt,
  // sichtbar als Vorfuehrung gekennzeichnet.
  if (jetzt < naechsteVorfuehrung) return;
  naechsteVorfuehrung = jetzt + 12000 + Math.random() * 26000;
  var bereit = figuren.filter(function(f){ return f.status !== 'ausbildung'; });
  if (!bereit.length) return;
  bereit[Math.floor(Math.random() * bereit.length)].ereignis(jetzt);
}

function tick(dt){
  var jetzt = Date.now(), stunde = new Date().getHours();
  if (vorfuehrung) vorfuehrungsEreignis(jetzt);
  for (var i = 0; i < figuren.length; i++) figuren[i].schrittWeiter(dt, jetzt, stunde);
}

function zaehlen(){
  var z = {arbeit:0, frei:0, schule:0, unterwegs:0};
  figuren.forEach(function(f){
    if (f.tun === 'arbeit') z.arbeit++;
    else if (f.tun === 'schule') z.schule++;
    else if (f.tun === 'unterwegs') z.unterwegs++;
    else z.frei++;
  });
  return z;
}

return {
  BREITE:BREITE, HOEHE:HOEHE, KW:KW, KH:KH, BODEN:BODEN,
  GEBAEUDE:GEBAEUDE, PARZELLEN:PARZELLEN,
  start:start, tick:tick, zaehlen:zaehlen, standLesen:standLesen,
  figuren:function(){ return figuren; },
  karte:function(){ return karte; },
  istVorfuehrung:function(){ return vorfuehrung; }
};
})();
