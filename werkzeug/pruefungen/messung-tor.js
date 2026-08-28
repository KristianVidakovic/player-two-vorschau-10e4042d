(async()=>{
  const warte = ms => new Promise(r=>setTimeout(r,ms));
  await warte(2500);
  const h=document.getElementById('hero'), halt=h.querySelector('.pt-halt');
  const v=h.querySelector('video');
  // Wurde das Video ueberhaupt angefordert?
  const geholt = performance.getEntriesByType('resource')
    .filter(e=>/hero-wandel/.test(e.name)).map(e=>e.name.split('/').pop()+' '+Math.round(e.transferSize/1024)+'kB');
  return {
    breite:innerWidth, hoehe:innerHeight,
    klasse:document.documentElement.className.trim(),
    heroHoehe:h.offsetHeight, haltPosition:getComputedStyle(halt).position,
    videoAnzeige:getComputedStyle(v).display,
    plakatDeckkraft:getComputedStyle(h.querySelector('.pt-stage'),'::before').opacity,
    endbild:+getComputedStyle(h.querySelector('.pt-photo')).opacity,
    p:getComputedStyle(h).getPropertyValue('--pt-p').trim(),
    satzB:+getComputedStyle(h.querySelector('.pt-satz-b')).opacity,
    knopf:+getComputedStyle(h.querySelector('.pt-actions')).opacity,
    geladen:geholt,
  };
})()
