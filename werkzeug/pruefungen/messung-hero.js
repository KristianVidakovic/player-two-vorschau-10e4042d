(async()=>{
  const h = document.getElementById('hero');
  const v = document.querySelector('.pt-film');
  const halt = document.querySelector('.pt-halt');
  const warte = ms => new Promise(r => setTimeout(r, ms));
  // Erst zaehlen, ob die Seite ueberhaupt Bilder zeichnet
  let rafs = 0, scrolls = 0;
  requestAnimationFrame(function s(){ rafs++; requestAnimationFrame(s); });
  addEventListener('scroll', () => scrolls++, {passive:true});
  await warte(500);
  const weg = h.offsetHeight - innerHeight;
  const verlauf = [];
  for (const f of [0, .07, .14, .30, .50, .70, .85, .94, 1.0, 1.15]) {
    window.scrollTo({top: Math.round(f*weg), behavior:'instant'});
    await warte(220);
    verlauf.push({
      soll: f, scrollY: window.scrollY,
      videozeit: +v.currentTime.toFixed(3),
      oeffnung: getComputedStyle(h).getPropertyValue('--pt-oeffnung').trim(),
      halt_oben: Math.round(halt.getBoundingClientRect().top),
      flaeche: getComputedStyle(h.querySelector('.pt-copy')).backgroundColor,
    });
  }
  window.scrollTo({top:0, behavior:'instant'});
  return {
    animationsbilder: rafs, scroll_ereignisse: scrolls,
    weg, filmdauer: v.duration, filmbereit: v.readyState,
    filmfehler: v.error ? v.error.code : null,
    klasse: document.documentElement.className.trim(),
    reduzierte_bewegung: matchMedia('(prefers-reduced-motion:reduce)').matches,
    verlauf,
  };
})()
