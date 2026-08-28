(async()=>{
  const warte = ms => new Promise(r=>setTimeout(r,ms));
  document.documentElement.style.scrollBehavior='auto';
  await warte(3000);
  const h=document.getElementById('hero'), halt=h.querySelector('.pt-halt'), v=h.querySelector('video');
  const weg=h.offsetHeight-halt.offsetHeight;
  let spruenge=0, langsamster=0, laufend=0;
  v.addEventListener('seeking',()=>{laufend=performance.now();});
  v.addEventListener('seeked',()=>{spruenge++; const d=performance.now()-laufend; if(d>langsamster) langsamster=d;});
  const op = s => +getComputedStyle(h.querySelector(s)).opacity;
  const protokoll=[];
  window.scrollTo({top:0,behavior:'instant'}); await warte(400);
  for (let i=0;i<Math.ceil(weg/120)+2;i++){
    window.scrollBy(0,120);
    await warte(400);
    protokoll.push({flick:i+1, y:scrollY, zeit:+v.currentTime.toFixed(2),
      satzA:+op('.pt-satz-a').toFixed(2), satzB:+op('.pt-satz-b').toFixed(2), sub:+op('.pt-subline').toFixed(2),
      knopf:+op('.pt-actions').toFixed(2), abbinder:+op('.pt-closing').toFixed(2)});
  }
  const voll = s => protokoll.filter(z=>z[s]>=0.99).length;
  return {weg, flicks_gesamt:protokoll.length,
    spruenge, langsamster_sprung_ms:Math.round(langsamster),
    volle_flicks:{satzA:voll('satzA'), satzB:voll('satzB'), sub:voll('sub'), knopf:voll('knopf'), abbinder:voll('abbinder')},
    ankunft:{
      satzA:(protokoll.find(z=>z.satzA>=0.99)||{}).flick,
      satzB:(protokoll.find(z=>z.satzB>=0.99)||{}).flick,
      sub:(protokoll.find(z=>z.sub>=0.99)||{}).flick,
      knopf:(protokoll.find(z=>z.knopf>=0.99)||{}).flick,
      abbinder:(protokoll.find(z=>z.abbinder>=0.99)||{}).flick},
    letzte_videozeit:protokoll[protokoll.length-1].zeit};
})()
