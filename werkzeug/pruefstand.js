/* Pruefstand: echtes Chrome, das wirklich zeichnet.
 *
 * Der Vorschau-Bereich in der App loest weder Scroll-Ereignisse noch
 * Animationsbilder aus, solange er nicht angezeigt wird. Damit laesst sich
 * eine scrollgesteuerte Animation dort grundsaetzlich nicht pruefen.
 *
 * Dieses Skript startet Chrome im Hintergrund, haengt sich ueber das
 * Entwicklerprotokoll an und fuehrt beliebiges JavaScript in der Seite aus.
 * Dort laeuft die Bildschleife normal, also feuern Scroll-Ereignisse und
 * requestAnimationFrame wie bei einem echten Besucher.
 *
 * Aufruf:  node pruefstand.js <url> <datei-mit-js>
 * Ausgabe: das Ergebnis des Ausdrucks als JSON
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL_ = process.argv[2];
const JS = fs.readFileSync(process.argv[3], 'utf8');
const PORT = 9333;
const PROFIL = path.join(os.tmpdir(), 'pruefstand-profil');

function warte(ms) { return new Promise(r => setTimeout(r, ms)); }

async function holJson(pfad) {
  const a = await fetch('http://127.0.0.1:' + PORT + pfad);
  return a.json();
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + PROFIL,
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-features=CalculateNativeWinOcclusion',
    '--no-first-run', '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore', detached: false });

  let ziele = null;
  for (let i = 0; i < 60; i++) {
    try { ziele = await holJson('/json/list'); break; } catch (e) { await warte(250); }
  }
  if (!ziele) { console.error('Chrome antwortet nicht'); chrome.kill(); process.exit(1); }

  const seite = ziele.find(z => z.type === 'page');
  const ws = new WebSocket(seite.webSocketDebuggerUrl);
  let n = 0;
  const offen = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && offen.has(m.id)) { offen.get(m.id)(m); offen.delete(m.id); }
  });
  await new Promise(r => ws.addEventListener('open', r));

  function ruf(methode, params) {
    const id = ++n;
    return new Promise(r => { offen.set(id, r); ws.send(JSON.stringify({ id, method: methode, params: params || {} })); });
  }

  await ruf('Page.enable');
  await ruf('Runtime.enable');
  const fehler = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      fehler.push((d.exception && d.exception.description) || d.text);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      fehler.push(m.params.args.map(a => a.value || a.description).join(' '));
    }
  });

  // Optional: Geraet und Medienmerkmale vorgeben, um die fuenf Tore zu pruefen.
  // Aufruf: node pruefstand.js <url> <js> '{"breite":390,"hoehe":844,"grob":true,"wenigBewegung":true}'
  const lage = process.argv[4] ? JSON.parse(process.argv[4]) : null;
  if (lage) {
    if (lage.breite) {
      await ruf('Emulation.setDeviceMetricsOverride', {
        width: lage.breite, height: lage.hoehe || 844,
        deviceScaleFactor: lage.dpr || 2, mobile: !!lage.grob,
      });
      if (lage.grob) await ruf('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    }
    if (lage.wenigBewegung) {
      await ruf('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
    }
  }

  await ruf('Page.navigate', { url: URL_ });
  // Auf das Ladeende warten
  for (let i = 0; i < 80; i++) {
    const r = await ruf('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    if (r.result && r.result.result && r.result.result.value === 'complete') break;
    await warte(250);
  }
  await warte(1500);

  const r = await ruf('Runtime.evaluate', {
    expression: JS, awaitPromise: true, returnByValue: true, userGesture: true,
  });

  // Bildaufnahme: die vierte Angabe kann {"bild":"pfad.png"} enthalten.
  // Mehrere Aufnahmen macht das Seitenskript, indem es {bilder:[...]}
  // zurueckgibt - dann wird pro Eintrag einmal ausgeloest.
  if (lage && lage.bild) {
    // Nur ein Dateiname, kein Pfad: MSYS und Node streiten sich sonst
    // ueber die Schreibweise. Geschrieben wird immer nach bilder/
    // neben diesem Skript.
    const ordner = path.join(__dirname, 'bilder');
    fs.mkdirSync(ordner, { recursive: true });
    const schuss = await ruf('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ordner, path.basename(lage.bild)),
                     Buffer.from(schuss.result.data, 'base64'));
  }

  let ergebnis;
  if (r.result && r.result.exceptionDetails) {
    ergebnis = { FEHLER: r.result.exceptionDetails.exception
      ? r.result.exceptionDetails.exception.description
      : r.result.exceptionDetails.text };
  } else {
    ergebnis = r.result.result.value;
  }
  console.log(JSON.stringify({ ergebnis, seitenfehler: fehler }, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
})();
