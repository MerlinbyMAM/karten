// Einschulung: „Buchstaben-Klötze“. Die sechs gedruckten Holzklötze liegen durcheinander auf dem Tisch.
// In der richtigen Reihenfolge antippen (S-C-H-U-L-E) – jeder richtige Klotz hüpft auf die Kreideleiste der gedruckten Tafel.
// Falscher Klotz wackelt. Nach drei Fehlern leuchtet der nächste richtige Klotz als Tipp auf.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

const BL = [   // in Wortreihenfolge S C H U L E
  { n: 'S', x: 263, y: 620, w: 99, h: 117, cx: 312, cy: 678.8, px: 260, py: 618, pw: 104.5, ph: 122 },
  { n: 'C', x: 403, y: 586, w: 99, h: 108, cx: 451.7, cy: 637, px: 402, py: 583, pw: 103, ph: 114 },
  { n: 'H', x: 476, y: 643, w: 111, h: 114, cx: 531.7, cy: 699.4, px: 474, py: 640, pw: 115.5, ph: 120 },
  { n: 'U', x: 493, y: 538, w: 92, h: 97, cx: 539.5, cy: 585.2, px: 490, py: 536, pw: 97.5, ph: 102 },
  { n: 'L', x: 331, y: 541, w: 93, h: 96, cx: 375.9, cy: 588.1, px: 329.5, py: 538.5, pw: 96.5, ph: 101.5 },
  { n: 'E', x: 153, y: 603, w: 101, h: 119, cx: 203.1, cy: 662.4, px: 150, py: 602, pw: 106.5, ph: 122 } ];
const IMG = BL.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const LEDGE = 398, SC = .62, SLOT = i => 340 + (i - 2.5)*62;

let S, next, fx, fin, tt, time, over, errors, started;

const scene = {
  title: t('schulanfang.title'), subtitle: t('schulanfang.sub'), emoji: '🎒',
  accent: '#ffe27a', button: '#2a6ab8', bg: '#1f4a7a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = BL.map(() => ({ st: 'home', t: 0, shake: 0 })); next = 0; tt = 0; time = 0; over = false; errors = 0; started = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    let hit = -1, bd = 1e9;
    BL.forEach((b, i) => { if(S[i].st !== 'home') return; if(Math.abs(x - b.cx) < b.w*.5 && Math.abs(y - b.cy) < b.h*.5){ const d = Math.hypot(x - b.cx, y - b.cy); if(d < bd){ bd = d; hit = i; } } });
    if(hit < 0) return; started = true;
    if(hit === next){ S[hit].st = 'hop'; S[hit].t = 0; next++; ctx.tone([523, 587, 659, 698, 784, 1046][hit], 0, .2, 'triangle', .1); fx.sparkle(BL[hit].cx, BL[hit].cy, 10); }
    else { S[hit].shake = .5; S[hit].t = 0; errors++; fx.pop(BL[hit].cx, BL[hit].y - 20, t('schulanfang.wrong'), '#fff', 24); ctx.tone(200, 0, .15, 'sawtooth', .05); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); if(started && !over) time += dt;
    S.forEach((s, i) => { s.t += dt; s.shake = Math.max(0, s.shake - dt);
      if(s.st === 'hop' && s.t >= .6){ s.st = 'row'; fx.burst(SLOT(i), LEDGE - 30, 8, ['#ffe27a', '#fff'], 120, 200, 4);
        if(i === BL.length - 1) this.finish(ctx); } });
  },
  finish(ctx){
    over = true; const secs = Math.round(time*10)/10, b = best('schulanfang', secs, false);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 220, 'triangle', .1);
    fx.burst(300, LEDGE - 40, 50, ['#ffe27a', '#ff6b6b', '#4dabf7', '#69db7c', '#fff'], 380, 300, 8);
    setTimeout(() => fin.start(ctx, greeting('schulanfang'), [t('schulanfang.score', { s: secs }) + (b.isNew ? '  ★' : ''), t('schulanfang.best', { s: b.best })], MEL.birthday), 1500);
  },
  draw(g, ctx){
    const dt = 1/60;
    S.forEach((s, i) => { const b = BL[i]; if(s.st !== 'home' && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    const draw = (i, x, y, sc, rot) => { const b = BL[i]; if(!IMG[i].spr.complete) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); };
    if(errors >= 3 && !over && next < BL.length){ const b = BL[next], k = .5 + .5*Math.sin(tt*6); g.save(); g.shadowColor = '#ffe27a'; g.shadowBlur = 20*k; g.strokeStyle = `rgba(255,226,122,${k})`; g.lineWidth = 4; g.strokeRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8); g.restore(); }
    S.forEach((s, i) => { const b = BL[i];
      if(s.st === 'home' && s.shake > 0) draw(i, b.cx + Math.sin(s.t*50)*10*s.shake, b.cy, 1, Math.sin(s.t*40)*.06);
      else if(s.st === 'hop'){ const u = Math.min(1, s.t/.6), e = u*u*(3 - 2*u), ty = LEDGE - b.h*SC/2;
        draw(i, b.cx + (SLOT(i) - b.cx)*e, b.cy + (ty - b.cy)*e - Math.sin(u*Math.PI)*120, 1 - (1 - SC)*e, (1 - e)*Math.PI*2*(i % 2 ? 1 : -1)); }
      else if(s.st === 'row'){ const bounce = over ? Math.abs(Math.sin(tt*6 + i*.5))*8 : 0; draw(i, SLOT(i), LEDGE - b.h*SC/2 - bounce, SC, 0); } });
    fx.draw(g);
    if(!fin.on) hud2(g, '🔤 ' + next + '/6', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !started) hint(g, t('schulanfang.hint'), tt, 345, 9);
    fin.draw(g, dt, 'rgba(20,50,90,', .22);
  }
};
startCard(scene);
window.__sc = { BL, S: () => S, get next(){ return next; }, get over(){ return over; } };
