// Halloween: „Kürbis-Echo“. Die fünf gedruckten Kürbisse leuchten nacheinander auf – nachtippen!
// Jede Runde kommt ein Kürbis dazu. Wie lang wird die Kette? Rekord wird gespeichert.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'kuerbis1', x: 104, y: 416, w: 174, h: 160, cx: 190.8, cy: 510.2, px: 105, py: 441, pw: 171, ph: 136 },
  { n: 'kuerbis2', x: 282, y: 348, w: 152, h: 144, cx: 356.6, cy: 433.4, px: 281.5, py: 374, pw: 150, ph: 117 },
  { n: 'kuerbis3', x: 368, y: 460, w: 136, h: 118, cx: 436.5, cy: 530.5, px: 369.5, py: 479.5, pw: 134, ph: 101 },
  { n: 'kuerbis4', x: 56, y: 600, w: 142, h: 128, cx: 128.2, cy: 670.4, px: 59, py: 600, pw: 138.5, ph: 128.5 },
  { n: 'kuerbis5', x: 366, y: 572, w: 184, h: 162, cx: 458.1, cy: 662.0, px: 367, py: 571.5, pw: 182, ph: 164 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; return a; });
const NOTE = [196, 247, 294, 330, 392], GOAL = 12;
let seq, step, phase, pt, lit, fx, fin, tt, over, score, lastK;
const scene = {
  title: t('halloween.title'), subtitle: t('halloween.sub'), emoji: '🎃', accent: '#ffa63a', button: '#5a2a90', bg: '#2a1648',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ seq = []; step = 0; phase = 'wait'; pt = 0; lit = OB.map(() => 0); over = false; score = 0; tt = 0; fx.clear(); fin.stop(); },
  light(i, ctx, d = .45){ lit[i] = d; ctx.tone(NOTE[i], 0, d, 'triangle', .1); ctx.tone(NOTE[i]*1.5, 0, d*.8, 'sine', .03); },
  onTap(x, y, ctx){ if(over) return;
    let bi = -1, bd = 1e9; OB.forEach((b, i) => { if(Math.abs(x - b.cx) < b.w*.5 && Math.abs(y - b.cy) < b.h*.5){ const d = Math.hypot(x - b.cx, y - b.cy); if(d < bd){ bd = d; bi = i; } } });
    if(phase === 'wait'){ phase = 'next'; pt = 0; return; }
    if(phase !== 'input' || bi < 0) return; this.light(bi, ctx, .3);
    if(bi === seq[step]){ step++; if(step === seq.length){ score = seq.length; phase = score >= GOAL ? 'win' : 'next'; pt = 0; fx.burst(300, 470, 12, ['#ffa63a', '#ffe08a'], 160, 200, 4); if(phase === 'win') this.finish(ctx, true); } }
    else { phase = 'fail'; pt = 0; ctx.tone(110, .05, .6, 'sawtooth', .08); ctx.noise(.05, .5, .15, 300); fx.pop(OB[bi].cx, OB[bi].y - 20, t('halloween.buh'), '#ffb0ff', 34); this.finish(ctx, false); } },
  update(dt, ctx){ tt += dt; fx.update(dt); pt += dt; lit = lit.map(v => Math.max(0, v - dt));
    if(phase === 'wait' && pt > 1.8){ phase = 'next'; pt = 0; }
    if(phase === 'next' && pt > .8){ seq.push(Math.floor(Math.random()*OB.length)); phase = 'play'; pt = 0; step = 0; lastK = -1; }
    if(phase === 'play'){ const gap = Math.max(.32, .62 - seq.length*.025), k = Math.floor(pt/gap);
      if(k < seq.length && k !== lastK){ lastK = k; this.light(seq[k], ctx, gap*.8); }
      if(k >= seq.length){ phase = 'input'; pt = 0; step = 0; } } },
  finish(ctx, win){ over = true; const b = best('halloween', score, true);
    if(win) ctx.melody([['E5', .25], ['G5', .25], ['B5', .25], ['E6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('halloween'), [t('halloween.line'), t('halloween.score', { n: score }) + (b.isNew && score ? '  ★' : '') + '  ·  ' + t('halloween.best', { n: b.best })], win ? MEL.birthday : null), 1300); },
  draw(g, ctx){ const dt = 1/60;
    OB.forEach((b, i) => { const L = lit[i] > 0 ? Math.min(1, lit[i]*6) : 0, idle = phase === 'wait' || over ? .12 + .1*Math.sin(tt*3 + i*1.7) : 0, a = Math.max(L, idle);
      if(a <= 0 || !IMG[i].complete) return;
      g.save(); g.globalAlpha = a*.8; const r = g.createRadialGradient(b.cx, b.cy, 10, b.cx, b.cy, b.w*.9); r.addColorStop(0, 'rgba(255,200,80,1)'); r.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = r; g.fillRect(b.cx - b.w, b.cy - b.h, b.w*2, b.h*2); g.restore();
      const s = 1 + .06*L; g.save(); g.translate(b.cx, b.y + b.h); g.scale(s, s); g.drawImage(IMG[i], b.x - b.cx, -b.h, b.w, b.h);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = a*.55; g.drawImage(IMG[i], b.x - b.cx, -b.h, b.w, b.h); g.restore(); });
    fx.draw(g);
    if(!fin.on){ hud2(g, '🎃 ' + seq.length, '★ ' + (peekBest('halloween') || 0), 846);
      const msg = phase === 'wait' ? t('halloween.hint') : phase === 'play' ? t('halloween.schau') : phase === 'input' ? t('halloween.du') : ''; if(msg) hint(g, msg, 1, 755, 99); }
    fin.draw(g, dt, 'rgba(30,10,50,', .25); } };
startCard(scene);
window.__hw = { OB, get seq(){ return seq; }, get phase(){ return phase; }, get score(){ return score; } };
