(async()=>{
  const warte = ms => new Promise(r=>setTimeout(r,ms));
  document.documentElement.style.scrollBehavior='auto';
  await warte(3200);
  const h=document.getElementById('hero'), halt=h.querySelector('.pt-halt');
  const weg=h.offsetHeight-halt.offsetHeight;
  const ziel = Number(new URLSearchParams(location.search).get('p') || 0);
  window.scrollTo({top:Math.round(ziel*weg), behavior:'instant'});
  await warte(900);
  return {p:getComputedStyle(h).getPropertyValue('--pt-p').trim(),
          zeit:+h.querySelector('video').currentTime.toFixed(2)};
})()
