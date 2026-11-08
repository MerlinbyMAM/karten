// Fitness: „Volle Kraft!“ Um die gedruckten Kettlebells ziehen sich Kraftringe zusammen – genau dann antippen, wenn der Ring die Kugel umschließt. Im Takt werden es immer mehr.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const K = [[140, 671, '#ff6a5a'], [307, 671, '#6aa8ff'], [469, 671, '#ffd84a']], TR = 64, R0 = 170, DUR = 1.15, TOTAL = 30;
let fx, fin, tt, phase, rings, spawned, nextT, pts, combo, hits, glow;
const scene = {
  title: t('fitness.title'), subtitle: t('fitness.sub'), emoji: '💪', accent: '#ffb35a', button: '#1d2e5a', bg: '#1a2238',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; rings = []; spawned = 0; nextT = 0; pts = 0; combo = 0; hits = 0; glow = [0, 0, 0]; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; nextT = .6; return; } if(phase !== 'play') return;
    let k = 0, bd = 1e9; K.forEach((c, i) => { const d = Math.hypot(c[0] - x, c[1] - y); if(d < bd){ bd = d; k = i; } }); if(bd > 140) return;
    const r = rings.filter(q => q.k === k && q.st === 'on').sort((a, b) => Math.abs(a.r - TR) - Math.abs(b.r - TR))[0];
    if(!r || Math.abs(r.r - TR) > 30){ combo = 0; ctx.tone(140, 0, .1, 'sine', .05); fx.pop(K[k][0], K[k][1] - 110, t('fitness.zufrueh'), '#ffd0c8', 24); return; }
    const d = Math.abs(r.r - TR), perf = d < 9, p = (perf ? 100 : 50) + combo*5; r.st = 'hit'; r.t = 0; combo++; hits++; pts += p; glow[k] = .35;
    fx.pop(K[k][0], K[k][1] - 110, perf ? t('fitness.perfekt') : t('fitness.gut'), perf ? '#b9ff9a' : '#ffffff', perf ? 30 : 26); fx.burst(K[k][0], K[k][1], perf ? 18 : 10, [K[k][2], '#ffffff', '#ffe08a'], 260, 300, 5);
    ctx.tone(perf ? 660 + combo*15 : 440, 0, .12, 'square', .05); ctx.noise(0, .08, .15, 900); },
  update(dt, ctx){ tt += dt; fx.update(dt); for(let i = 0; i < 3; i++) glow[i] = Math.max(0, glow[i] - dt);
    if(phase === 'play'){ nextT -= dt; const prog = spawned/TOTAL;
      if(nextT <= 0 && spawned < TOTAL){ const free = [0, 1, 2].filter(k => !rings.some(q => q.k === k && q.st === 'on')); if(free.length){ rings.push({ k: free[Math.floor(Math.random()*free.length)], r: R0, st: 'on', t: 0, sp: (R0 - TR)/(DUR*(1 - prog*.35)) }); spawned++; } nextT = (.95 - prog*.5)*(.7 + Math.random()*.6); }
      for(const q of rings){ q.t += dt; if(q.st === 'on'){ q.r -= q.sp*dt; if(q.r < TR - 30){ q.st = 'miss'; q.t = 0; combo = 0; fx.pop(K[q.k][0], K[q.k][1] - 110, t('fitness.verpasst'), '#ffd0c8', 22); } } }
      rings = rings.filter(q => q.st === 'on' || q.t < .35);
      if(spawned >= TOTAL && !rings.length) this.finish(ctx); } },
  finish(ctx){ phase = 'end'; const b = best('fitness', pts, true);
    ctx.melody([['G4', .25], ['C5', .25], ['E5', .25], ['G5', .75]], 180, 'square', .07);
    setTimeout(() => fin.start(ctx, greeting('fitness'), [t('fitness.line'), t('fitness.score', { n: pts }) + (b.isNew && pts ? '  ★' : '') + '  ·  ' + t('fitness.best', { n: b.best })], MEL.birthday), 400); },
  draw(g, ctx){ const dt = 1/60;
    K.forEach((c, i) => { if(glow[i] > 0){ g.save(); const gr = g.createRadialGradient(c[0], c[1], 10, c[0], c[1], 120); gr.addColorStop(0, `rgba(255,255,220,${glow[i]*1.6})`); gr.addColorStop(1, 'rgba(255,255,220,0)'); g.fillStyle = gr; g.beginPath(); g.arc(c[0], c[1], 120, 0, 7); g.fill(); g.restore(); }
      if(phase === 'play'){ g.save(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([5, 6]); g.lineWidth = 2; g.beginPath(); g.arc(c[0], c[1], TR, 0, 7); g.stroke(); g.restore(); } });
    for(const q of rings){ const c = K[q.k]; g.save();
      if(q.st === 'on'){ const close = Math.max(0, 1 - Math.abs(q.r - TR)/40); g.strokeStyle = c[2]; g.globalAlpha = .55 + close*.45; g.lineWidth = 5 + close*5; g.shadowColor = c[2]; g.shadowBlur = 10 + close*20; g.beginPath(); g.arc(c[0], c[1], Math.max(4, q.r), 0, 7); g.stroke(); }
      else { g.globalAlpha = 1 - q.t/.35; g.strokeStyle = q.st === 'hit' ? '#ffffff' : '#888'; g.lineWidth = 4; g.beginPath(); g.arc(c[0], c[1], TR + (q.st === 'hit' ? q.t*160 : 0), 0, 7); g.stroke(); }
      g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '💪 ' + hits + '/' + TOTAL, combo > 2 ? '🔥 ' + combo : '⭐ ' + pts, 846);
    if(!fin.on && phase === 'ready') hint(g, t('fitness.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(20,30,60,', .18); } };
startCard(scene);
window.__fi = { get phase(){ return phase; }, get rings(){ return rings; }, get pts(){ return pts; }, get hits(){ return hits; }, K, TR };
