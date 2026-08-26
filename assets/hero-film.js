/* ===========================================================================
   Der gescrollte Hero-Film
   ===========================================================================

   Ein hoher Hero, in dem eine bildschirmfuellende Buehne oben klebt. Der
   Scrollfortschritt durch diesen Bereich laeuft von 0 bis 1 und treibt die
   Zeit im Video. Ist der Weg zu Ende, loest sich der Hero und der naechste
   Abschnitt kommt hoch.

   Gebaut nach dem Standard aus dem Skill 10k-websites
   (references/scrub-pipeline.md). Fuenf Dinge daraus sind keine Kuer:

   1. Das Video wird als Blob geholt, nicht als Datei-Adresse. Viele Hoster
      koennen still kein HTTP-Range. Ohne Range meldet der Browser einen
      leeren seekable-Bereich und klemmt jedes currentTime auf 0 - der Scrub
      laeuft dann lokal und ist live tot. Genau das ist hier am 26.08.2026
      passiert, nur umgekehrt: der Entwicklungsserver konnte kein Range,
      GitHub Pages schon. Der Blob macht die Frage gegenstandslos.

   2. Die Scrollposition wird nie direkt in currentTime geschrieben, sondern
      angenaehert. Die Schleife ruht, sobald sie angekommen ist, und wenn der
      Hero aus dem Bild ist. Die Normalisierung ueber Math.pow sorgt dafuer,
      dass sich das auf 60 und auf 144 Bildern pro Sekunde gleich anfuehlt.

   3. Jeder Sprung laeuft durch eine Sperre. Ungebremste Spruenge stapeln
      sich in Chrome und sind der Unterschied zwischen weich und hakelig.
      Der Fehlerzweig loest die Sperre wieder, sonst verklemmt sie.

   4. Fuenf Bedingungen entscheiden - und zwar laufend, nicht einmal beim
      Laden -, ob es statt des Films das komponierte Standbild gibt. Die
      Zeichenketten stehen zeichengleich hier und im CSS. Weichen sie
      voneinander ab, laedt die eine Seite, was die andere versteckt.

   5. Die Seite muss vollstaendig sein, wenn das Video nie ankommt. Faellt
      es aus, bleibt das Endbild stehen, und die Textstufen laufen ueber dem
      Standbild weiter.

   Der Text staffelt sich ueber eine einzige Eigenschaft: --pt-p, der
   geglaettete Fortschritt. Alles Weitere macht das CSS mit clamp(). Damit
   gibt es pro Bild genau einen Schreibzugriff statt eines Dutzends.
   =========================================================================== */
