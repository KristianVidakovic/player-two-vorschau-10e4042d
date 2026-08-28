(async()=>{
  const warte = ms => new Promise(r=>setTimeout(r,ms));
  await warte(2200);
  const alle = document.querySelectorAll('.stueck').length;
  // Filter ausprobieren
  const knopf = document.querySelector('.w-karte[data-sorte="shop"]');
  knopf.click(); await warte(400);
  const nachFilter = [...document.querySelectorAll('.stueck')].filter(s=>s.offsetParent!==null).length;
  document.querySelector('.w-karte[data-sorte="alle"]').click(); await warte(400);
  const suche = document.getElementById('suche');
  suche.value='baeckerei'; suche.dispatchEvent(new Event('input',{bubbles:true})); await warte(400);
  const nachSuche = [...document.querySelectorAll('.stueck')].filter(s=>s.offsetParent!==null).length;
  return {alle, nach_filter_shop:nachFilter, nach_suche_baeckerei:nachSuche,
    preise:document.querySelectorAll('.preis, .frei').length,
    zahl:(document.getElementById('schau-zahl')||{}).textContent,
    h1:document.querySelector('h1').textContent.trim(),
    nav:[...document.querySelectorAll('.nav-links a')].map(a=>a.textContent.trim())};
})()
