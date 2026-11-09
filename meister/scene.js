// Meisterbrief: „Werkzeugwand“. Beim Start purzeln die sechs gedruckten Werkzeuge von der Lochwand auf die Werkbank.
// Zieh jedes Werkzeug zurück in seinen weißen Umriss – nur der richtige Platz hält. Zeit wird gestoppt, Rekord gespeichert.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

const OB = [
  { n: 'hammer', x: 74, y: 306, w: 108, h: 198, cx: 136.1, cy: 399.0, px: 74.5, py: 315.0, pw: 110.0, ph: 188.5 },
  { n: 'schluessel', x: 262, y: 312, w: 78, h: 186, cx: 306.6, cy: 411.0, px: 269.0, py: 317.0, pw: 74.5, ph: 185.5 },
  { n: 'schraubendreher', x: 434, y: 314, w: 48, h: 182, cx: 462.1, cy: 387.7, px: 444.5, py: 319.5, pw: 40.5, ph: 181.5 },
  { n: 'saege', x: 52, y: 530, w: 190, h: 154, cx: 141.6, cy: 611.5, px: 51.5, py: 536.0, pw: 196.5, ph: 149.5 },
  { n: 'zange', x: 258, y: 506, w: 84, h: 178, cx: 303.9, cy: 610.2, px: 263.0, py: 510.0, pw: 85.0, ph: 181.0 },
  { n: 'wasserwaage', x: 436, y: 510, w: 54, h: 176, cx: 461.2, cy: 598.3, px: 438.0, py: 510.5, pw: 51.5, ph: 181.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
// Liegeplätze auf der gedruckten Werkbank (gemischt)
const BENCH = [[355, 760, 1.45, .62], [70, 752, -1.5, .6], [430, 772, 1.55, .6], [200, 772, .25, .55], [280, 750, -1.35, .6], [135, 790, 1.5, .6]];
const NOTES = [523, 587, 659, 698, 784, 880];

let S, fx, fin, tt, time, done, over, held, started, fall;

const scene = {
  title: t('meister.title'), subtitle: t('meister.sub'), emoji: '🔧',
  accent: '#ffd36a', button: '#1f3a5c', bg: '#2a2418',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map((b, i) => ({ st: 'wall', x: b.cx, y: b.cy, r: 0, sc: 1, t: 0, bx: BENCH[i][0], by: BENCH[i][1], br: BENCH[i][2], bs: BENCH[i][3] }));
    tt = 0; time = 0; done = 0; over = false; held = -1; started = false; fall = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    if(!fall){ fall = true; S.forEach((s, i) => { s.st = 'fall'; s.t = -i*.08; s.x0 = s.x; s.y0 = s.y; }); ctx.tone(180, 0, .25, 'sawtooth', .04); return; }
    held = -1; let bd = 1e9;
    S.forEach((s, i) => { if(s.st !== 'bench') return; const d = Math.hypot(x - s.x, y - s.y); if(d < 70 && d < bd){ bd = d; held = i; } });
    if(held < 0) return; started = true; const s = S[held]; s.st = 'held'; s.ox = s.x - x; s.oy = s.y - y; ctx.tone(392, 0, .06, 'triangle', .05);
  },
  onDrag(x, y){ if(held < 0) return; const s = S[held], b = OB[held]; s.x = x + s.ox; s.y = y + s.oy;
    const d = Math.hypot(s.x - b.cx, s.y - b.cy), k = Math.max(0, Math.min(1, (s.by - s.y)/200)); s.r = s.br*(1 - k); s.sc = s.bs + (1 - s.bs)*k; },
  onRelease(ctx){
    if(held < 0) return; const s = S[held], i = held, b = OB[i]; held = -1;
    if(Math.hypot(s.x - b.cx, s.y - b.cy) < 48){ s.st = 'snap'; s.t = 0; s.x0 = s.x; s.y0 = s.y; s.r0 = s.r; s.sc0 = s.sc; }
    else { // falscher Umriss? kurz anzeigen
      const wrong = OB.findIndex((o, k) => k !== i && Math.hypot(s.x - o.cx, s.y - o.cy) < 48);
      if(wrong >= 0) fx.pop(s.x, s.y - 60, t('meister.falsch'), '#ffffff', 24);
      s.st = 'back'; s.t = 0; s.x0 = s.x; s.y0 = s.y; s.r0 = s.r; s.sc0 = s.sc; ctx.tone(200, 0, .1, 'sine', .04); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); if(started && !over) time += dt;
    S.forEach((s, i) => { s.t += dt; const b = OB[i];
      if(s.st === 'fall' && s.t > 0){ const u = Math.min(1, s.t/.75), e = u*u;
        s.x = s.x0 + (s.bx - s.x0)*u; s.y = s.y0 + (s.by - s.y0)*e - Math.sin(u*Math.PI)*40; s.r = s.br*u + Math.sin(u*9)*.2*(1 - u); s.sc = 1 + (s.bs - 1)*u;
        if(u >= 1){ s.st = 'bench'; s.x = s.bx; s.y = s.by; s.r = s.br; s.sc = s.bs; ctx.tone(120 + i*15, 0, .08, 'square', .03); fx.burst(s.x, s.y + 10, 5, ['#c8a070', '#fff'], 80, 300, 3); } }
      if(s.st === 'back'){ const u = Math.min(1, s.t/.35), e = 1 - (1 - u)**3; s.x = s.x0 + (s.bx - s.x0)*e; s.y = s.y0 + (s.by - s.y0)*e; s.r = s.r0 + (s.br - s.r0)*e; s.sc = s.sc0 + (s.bs - s.sc0)*e; if(u >= 1) s.st = 'bench'; }
      if(s.st === 'snap'){ const u = Math.min(1, s.t/.25), e = 1 - (1 - u)**3; s.x = s.x0 + (b.cx - s.x0)*e; s.y = s.y0 + (b.cy - s.y0)*e; s.r = s.r0*(1 - e); s.sc = s.sc0 + (1 - s.sc0)*e;
        if(u >= 1){ s.st = 'home'; done++; ctx.tone(NOTES[done - 1], 0, .25, 'triangle', .08); fx.burst(b.cx, b.cy, 12, ['#ffd36a', '#ffffff'], 140, 200, 4);
          if(done === OB.length) this.finish(ctx); } } });
  },
  finish(ctx){
    over = true; const secs = Math.round(time*10)/10, b = best('meister', secs, false);
    ctx.melody([['G4', .2], ['C5', .2], ['E5', .2], ['G5', .4], ['E5', .2], ['G5', .6]], 190, 'triangle', .1);
    for(let k = 0; k < 3; k++) setTimeout(() => fx.burst(300, 260, 26, ['#ffd36a', '#ffffff', '#1f3a5c'], 330, 260, 6), k*300);
    setTimeout(() => fin.start(ctx, greeting('meister'), [t('meister.line'), t('meister.score', { s: secs }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('meister.best', { s: b.best })], MEL.birthday), 1600);
  },
  draw(g, ctx){
    const dt = 1/60;
    S.forEach((s, i) => { const b = OB[i]; if(s.st !== 'wall' && s.st !== 'home' && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    // Medaille glänzt am Ende
    if(over){ g.save(); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(300, 265, 10, 300, 265, 110);
      rg.addColorStop(0, `rgba(255,220,120,${.35 + .15*Math.sin(tt*6)})`); rg.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = rg; g.fillRect(180, 150, 240, 240); g.restore(); }
    const draw = (i, s) => { const b = OB[i]; if(!IMG[i].spr.complete || s.st === 'wall' || s.st === 'home') return;
      g.save(); g.translate(s.x, s.y); g.rotate(s.r); g.scale(s.sc, s.sc); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); };
    // Werkzeuge an der Wand (zurückgehängt) bleiben einfach das Druckbild; alle anderen gezeichnet
    S.forEach((s, i) => { if(s.st === 'home'){ const b = OB[i]; if(IMG[i].spr.complete) g.drawImage(IMG[i].spr, b.x, b.y, b.w, b.h); } });
    S.forEach((s, i) => { if(i !== held) draw(i, s); });
    if(held >= 0){ const s = S[held], b = OB[held];
      if(Math.hypot(s.x - b.cx, s.y - b.cy) < 48){ g.save(); g.strokeStyle = 'rgba(255,230,140,.9)'; g.lineWidth = 4; g.shadowColor = '#ffd36a'; g.shadowBlur = 16;
        g.strokeRect(b.px, b.py, b.pw, b.ph); g.restore(); }
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 14; g.shadowOffsetY = 10; draw(held, s); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🔧 ' + done + '/' + OB.length, '⏱ ' + time.toFixed(1) + ' s', 846, 156);
    if(!fin.on && !fall) hint(g, t('meister.hint'), tt, 230, 30);
    if(!fin.on && fall && !started) hint(g, t('meister.hint2'), tt, 230, 30);
    fin.draw(g, dt, 'rgba(40,30,20,', .2);
  }
};
startCard(scene);
window.__ms = { OB, S: () => S, get done(){ return done; } };