(function () {
  'use strict';

  /* Zeichengleich mit den Medienabfragen im CSS. Nicht einzeln aendern. */
  var TORE = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];

  var GLAETTUNG = 0.16;      /* Annaeherung pro Bild bei 60 Hz */
  var RUHE = 0.0005;         /* naeher dran heisst angekommen */
  var SCHRITT = 0.001;       /* kleinere Aenderung wird nicht geschrieben */

  var listen = TORE.map(function (q) { return window.matchMedia(q); });
  var heroes = [];
  var blobs = {};            /* je Adresse einmal holen, nicht je Hero */
  var laeuft = null;
  var letzterTakt = 0;
  var nutzerHatGetippt = false;

  /* ---------------------------------------------------------------- Werkzeug */
  function klemme(x, a, b) { return x < a ? a : (x > b ? b : x); }

  function statischerHero() {
    return listen.some(function (m) { return m.matches; });
  }

  /* ------------------------------------------------------------------ Ein Hero */
  function Hero(wurzel) {
    this.wurzel = wurzel;
    this.halt = wurzel.querySelector('[data-halt]') || wurzel.querySelector('.pt-halt');
    this.buehne = wurzel.querySelector('[data-buehne]') || wurzel.querySelector('.pt-stage');
    this.film = wurzel.querySelector('video');
    this.quelle = wurzel.getAttribute('data-film');
    this.plakat = wurzel.getAttribute('data-plakat');

    this.ziel = 0;          /* wohin der Scroll zeigt */
    this.gezeigt = 0;       /* was gerade zu sehen ist */
    this.geschrieben = -1;  /* was zuletzt ins CSS ging */
    this.imBild = false;
    this.geladen = false;
    this.angefragt = false;
    this.springtGerade = false;
    this.wartendeZeit = null;

    var ich = this;

    /* Das Standbild bleibt liegen, bis das Video wirklich ein Bild gemalt
       hat. Nicht bei loadedmetadata umschalten: ein gesuchtes, nie
       abgespieltes stummes Video malt in Safari sonst gar nichts, und man
       sieht eine leere Flaeche. */
    this.film.addEventListener('seeked', function () {
      ich.springtGerade = false;
      ich.buehne.classList.add('film-da');
      if (ich.wartendeZeit !== null) {
        var t = ich.wartendeZeit;
        ich.wartendeZeit = null;
        ich.springe(t);
      }
    });

    /* Der Ausstieg aus der Sperre. Ohne ihn bliebe sie nach einem Fehler
       fuer immer zu. */
    this.film.addEventListener('error', function () {
      ich.springtGerade = false;
      ich.wartendeZeit = null;
      ich.geladen = false;
      ich.buehne.classList.remove('film-da');
      ich.buehne.classList.add('film-fehlt');
    });

    /* Wann ist der Hero ueberhaupt zu sehen? Solange nicht, ruht alles. */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) {
        ich.imBild = e[0].isIntersecting;
        if (ich.imBild && an) wecken();
      }, { rootMargin: '10% 0px' }).observe(wurzel);
    } else {
      this.imBild = true;
    }
  }

  Hero.prototype.fortschritt = function () {
    /* Der Nenner ist die Hoehe der klebenden Schicht, nicht die des
       Fensters. Sobald eine Mindesthoehe greift, laufen die beiden
       auseinander und der Film waere am Ende versetzt. */
    var weg = this.wurzel.offsetHeight - this.halt.offsetHeight;
    if (weg <= 0) return 0;
    var oben = this.wurzel.getBoundingClientRect().top + window.pageYOffset;
    return klemme((window.pageYOffset - oben) / weg, 0, 1);
  };

  Hero.prototype.springe = function (t) {
    if (!this.geladen || !this.film.duration) return;
    if (this.springtGerade) { this.wartendeZeit = t; return; }
    this.springtGerade = true;
    try { this.film.currentTime = t; } catch (e) { this.springtGerade = false; }
  };

  Hero.prototype.zeichnen = function () {
    if (Math.abs(this.gezeigt - this.geschrieben) >= SCHRITT ||
        this.gezeigt === 0 || this.gezeigt === 1) {
      this.geschrieben = this.gezeigt;
      this.wurzel.style.setProperty('--pt-p', this.gezeigt.toFixed(4));
    }
    if (this.geladen) this.springe(this.gezeigt * this.film.duration);
  };

  /* Poster und Video liegen ausschliesslich hinter den fuenf Toren. Auf dem
     Telefon wird also weder das eine noch das andere geladen. */
  Hero.prototype.laden = function () {
    if (this.angefragt || !this.quelle) return;
    this.angefragt = true;
    var ich = this;

    if (this.plakat) {
      this.buehne.style.setProperty('--pt-plakat', "url('" + this.plakat + "')");
      this.buehne.classList.add('plakat-da');
    }

    /* Das Plakat gewinnt das Rennen um die Bandbreite mit Absicht: erst
       malen, dann den Blob holen. Der Zeitgeber ist die Sicherung, falls
       das Plakat nie ankommt. */
    var gestartet = false;
    function los() {
      if (gestartet) return;
      gestartet = true;
      hole().catch(scheitern);
    }

    function hole() {
      /* Liegen mehrere Heroes auf einer Seite - so wie auf der
         Vergleichsseite fuer die Laengen -, wird die Datei trotzdem nur
         einmal geholt. */
      if (!blobs[ich.quelle]) {
        blobs[ich.quelle] = fetch(ich.quelle, { priority: 'low' })
          .then(function (a) {
            if (!a.ok) throw new Error('HTTP ' + a.status);
            return a.blob();
          })
          .then(function (b) { return URL.createObjectURL(b); });
      }
      return blobs[ich.quelle]
        .then(function (adresse) {
          ich.film.src = adresse;
          ich.film.load();
          return new Promise(function (fertig, daneben) {
            ich.film.addEventListener('loadeddata', fertig, { once: true });
            ich.film.addEventListener('error', daneben, { once: true });
          });
        })
        .then(function () {
          ich.geladen = true;
          /* Auf die aktuelle Scrollposition springen. Ohne das steht das
             Bild still, bis jemand scrollt. */
          ich.springe(ich.fortschritt() * ich.film.duration);
          if (nutzerHatGetippt) ich.anstupsen();
        });
    }

    function scheitern() {
      ich.geladen = false;
      ich.buehne.classList.add('film-fehlt');
    }

    if (this.plakat) {
      var bild = new Image();
      bild.onload = los;
      bild.onerror = los;
      bild.src = this.plakat;
      window.setTimeout(los, 4000);
    } else {
      los();
    }
  };

  /* Safari auf dem iPad malt ein Video erst, wenn es einmal gelaufen ist.
     Einmal stumm anspielen und sofort anhalten reicht. Braucht eine echte
     Nutzergeste, deshalb haengt es am ersten Tippen. */
  Hero.prototype.anstupsen = function () {
    if (!this.geladen) return;
    var v = this.film;
    try {
      var p = v.play();
      if (p && p.then) p.then(function () { v.pause(); }).catch(function () {});
      else v.pause();
    } catch (e) {}
  };

  /* ------------------------------------------------------------- Die Schleife */
  function takt(jetzt) {
    if (!an) { laeuft = null; letzterTakt = 0; return; }
    var dt = Math.min(100, jetzt - (letzterTakt || jetzt));
    letzterTakt = jetzt;
    var naeher = 1 - Math.pow(1 - GLAETTUNG, dt / 16.667);
    var weiter = false;

    for (var i = 0; i < heroes.length; i++) {
      var h = heroes[i];
      if (!h.imBild) continue;
      h.gezeigt += (h.ziel - h.gezeigt) * naeher;
      if (Math.abs(h.ziel - h.gezeigt) < RUHE) h.gezeigt = h.ziel;
      else weiter = true;
      h.zeichnen();
    }

    if (weiter) {
      laeuft = window.requestAnimationFrame(takt);
    } else {
      laeuft = null;
      letzterTakt = 0;
    }
  }

  function wecken() {
    if (laeuft === null) laeuft = window.requestAnimationFrame(takt);
  }

  function beimScrollen() {
    /* Das Ziel wird immer gesetzt, auch fuer Heroes ausserhalb des Bildes.
       Sonst gaebe es ein Wettrennen mit dem Beobachter, der erst ein, zwei
       Bilder spaeter meldet. Gearbeitet wird trotzdem nur an dem, was man
       sieht - das entscheidet takt(). */
    for (var i = 0; i < heroes.length; i++) {
      heroes[i].ziel = heroes[i].fortschritt();
    }
    wecken();
  }

  /* ------------------------------------------------------------------- Tore */
  var an = false;

  function anschalten() {
    if (an) return;
    an = true;
    document.documentElement.classList.add('pt-film-an');
    heroes.forEach(function (h) {
      h.laden();
      h.geschrieben = -1;          /* Zwischenspeicher leeren */
      h.ziel = h.fortschritt();
      h.gezeigt = h.ziel;
      h.zeichnen();
    });
    window.addEventListener('scroll', beimScrollen, { passive: true });
    beimScrollen();
  }

  function abschalten() {
    /* Die Klasse wird immer entfernt, auch wenn nie eingeschaltet wurde:
       gesetzt hat sie schon die Vorabpruefung im Kopf, und wenn danach
       jemand das Fenster dreht, muss sie wieder weg. */
    document.documentElement.classList.remove('pt-film-an');
    /* Der Text steht im fertigen Zustand - auch dann, wenn nie
       eingeschaltet wurde. */
    heroes.forEach(function (h) {
      h.geschrieben = -1;
      h.wurzel.style.setProperty('--pt-p', '1');
    });
    if (!an) return;
    an = false;
    window.removeEventListener('scroll', beimScrollen);
    if (laeuft !== null) { window.cancelAnimationFrame(laeuft); laeuft = null; }
  }

  function toreLesen() {
    if (statischerHero()) abschalten();
    else anschalten();
  }

  /* ------------------------------------------------------------------ Aufbau */
  function aufbauen() {
    var gefunden = document.querySelectorAll('[data-film]');
    for (var i = 0; i < gefunden.length; i++) {
      var w = gefunden[i];
      if (!w.querySelector('video')) continue;
      heroes.push(new Hero(w));
    }
    if (!heroes.length) return;

    listen.forEach(function (m) {
      if (m.addEventListener) m.addEventListener('change', toreLesen);
      else if (m.addListener) m.addListener(toreLesen);
    });
    window.addEventListener('resize', function () {
      heroes.forEach(function (h) { h.geschrieben = -1; });
      beimScrollen();
    });

    function ersteGeste() {
      nutzerHatGetippt = true;
      heroes.forEach(function (h) { h.anstupsen(); });
    }
    window.addEventListener('pointerdown', ersteGeste, { once: true, passive: true });
    window.addEventListener('touchstart', ersteGeste, { once: true, passive: true });

    /* Der Text soll beim ersten Anstrich schon stehen, nicht erst
       hereinwandern. Die Klasse loest nur die einmalige Ankunft aus. */
    document.documentElement.classList.add('pt-hero-bereit');

    toreLesen();
  }

  /* Die Entscheidung faellt sofort, noch bevor der Koerper gelesen ist.
     Steht sie erst nach DOMContentLoaded, blitzt beim Laden kurz der
     statische Hero auf, bevor der Film uebernimmt. Deshalb wird diese
     Datei im Kopf ohne defer eingebunden. */
  if (!statischerHero()) document.documentElement.classList.add('pt-film-an');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aufbauen);
  } else {
    aufbauen();
  }
})();
