// Verlobung: „Wo ist der Ring?“ Hütchenspiel mit den drei gedruckten Ringschachteln. Der Ring verschwindet in einer Schachtel,
// die Schachteln werden gemischt – welche ist es? Drei Runden, jede schneller.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'box1', x: 148, y: 500, w: 92, h: 84, cx: 196.3, cy: 535.0, px: 143, py: 495, pw: 106, ph: 90.5 },
  { n: 'box2', x: 258, y: 500, w: 92, h: 84, cx: 303.9, cy: 536.0, px: 252, py: 495.5, pw: 104, ph: 90 },
  { n: 'box3', x: 364, y: 500, w: 92, h: 84, cx: 411.3, cy: 536.0, px: 358, py: 495, pw: 106.5, ph: 90.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const SLOT = OB.map(b => ({ x: b.cx, y: b.cy })), ROUNDS = [[5, .5], [7, .38], [9, .3]];
let pos, ring, phase, pt, round, won, swaps, sw, fx, fin, tt, pick, over;
function ringAt(g, x, y, s = 1, a = 1){ g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s); g.strokeStyle = '#e8c35a'; g.lineWidth = 5; g.shadowColor = '#fff3b0'; g.shadowBlur = 12; g.beginPath(); g.ellipse(0, 8, 16, 11, 0, 0, 7); g.stroke();
  g.fillStyle = '#eaf6ff'; g.beginPath(); g.moveTo(0, -14); g.lineTo(9, -4); g.lineTo(0, 4); g.lineTo(-9, -4); g.closePath(); g.fill(); g.strokeStyle = '#9ad'; g.lineWidth = 1; g.stroke(); g.restore(); }
const scene = {
  title: t('verlobung.title'), subtitle: t('verlobung.sub'), emoji: '💍', accent: '#ffd0dc', button: '#a0304a', bg: '#7a2038',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ pos = [0, 1, 2]; round = 0; won = 0; over = false; tt = 0; fx.clear(); fin.stop(); this.startRound(); },
  startRound(){ ring = Math.floor(Math.random()*3); phase = 'show'; pt = 0; pick = -1; sw = null;
    const [n] = ROUNDS[round]; swaps = []; for(let k = 0; k < n; k++){ const a = Math.floor(Math.random()*3); let b = (a + 1 + Math.floor(Math.random()*2)) % 3; swaps.push([a, b]); } },
  onTap(x, y, ctx){ if(phase !== 'pick' || over) return; let bi = -1;
    for(let i = 0; i < 3; i++){ const s = SLOT[pos[i]]; if(Math.abs(x - s.x) < 52 && Math.abs(y - s.y) < 55) bi = i; }
    if(bi < 0) return; pick = bi; phase = 'reveal'; pt = 0;
    if(bi === ring){ won++; ctx.tone(784, 0, .15, 'triangle', .1); ctx.tone(1046, .12, .3, 'triangle', .1); fx.burst(SLOT[pos[bi]].x, SLOT[pos[bi]].y - 40, 24, ['#ffd0dc', '#e8c35a', '#fff'], 260, 200, 5); fx.pop(SLOT[pos[bi]].x, SLOT[pos[bi]].y - 110, t('verlobung.ja'), '#ffffff', 30); }
    else { ctx.tone(220, 0, .2, 'sine', .07); fx.pop(SLOT[pos[bi]].x, SLOT[pos[bi]].y - 110, t('verlobung.leer'), '#ffe0e0', 26); } },
  update(dt, ctx){ tt += dt; fx.update(dt); pt += dt; if(over) return;
    if(phase === 'show' && pt > 2.2){ phase = 'shuffle'; pt = 0; ctx.tone(330, 0, .1, 'sine', .05); }
    if(phase === 'shuffle'){ const d = ROUNDS[round][1];
      if(!sw && swaps.length){ sw = { p: swaps.shift(), t: 0 }; ctx.tone(440 + Math.random()*120, 0, .06, 'triangle', .04); }
      if(sw){ sw.t += dt; if(sw.t >= d){ const [a, b] = sw.p; const ia = pos.indexOf(a), ib = pos.indexOf(b); pos[ia] = b; pos[ib] = a; sw = null; } }
      else if(!swaps.length){ phase = 'pick'; pt = 0; } }
    if(phase === 'reveal' && pt > 2){ round++; if(round >= ROUNDS.length) this.finish(ctx); else this.startRound(); } },
  finish(ctx){ over = true; const b = best('verlobung', won, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('verlobung'), [t('verlobung.line'), t('verlobung.score', { n: won }) + (b.isNew && won ? '  ★' : '')], MEL.birthday), 600); },
  draw(g, ctx){ const dt = 1/60;
    OB.forEach((b, i) => { if(IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    const where = i => { let s = SLOT[pos[i]], x = s.x, y = s.y;
      if(sw && (sw.p[0] === pos[i] || sw.p[1] === pos[i])){ const from = pos[i], to = sw.p[0] === from ? sw.p[1] : sw.p[0], u = Math.min(1, sw.t/ROUNDS[round][1]), e = u*u*(3 - 2*u);
        x = SLOT[from].x + (SLOT[to].x - SLOT[from].x)*e; y = SLOT[from].y + (from < to ? -1 : 1)*Math.sin(u*Math.PI)*34; }
      return { x, y }; };
    // Ring vor dem Verstecken
    if(phase === 'show'){ const s = SLOT[pos[ring]], u = Math.max(0, (pt - 1.3)/.7); ringAt(g, s.x, s.y - 80 + u*60, 1.2, 1 - u*.9); }
    const lift = i => (phase === 'reveal' && (i === pick || i === ring)) ? Math.min(1, pt*4)*55 : 0;
    for(let i = 0; i < 3; i++){ const w = where(i), b = OB[i]; if(phase === 'reveal' && i === ring) ringAt(g, w.x, w.y + 12, 1, 1);
      if(IMG[i].spr.complete) g.drawImage(IMG[i].spr, w.x - (b.cx - b.x), w.y - (b.cy - b.y) - lift(i), b.w, b.h);
      if(phase === 'pick'){ const k = .4 + .3*Math.sin(tt*5 + i); g.save(); g.strokeStyle = `rgba(255,208,220,${k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(w.x, w.y + 34, 46, 10, 0, 0, 7); g.stroke(); g.restore(); } }
    fx.draw(g);
    if(!fin.on){ hud2(g, '💍 ' + won + '/' + Math.min(round + (phase === 'reveal' ? 1 : 0), 3), t('verlobung.runde', { n: Math.min(round + 1, 3) }), 846);
      const msg = phase === 'show' ? t('verlobung.merk') : phase === 'pick' ? t('verlobung.hint') : ''; if(msg) hint(g, msg, 1, 660, 99); }
    fin.draw(g, dt, 'rgba(90,20,40,', .2); } };
startCard(scene);
window.__vl = { OB, SLOT, get ring(){ return ring; }, get pos(){ return pos; }, get phase(){ return phase; }, get won(){ return won; } };
