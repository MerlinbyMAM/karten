// Advent: „Lichterzeit“ – mit dem Streichholz die vier gedruckten Kerzen anzünden. Aber Windstöße pusten immer wieder eine aus! Wenn alle vier gemeinsam fünf Sekunden brennen, ist Advent.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const W = [[173, 418], [220, 346], [382, 346], [435, 422]], M0 = { x: 520, y: 760 }, HOLD = 5;
let fx, fin, tt, phase, lit, m, held, time, all, gust, gustK, nextG, smoke;
const scene = {
  title: t('advent.title'), subtitle: t('advent.sub'), emoji: '🕯️', accent: '#ffd98a', button: '#7a1a1a', bg: '#2a1a14',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; lit = [0, 0, 0, 0]; m = { x: M0.x, y: M0.y }; held = false; time = 0; all = 0; gust = 0; gustK = -1; nextG = 4; smoke = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; if(gust > 0 && gustK >= 0 && Math.hypot(x - W[gustK][0], y - W[gustK][1]) < 70){ gust = 0; fx.pop(W[gustK][0], W[gustK][1] - 60, t('advent.schutz'), '#b9ff9a', 24); ctx.tone(660, 0, .1, 'triangle', .05); return; } if(Math.hypot(x - m.x, y - m.y) < 80){ held = true; if(phase === 'ready'){ phase = 'play'; ctx.noise(0, .25, .12, 2500); } } },
  onDrag(x, y, ctx){ if(!held) return; m.x = x; m.y = y + 30;
    W.forEach((w, i) => { if(!lit[i] && Math.hypot(m.x - w[0], m.y - 40 - w[1]) < 30){ lit[i] = 1; ctx.tone([523, 587, 659, 784][i], 0, .5, 'sine', .06); fx.sparkle(w[0], w[1] - 10, 8); } }); },
  onRelease(){ held = false; },
  update(dt, ctx){ tt += dt; fx.update(dt); if(!held){ m.x += (M0.x - m.x)*Math.min(1, dt*6); m.y += (M0.y - m.y)*Math.min(1, dt*6); }
    if(phase === 'play'){ time += dt; nextG -= dt;
      if(nextG <= 0 && gust <= 0){ const on = lit.map((v, i) => v ? i : -1).filter(i => i >= 0); if(on.length){ gust = 1.1; gustK = on[Math.floor(Math.random()*on.length)]; ctx.noise(0, 1, .08, 400); } nextG = 2.5 + Math.random()*3; }
      if(gust > 0){ gust -= dt; if(gust <= 0 && gustK >= 0 && lit[gustK]){ lit[gustK] = 0; const w = W[gustK]; smoke.push({ x: w[0], y: w[1] - 8, t: 0 }); fx.pop(w[0], w[1] - 60, t('advent.aus'), '#ffe0c0', 24); ctx.tone(220, 0, .2, 'sine', .04); } }
      if(lit.every(Boolean)){ all += dt; if(all >= HOLD) this.finish(ctx); } else all = 0; }
    for(const s of smoke) s.t += dt; smoke = smoke.filter(s => s.t < 2); },
  finish(ctx){ phase = 'end'; held = false; gust = 0; const s = Math.round(time*10)/10, b = best('advent', s, false);
    setTimeout(() => fin.start(ctx, greeting('advent'), [t('advent.line'), t('advent.score', { s: s.toFixed(1) }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('advent.best', { s: Number(b.best).toFixed(1) })], [['G4', .5], ['A4', .5], ['G4', .5], ['E4', 1], ['G4', .5], ['A4', .5], ['G4', .5], ['E4', 1]]), 800); },
  flame(g, x, y, k, i){ const wob = (gust > 0 && gustK === i) ? Math.sin(tt*30)*6*(gust) : 0, f = 1 + Math.sin(tt*9 + i)*.08;
    const gl = g.createRadialGradient(x, y - 14, 2, x, y - 14, 70); gl.addColorStop(0, 'rgba(255,220,140,.55)'); gl.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y - 14, 70, 0, 7); g.fill();
    g.save(); g.translate(x, y); g.rotate(wob*.05); const gr = g.createRadialGradient(0, -8, 1, 0, -10, 18*k); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(.45, '#ffd060'); gr.addColorStop(1, 'rgba(255,120,30,.0)'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, -30*f*k); g.quadraticCurveTo(10*k, -10, 0, 2); g.quadraticCurveTo(-10*k, -10, 0, -30*f*k); g.fill(); g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    lit.forEach((v, i) => { if(v) this.flame(g, W[i][0], W[i][1], 1.1, i); else if(phase !== 'end'){ g.save(); g.globalAlpha = .35 + .3*Math.sin(tt*3 + i); g.strokeStyle = '#fff3c0'; g.lineWidth = 2; g.beginPath(); g.arc(W[i][0], W[i][1] - 8, 20, 0, 7); g.stroke(); g.restore(); } });
    for(const s of smoke){ g.fillStyle = `rgba(200,200,200,${.35*(1 - s.t/2)})`; g.beginPath(); g.arc(s.x + Math.sin(s.t*3)*8, s.y - s.t*50, 6 + s.t*8, 0, 7); g.fill(); }
    if(gust > 0){ g.save(); g.globalAlpha = Math.min(1, gust)*.6; g.strokeStyle = '#ffffff'; g.lineWidth = 2; for(let i = 0; i < 4; i++){ const y = W[gustK][1] - 30 + i*12, x0 = 600 - (1.1 - gust)*700 + i*30; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 - 40, y - 10, x0 - 90, y); g.stroke(); } g.restore(); }
    if(phase !== 'end'){ g.save(); g.translate(m.x, m.y); g.rotate(-.5); g.fillStyle = '#e8d2a0'; g.fillRect(-4, -10, 8, 80); g.fillStyle = '#b02a1a'; g.beginPath(); g.ellipse(0, -14, 7, 10, 0, 0, 7); g.fill(); g.restore(); if(phase === 'play'){ const fx2 = m.x + Math.sin(.5)*24, fy = m.y - 40; this.flame(g, m.x - 12, m.y - 34, .6, 9); } }
    if(phase === 'play' && lit.every(Boolean)){ g.save(); g.fillStyle = 'rgba(40,20,10,.5)'; g.beginPath(); g.roundRect(150, 292, 300, 20, 10); g.fill(); g.fillStyle = '#ffd060'; g.beginPath(); g.roundRect(153, 295, 294*Math.min(1, all/HOLD), 14, 7); g.fill(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🕯️ ' + lit.reduce((a, b) => a + b, 0) + '/4', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('advent.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(40,20,10,', .18); } };
startCard(scene);
window.__ad = { get phase(){ return phase; }, get lit(){ return lit; }, W, M0 };
