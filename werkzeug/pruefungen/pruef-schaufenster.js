(async()=>{
  const warte = ms => new Promise(r=>setTimeout(r,ms));
  await warte(2500);
  const s = document.getElementById('schaufenster');
  const nav = [...document.querySelectorAll('.nav-links a')].map(a=>a.textContent.trim()+' -> '+a.getAttribute('href'));
  const knopf = document.querySelector('.nav .btn');
  // Alle internen Sprungmarken pruefen
  const tot = [...document.querySelectorAll('a[href^="#"]')]
    .map(a=>a.getAttribute('href')).filter(h=>h!=='#' && !document.querySelector(h.replace(/^#/,'#')))
    .filter((v,i,x)=>x.indexOf(v)===i);
  return {
    abschnitt_da: !!s,
    hoehe_in_bildschirmen: s ? +(s.offsetHeight/innerHeight).toFixed(2) : null,
    ueberschrift: s ? s.querySelector('h2').textContent.trim() : null,
    knopf_im_abschnitt: s ? s.querySelector('.btn').textContent.trim()+' -> '+s.querySelector('.btn').getAttribute('href') : null,
    stuecke: document.querySelectorAll('.stueck').length,
    preise_sichtbar: document.querySelectorAll('.preis, .frei').length,
    nav, kopfknopf: knopf ? knopf.textContent.trim()+' -> '+knopf.getAttribute('href') : null,
    tote_sprungmarken: tot,
  };
})()
