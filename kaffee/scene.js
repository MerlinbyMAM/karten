// Kaffee: „Latte-Art“ – auf dem gedruckten Milchschaum erscheinen nummerierte Punkte. Der Reihe nach antippen, und ein Herz, ein Stern und eine Blume entstehen aus Milch. Auf Zeit.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const C = { x: 300, y: 447 }, R = 86;
const heart = Array.from({ length: 10 }, (_, i) => { const a = i/10*Math.PI*2; return [C.x + 16*Math.pow(Math.sin(a), 3)*4.6, C.y - (13*Math.cos(a) - 5*Math.cos(2*a) - 2*Math.cos(3*a) - Math.cos(4*a))*4.6 - 6]; });
const star = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI/2 + i/10*Math.PI*2, r = i % 2 ? 32 : 76; return [C.x + Math.cos(a)*r, C.y + Math.sin(a)*r]; });
const flower = Array.from({ length: 12 }, (_, i) => { const a = -Math.PI/2 + i/12*Math.PI*2, r = i % 2 ? 40 : 78; return [C.x + Math.cos(a)*r, C.y + Math.sin(a)*r]; });
const MOT = [heart, star, flower];
let fx, fin, tt, phase, m, k, time, done, show, miss;
const scene = {
  title: t('kaffee.title'), subtitle: t('kaffee.sub'), emoji: '☕', accent: '#f3d9b0', button: '#5a3a24', bg: '#2a1e16',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; m = 0; k = 0; time = 0; done = []; show = 0; miss = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; return; } if(phase !== 'play' || show > 0) return; const P = MOT[m], p = P[k];
    if(Math.hypot(x - p[0], y - p[1]) < 30){ k++; ctx.tone(523*Math.pow(1.06, k), 0, .08, 'sine', .06); fx.sparkle(p[0], p[1], 5);
      if(k >= P.length){ done.push(m); show = 1.2; fx.pop(C.x, C.y - 130, t('kaffee.fertig.' + m), '#fff6e0', 30); ctx.tone(784, .05, .2, 'triangle', .07); ctx.tone(1046, .2, .3, 'triangle', .07); } }
    else { miss++; time += .5; fx.pop(x, y - 30, '+0,5 s', '#ffd0c8', 20); ctx.tone(160, 0, .08, 'sine', .04); } },
  update(dt, ctx){ tt += dt; fx.update(dt); if(phase === 'play'){ if(show > 0){ show -= dt; if(show <= 0){ m++; k = 0; if(m >= MOT.length) this.finish(ctx); } } else time += dt; } },
  finish(ctx){ phase = 'end'; m = MOT.length - 1; k = MOT[m].length; const s = Math.round(time*10)/10, b = best('kaffee', s, false);
    ctx.melody([['E5', .25], ['G5', .25], ['C6', .25], ['E6', .75]], 160, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('kaffee'), [t('kaffee.line'), t('kaffee.score', { s: s.toFixed(1) }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('kaffee.best', { s: Number(b.best).toFixed(1) })], MEL.birthday), 900); },
  draw(g, ctx){ const dt = 1/60; if(phase === 'ready') { hint(g, t('kaffee.hint'), tt, 640, 99); return; }
    const P = MOT[Math.min(m, MOT.length - 1)];
    g.save(); g.beginPath(); g.arc(C.x, C.y, R + 8, 0, 7); g.clip();
    if(k > 1){ g.strokeStyle = 'rgba(255,248,235,.95)'; g.lineWidth = 9; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(P[0][0], P[0][1]); for(let i = 1; i < k; i++) g.lineTo(P[i][0], P[i][1]); if(k >= P.length) g.closePath(); g.stroke();
      if(k >= P.length){ g.fillStyle = `rgba(255,246,228,${Math.min(.85, (1.2 - show)*1.5 + (phase === 'end' ? .85 : 0))})`; g.fill(); } }
    g.restore();
    if(phase === 'play' && show <= 0) P.forEach((p, i) => { if(i < k) return; const cur = i === k; g.save(); g.globalAlpha = cur ? 1 : .55; g.fillStyle = cur ? '#ffffff' : 'rgba(255,255,255,.7)'; g.strokeStyle = '#6a3a1a'; g.lineWidth = 2;
      const r = cur ? 14 + Math.sin(tt*8)*2 : 11; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#4a2a10'; g.font = `bold ${cur ? 15 : 12}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i + 1, p[0], p[1] + 1); g.restore(); });
    fx.draw(g);
    if(!fin.on) hud2(g, '☕ ' + Math.min(m + 1, 3) + '/3', '⏱ ' + time.toFixed(1) + ' s', 846);
    fin.draw(g, dt, 'rgba(40,25,15,', .18); } };
startCard(scene);
window.__ka = { get phase(){ return phase; }, get m(){ return m; }, get k(){ return k; }, get show(){ return show; }, MOT };
