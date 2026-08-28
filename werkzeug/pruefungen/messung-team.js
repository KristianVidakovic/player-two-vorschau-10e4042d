(async()=>{
  await new Promise(r=>setTimeout(r,2500));
  const o = e => e ? Math.round(e.getBoundingClientRect().top) : null;
  const kopf = document.querySelector('main .kopf');
  const k1 = document.querySelector('.mensch');
  return {
    fenster: innerHeight,
    kicker: o(kopf.querySelector('.kicker')),
    h1: o(kopf.querySelector('h1')),
    lede: o(kopf.querySelector('.lede')),
    karte_oben: o(k1),
    foto_oben: o(k1.querySelector('.kreis')),
    foto_unten: Math.round(k1.querySelector('.kreis').getBoundingClientRect().bottom),
    name_oben: o(k1.querySelector('h2')),
    name_text: k1.querySelector('h2').textContent,
    rolle_oben: o(k1.querySelector('.rolle')),
    name_sichtbar_ohne_scrollen: o(k1.querySelector('h2')) < innerHeight,
  };
})()
