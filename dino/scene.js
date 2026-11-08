// Dino-Geburtstag: „Eier ausbrüten“. Fünf gedruckte Dino-Eier liegen im Nest. Antippen, bis sie knacken –
// dann schlüpft ein Baby-Dino und der große T-Rex brüllt vor Freude. Auf Zeit, Rekord.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'ei1', x: 116, y: 632, w: 108, h: 114, cx: 169.2, cy: 691.2, px: 112, py: 629.5, pw: 117, ph: 121.5 },
  { n: 'ei2', x: 176, y: 582, w: 98, h: 120, cx: 225.3, cy: 641.2, px: 171, py: 577, pw: 107, ph: 133.5 },
  { n: 'ei3', x: 250, y: 606, w: 98, h: 128, cx: 299.8, cy: 673.7, px: 245, py: 603, pw: 108.5, ph: 139.5 },
  { n: 'ei4', x: 334, y: 594, w: 92, h: 110, cx: 376.4, cy: 648.3, px: 328.5, py: 588.5, pw: 101, ph: 124.5 },
  { n: 'ei5', x: 372, y: 640, w: 94, h: 108, cx: 422.4, cy: 694.6, px: 368, py: 635.5, pw: 107, ph: 117 },
  { n: 'baby', x: 340, y: 412, w: 168, h: 180, cx: 417.1, cy: 512.9, px: 340, py: 418.5, pw: 168, ph: 176 },
  { n: 'trex', x: 0, y: 240, w: 330, h: 322, cx: 170.1, cy: 425.4, px: 0, py: 243.5, pw: 332.5, ph: 321 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const EGG = OB.slice(0, 5), BABY = OB[5], TREX = OB[6], NEED = 3;
let S, fx, fin, tt, time, hatched, over, started, roar;
function cracks(g, b, n, seed){ g.save(); g.strokeStyle = 'rgba(60,40,20,.85)'; g.lineWidth = 2; g.lineJoin = 'round';
  for(let k = 0; k < n; k++){ let x = b.cx + ((seed*37 + k*53) % 30) - 15, y = b.y + b.h*(.3 + .15*k); g.beginPath(); g.moveTo(x, y);
    for(let j = 0; j < 5; j++){ x += (j % 2 ? 9 : -7) + ((seed + j*k) % 5); y += (j % 2 ? -6 : 7); g.lineTo(x, y); } g.stroke(); } g.restore(); }
const scene = {
  title: t('dino.title'), subtitle: t('dino.sub'), emoji: '🦖', accent: '#ffd36a', button: '#3a8a3a', bg: '#2a6a2a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = EGG.map(() => ({ st: 'egg', taps: 0, wob: 0, t: 0 })); tt = 0; time = 0; hatched = 0; over = false; started = false; roar = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; let bi = -1, bd = 1e9;
    EGG.forEach((b, i) => { if(S[i].st !== 'egg') return; if(Math.abs(x - b.cx) < b.w*.6 && Math.abs(y - b.cy) < b.h*.6){ const d = Math.hypot(x - b.cx, y - b.cy); if(d < bd){ bd = d; bi = i; } } });
    if(bi < 0) return; started = true; const s = S[bi]; s.taps++; s.wob = .4; ctx.tone(300 + s.taps*80, 0, .07, 'square', .05);
    if(s.taps >= NEED){ s.st = 'hatch'; s.t = 0; hatched++; roar = 1; ctx.tone(150, 0, .2, 'triangle', .1); ctx.tone(880, .1, .2, 'triangle', .08);
      ctx.tone(90, .25, .5, 'sawtooth', .07); ctx.noise(.25, .45, .12, 200);
      fx.burst(EGG[bi].cx, EGG[bi].cy, 16, ['#fff4d0', '#e8d0a0', '#ffd36a'], 220, 400, 5); fx.pop(EGG[bi].cx, EGG[bi].y - 40, t('dino.knack'), '#ffffff', 28);
      if(hatched === EGG.length) this.finish(ctx); } },
  update(dt, ctx){ tt += dt; fx.update(dt); if(started && !over) time += dt; roar = Math.max(0, roar - dt*1.2);
    S.forEach(s => { s.t += dt; s.wob = Math.max(0, s.wob - dt); }); },
  finish(ctx){ over = true; const secs = Math.round(time*10)/10, b = best('dino', secs, false);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('dino'), [t('dino.line'), t('dino.score', { s: secs }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('dino.best', { s: b.best })], MEL.birthday), 1500); },
  draw(g, ctx){ const dt = 1/60;
    // T-Rex brüllt: leicht vergrößert vom Fuß aus
    if(roar > 0 && IMG[6].spr.complete){ const s = 1 + .04*Math.sin(roar*Math.PI); g.save(); g.translate(TREX.cx, TREX.y + TREX.h); g.rotate(-.03*Math.sin(roar*Math.PI*3)); g.scale(s, s); g.drawImage(IMG[6].spr, TREX.x - TREX.cx, -TREX.h, TREX.w, TREX.h); g.restore(); }
    S.forEach((s, i) => { const b = EGG[i];
      if(s.st === 'egg'){ if(s.wob > 0 && IMG[i].spr.complete){ if(IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); g.save(); g.translate(b.cx, b.y + b.h); g.rotate(Math.sin(s.wob*40)*.12*s.wob/.4); g.drawImage(IMG[i].spr, b.x - b.cx, -b.h, b.w, b.h); g.restore(); }
        if(s.taps) { g.save(); g.beginPath(); g.ellipse(b.cx, b.cy, b.w*.42, b.h*.45, 0, 0, 7); g.clip(); cracks(g, b, s.taps, i + 3); g.restore(); }
        if(!started){ const k = .3 + .3*Math.sin(tt*4 + i); g.save(); g.strokeStyle = `rgba(255,240,180,${k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(b.cx, b.cy, b.w*.55, b.h*.55, 0, 0, 7); g.stroke(); g.restore(); } return; }
      if(IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph);
      // Schalenhälften fliegen weg
      const u = Math.min(1, s.t/.6);
      if(u < 1 && IMG[i].spr.complete){ for(const side of [-1, 1]){ g.save(); g.globalAlpha = 1 - u; g.translate(b.cx + side*u*40, b.cy - u*60 + u*u*80); g.rotate(side*u*1.5); g.beginPath(); g.rect(side < 0 ? -b.w/2 : 0, -b.h/2, b.w/2, b.h); g.clip(); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); } }
      // Baby-Dino schlüpft
      if(IMG[5].spr.complete){ const sc = (b.h*1.25/BABY.h)*Math.min(1, s.t/.35), bob = Math.sin(tt*5 + i)*2; g.save(); g.translate(b.cx, b.y + b.h + bob); g.scale(sc, sc); g.drawImage(IMG[5].spr, BABY.x - BABY.cx, -BABY.h, BABY.w, BABY.h); g.restore(); } });
    fx.draw(g);
    if(!fin.on) hud2(g, '🥚 ' + hatched + '/5', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !started) hint(g, t('dino.hint'), tt, 232, 10);
    fin.draw(g, dt, 'rgba(20,60,20,', .2); } };
startCard(scene);
window.__dn = { OB, S: () => S, get hatched(){ return hatched; } };
