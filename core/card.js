/* =====================================================================
   MAM AR-Karten – gemeinsame Engine
   ---------------------------------------------------------------------
   Jede Karte liefert eine "Szene":
     scene = {
       title, subtitle, emoji, accent,          // Startbildschirm
       video:   false | true,                   // nutzt die Video-Ebene (vid)
       init(ctx), update(dt, ctx), draw(g, ctx),
       onTap(x, y, ctx), onDrag(x, y, ctx), onRelease(ctx),
       restart(ctx)                             // "Nochmal"
     }
   Koordinaten: Zeichenfläche 600 × 900 (= Karte 2:3), (0,0) links oben.

   TON (Grundregel, siehe Protokolle): Es gibt GENAU EINEN Tonkanal:
   - ein AudioContext für alle Effekte/Melodien, beim ersten Tippen angelegt,
     NIE neu erzeugt, bei jedem Finger-Loslassen nur "resume()".
   - höchstens EIN Video-Element (vid), beim ersten Tippen mit Ton angespielt,
     danach nur Quelle wechseln. Keine Handy-Sprachausgabe.
   ===================================================================== */

const $ = id => document.getElementById(id);
const W = 600, H = 900;

export function startCard(scene){
  /* ---------- Grundgerüst ---------- */
  document.title = scene.pageTitle || scene.title;
  const css = document.createElement('style');
  css.textContent = `
  html,body{margin:0;height:100%;background:#120d0b;color:#fff8f0;font-family:Georgia,'Times New Roman',serif;overflow:hidden;-webkit-user-select:none;user-select:none;touch-action:none}
  #ar{position:fixed;inset:0}
  .scr{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;box-sizing:border-box;z-index:10;background:radial-gradient(circle at 50% 35%,${scene.bg||'#4a3428'},#120d0b 75%)}
  .scr h1{font-size:2.3em;color:${scene.accent||'#f3c98b'};margin:.1em 0;text-shadow:0 3px 8px #000;font-style:italic}
  .scr h2{font-size:1.1em;margin:.3em 0 1.1em;font-weight:normal;max-width:440px}
  .scr button{font:inherit;font-size:1.12em;margin:8px;padding:14px 28px;border-radius:32px;border:2px solid ${scene.accent||'#f3c98b'};background:${scene.button||'#b5536f'};color:#fff;box-shadow:0 4px 14px #0009}
  .scr button.alt{background:transparent;font-size:.95em;padding:10px 20px}
  .small{opacity:.85;font-size:.95em;max-width:420px;line-height:1.4}
  .bar{width:240px;height:10px;background:#0007;border-radius:5px;overflow:hidden;margin-top:14px}
  .bar div{height:100%;width:0;background:${scene.accent||'#f3c98b'};transition:width .2s}
  #hint{position:fixed;bottom:28px;left:12px;right:12px;text-align:center;z-index:6;font-size:1.05em;text-shadow:0 2px 5px #000;pointer-events:none;display:none;background:#0008;padding:10px;border-radius:14px}
  #again{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:7;display:none;font:inherit;font-size:1.05em;padding:12px 26px;border-radius:30px;border:2px solid ${scene.accent||'#f3c98b'};background:${scene.button||'#b5536f'};color:#fff;box-shadow:0 4px 14px #0009}
  #flat{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);height:min(100vh,150vw);aspect-ratio:2/3;display:none;z-index:4;box-shadow:0 0 30px #000;overflow:hidden;background:#000}
  #flat > *{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
  `;
  document.head.appendChild(css);
  document.body.insertAdjacentHTML('beforeend', `
  <div id="ar"></div>
  <div id="flat"><img id="fbg" src="karte.jpg" alt=""></div>
  <div id="hint">📷 Halt die Kamera auf deine Karte</div>
  <button id="again">🔁 Nochmal</button>
  <div class="scr" id="start">
    <div style="font-size:3em">${scene.emoji||'✨'}</div>
    <h1>${scene.title}</h1>
    <h2>${scene.subtitle||''}</h2>
    <button id="btnAR">📷 Karte zum Leben erwecken</button>
    <p class="small">Danach die Kamera auf die Karte halten – Ton an!</p>
    <button class="alt" id="btnFlat">Ohne Kamera ansehen</button>
  </div>
  <div class="scr" id="loading" style="display:none">
    <div style="font-size:2.6em">${scene.emoji||'✨'}</div>
    <h2 id="loadText">Gleich geht's los …</h2>
    <div class="bar"><div id="loadBar"></div></div>
  </div>`);

  /* ---------- Kontext für die Szene ---------- */
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const ctx = {
    W, H, mode: 'ar', visible: false, t: 0, vid: null, ac: null,
    params: new URLSearchParams(location.search),
    img: {},                          // vorgeladene Bilder
    showAgain(on){ $('again').style.display = on ? 'block' : 'none'; },
    hint(msg, ms){ const h = $('hint'); h.textContent = msg; h.style.display = 'block'; if(ms) setTimeout(()=>h.style.display='none', ms); },
    // ----- Ton: nur über ctx.ac (ein Kanal) -----
    tone(f, t0=0, dur=.2, type='triangle', vol=.16){
      const ac = ctx.ac; if(!ac) return;
      const o = ac.createOscillator(), v = ac.createGain();
      o.type = type; o.frequency.value = f;
      v.gain.setValueAtTime(0, ac.currentTime+t0);
      v.gain.linearRampToValueAtTime(vol, ac.currentTime+t0+.015);
      v.gain.exponentialRampToValueAtTime(.0008, ac.currentTime+t0+dur);
      o.connect(v); v.connect(ac.destination);
      o.start(ac.currentTime+t0); o.stop(ac.currentTime+t0+dur+.05);
      track(o); return o;
    },
    noise(t0=0, dur=.3, vol=.25, hp=800){
      const ac = ctx.ac; if(!ac) return;
      const n = Math.floor(ac.sampleRate*dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for(let i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 2);
      const s = ac.createBufferSource(); s.buffer = b;
      const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
      const v = ac.createGain(); v.gain.value = vol;
      s.connect(f); f.connect(v); v.connect(ac.destination); s.start(ac.currentTime+t0); track(s); return s;
    },
    melody(notes, bpm=120, type='triangle', vol=.14, t0=.05){
      // notes: [['C5',1],['E5',.5],...]  Dauer in Schlägen
      const b = 60/bpm; let t = t0;
      for(const [n,d] of notes){ if(n){ const f = noteFreq(n); ctx.tone(f, t, d*b*1.05, type, vol); ctx.tone(f/2, t, d*b*1.05, 'sine', vol*.45); } t += d*b; }
      return t;
    },
    stopSound(){ for(const n of active){ try{ n.onended=null; n.stop(); }catch(e){} } active = []; },
    // ----- Video: nur über ctx.vid (ein Element) -----
    playVideo(src){
      const v = ctx.vid; if(!v) return;
      if(src && !v.src.endsWith(src)){ v.src = src; v.load(); }
      v.muted = false; const p = v.play(); if(p) p.catch(()=>{ v.muted = true; v.play().catch(()=>{}); });
    },
    // Karten-Koordinaten -> Position in der AR-Szene (für 3D-Effekte)
    restart(){ ctx.stopSound(); ctx.showAgain(false); scene.restart && scene.restart(ctx); }
  };
  let active = [];
  function track(n){ active.push(n); n.onended = () => { active = active.filter(x => x !== n); }; }
  function noteFreq(n){
    const m = n.match(/^([A-G])(#|b)?(\d)$/); if(!m) return 440;
    const base = {C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}[m[1]] + (m[2]==='#'?1:m[2]==='b'?-1:0);
    return 440 * Math.pow(2, (base + (parseInt(m[3])-4)*12)/12);
  }
  ctx.noteFreq = noteFreq;

  /* ---------- Ton freischalten (nur im Tipp-Handler!) ---------- */
  function unlockAudio(){
    try{ if(!ctx.ac) ctx.ac = new (window.AudioContext||window.webkitAudioContext)(); if(ctx.ac.state !== 'running') ctx.ac.resume(); }catch(e){}
    if(scene.video && !ctx.vid){
      const v = document.createElement('video');
      v.playsInline = true; v.setAttribute('playsinline',''); v.preload = 'auto'; v.crossOrigin = 'anonymous';
      v.src = scene.firstVideo || 'clip1.mp4'; v.muted = false;
      const p = v.play(); if(p) p.then(()=>{ if(!ctx.started){ v.pause(); v.currentTime = 0; } }).catch(()=>{});
      ctx.vid = v;
    }
  }
  // iPhone: nach Unterbrechungen bei jedem Loslassen wieder einschalten (nie neu anlegen)
  const resumeAudio = () => { if(ctx.ac && ctx.ac.state !== 'running'){ try{ ctx.ac.resume(); }catch(e){} } };
  addEventListener('touchend', resumeAudio, {passive:true});
  addEventListener('click', resumeAudio);

  /* ---------- Eingabe (Tippen/Wischen auf der Karte) ---------- */
  let toCard = null;   // Funktion: Bildschirm -> Kartenkoordinaten (oder null)
  let dragging = false;
  function evPos(e){ const p = e.touches ? (e.touches[0] || e.changedTouches[0]) : e; return p ? [p.clientX, p.clientY] : null; }
  function down(e){
    if($('start').style.display !== 'none' || $('loading').style.display !== 'none') return;
    if(e.target && e.target.id === 'again') return;
    const p = evPos(e); if(!p || !toCard) return;
    const c = toCard(p[0], p[1]); if(!c) return;
    dragging = true;
    scene.onTap && scene.onTap(c[0], c[1], ctx);
  }
  function move(e){
    if(!dragging || !toCard) return;
    const p = evPos(e); if(!p) return;
    const c = toCard(p[0], p[1]); if(c) scene.onDrag && scene.onDrag(c[0], c[1], ctx);
  }
  function up(){ if(dragging){ dragging = false; scene.onRelease && scene.onRelease(ctx); } }
  addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);

  $('again').onclick = (e) => { e.stopPropagation(); unlockAudio(); ctx.restart(); };

  /* ---------- Hauptschleife ---------- */
  let ovTex = null, last = performance.now();
  function loop(now){
    const dt = Math.min(.05, (now-last)/1000); last = now;
    if(ctx.started && (ctx.mode === 'flat' || ctx.visible)){ ctx.t += dt; scene.update && scene.update(dt, ctx); }
    g.clearRect(0,0,W,H);
    if(ctx.started) scene.draw && scene.draw(g, ctx);
    if(ovTex) ovTex.needsUpdate = true;
    requestAnimationFrame(loop);
  }

  /* ---------- Bilder vorladen ---------- */
  const preload = Promise.all(Object.entries(scene.images || {}).map(([k,src]) => new Promise(r => { const i = new Image(); i.onload = () => { ctx.img[k] = i; r(); }; i.onerror = r; i.src = src; })));

  function begin(){
    ctx.started = true; ctx.t = 0;
    scene.init && scene.init(ctx);
  }

  /* ---------- Ersatzansicht ohne Kamera ---------- */
  async function startFlat(msg){
    ctx.mode = 'flat';
    $('start').style.display = 'none'; $('loading').style.display = 'none';
    const f = $('flat'); f.style.display = 'block';
    if(ctx.vid){ ctx.vid.style.cssText = ''; f.appendChild(ctx.vid); }
    cv.style.cssText = ''; f.appendChild(cv);
    toCard = (x, y) => { const r = cv.getBoundingClientRect(); const cx = (x - r.left)/r.width*W, cy = (y - r.top)/r.height*H; return (cx>=0&&cy>=0&&cx<=W&&cy<=H) ? [cx, cy] : null; };
    if(msg) ctx.hint(msg, 4000);
    await preload; begin();
  }
  $('btnFlat').onclick = () => { unlockAudio(); startFlat(); };

  /* ---------- AR-Ansicht ---------- */
  $('btnAR').onclick = async () => {
    unlockAudio();
    $('start').style.display = 'none'; $('loading').style.display = 'flex';
    const bar = $('loadBar'), txt = $('loadText');
    try{
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('nocam');
      let url = null;
      try{ const r = await fetch('targets.mind'); if(r.ok) url = URL.createObjectURL(new Blob([await r.arrayBuffer()])); }catch(e){}
      if(!url){
        txt.textContent = 'Lerne deine Karte kennen …';
        const im = new Image(); im.src = 'karte.jpg'; await im.decode();
        const lib = await import('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js');
        const Compiler = lib.Compiler || (window.MINDAR && window.MINDAR.IMAGE && window.MINDAR.IMAGE.Compiler);
        const c = new Compiler();
        await c.compileImageTargets([im], p => { bar.style.width = Math.round(p*.8)+'%'; });
        url = URL.createObjectURL(new Blob([await c.exportData()]));
      }
      txt.textContent = 'Kamera wird gestartet …'; bar.style.width = '90%';
      const THREE = await import('three');
      const { MindARThree } = await import('mindar-image-three');
      const mind = new MindARThree({ container: $('ar'), imageTargetSrc: url, uiScanning:'no', uiLoading:'no', uiError:'no', filterMinCF:0.0001, filterBeta:0.001 });
      const { renderer, scene: s3, camera } = mind;
      const anchor = mind.addAnchor(0);
      const PH = 1.5;
      if(ctx.vid){
        const vt = new THREE.VideoTexture(ctx.vid); vt.colorSpace = THREE.SRGBColorSpace;
        anchor.group.add(new THREE.Mesh(new THREE.PlaneGeometry(1, PH), new THREE.MeshBasicMaterial({ map: vt })));
      }
      ovTex = new THREE.CanvasTexture(cv); ovTex.colorSpace = THREE.SRGBColorSpace;
      const ovMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, PH), new THREE.MeshBasicMaterial({ map: ovTex, transparent: true }));
      ovMesh.position.z = .002; anchor.group.add(ovMesh);
      ctx.THREE = THREE; ctx.anchor = anchor; ctx.camera = camera;
      // Bildschirm -> Kartenkoordinaten per Strahl auf die Karte
      const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
      toCard = (x, y) => {
        if(!ctx.visible) return null;
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set(((x - r.left)/r.width)*2-1, -((y - r.top)/r.height)*2+1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObject(ovMesh)[0];
        return hit && hit.uv ? [hit.uv.x*W, (1-hit.uv.y)*H] : null;
      };
      anchor.onTargetFound = () => {
        ctx.visible = true; $('hint').style.display = 'none';
        if(!ctx.started) begin();
        scene.onFound && scene.onFound(ctx);
      };
      anchor.onTargetLost = () => {
        ctx.visible = false; ctx.hint('📷 Karte wieder ins Bild halten');
        scene.onLost && scene.onLost(ctx);
      };
      await preload;
      await mind.start();
      renderer.setAnimationLoop(() => renderer.render(s3, camera));
      $('loading').style.display = 'none'; ctx.hint('📷 Halt die Kamera auf deine Karte');
    }catch(e){
      console.error(e);
      startFlat('Kamera klappt hier nicht – dann ohne. Ton an!');
    }
  };
  requestAnimationFrame(loop);
  return ctx;
}

/* ---------- kleine Helfer für Szenen ---------- */
export const rnd = (a, b) => a + Math.random()*(b-a);
export function confetti(n=140, colors=['#f3c98b','#ff7aa8','#7ad3ff','#9cf27a','#ffffff']){
  const out = [];
  for(let i=0;i<n;i++) out.push({x:rnd(0,600), y:rnd(-500,-10), vx:rnd(-40,40), vy:rnd(90,200), r:rnd(0,6), vr:rnd(-5,5), c:colors[i%colors.length], s:rnd(6,12)});
  return out;
}
export function drawConfetti(g, list, dt){
  for(const c of list){ c.x += c.vx*dt; c.y += c.vy*dt; c.r += c.vr*dt; if(c.y > 920){ c.y = -10; } g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.fillStyle = c.c; g.fillRect(-c.s/2, -c.s/4, c.s, c.s/2); g.restore(); }
}
// Große Schrift mit Kontur. Zu lange Texte werden automatisch umbrochen (max. 3 Zeilen)
// und notfalls kleiner gesetzt, damit nichts aus dem Bild läuft.
export function bigText(g, text, x, y, size=56, fill='#fff', stroke='rgba(80,30,50,.85)', font='Georgia', maxW=540){
  text = String(text);
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = size, lines;
  for(;;){
    g.font = `italic bold ${fs}px ${font}`;
    lines = fitLines(g, text, maxW);
    const wide = lines.some(l => g.measureText(l).width > maxW);
    if((!wide && lines.length <= (fs > size*.75 ? 2 : 3)) || fs <= size*.45) break;
    fs = Math.round(fs*.92);
  }
  g.lineWidth = Math.max(4, fs/7); g.strokeStyle = stroke; g.fillStyle = fill; g.lineJoin = 'round';
  const lh = fs*1.12, y0 = y - (lines.length - 1)*lh/2;
  lines.forEach((l, i) => { g.strokeText(l, x, y0 + i*lh); g.fillText(l, x, y0 + i*lh); });
  g.restore();
}
export function fitLines(g, text, maxW){
  const words = String(text).split(/\s+/).filter(Boolean), out = []; let line = '';
  for(const w of words){ const t = line ? line + ' ' + w : w; if(g.measureText(t).width > maxW && line){ out.push(line); line = w; } else line = t; }
  if(line) out.push(line);
  // ausgewogener: bei zwei Zeilen möglichst gleich lang
  if(out.length === 2){
    let best = out, bw = Math.max(...out.map(l => g.measureText(l).width));
    for(let i=1;i<words.length;i++){ const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), w = Math.max(g.measureText(a).width, g.measureText(b).width); if(w < bw){ bw = w; best = [a, b]; } }
    return best;
  }
  return out;
}
export function wrapText(g, text, x, y, maxW, lh){
  const words = text.split(' '); let line = '', yy = y;
  for(const w of words){ const t = line ? line+' '+w : w; if(g.measureText(t).width > maxW && line){ g.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
  if(line) g.fillText(line, x, yy);
  return yy;
}
