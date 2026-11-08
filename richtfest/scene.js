// Richtfest: „Der letzte Nagel“ – auf den gedruckten Dachbalken tauchen nacheinander Nägel auf. Mit drei kräftigen Hammerschlägen versenken, so schnell es geht.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const NAILS = [[214, 486], [300, 478], [392, 487], [246, 414], [352, 402], [292, 346]];
let i, depth, taps, time, phase, fx, fin, tt, hit, miss;
const scene = {
  title: t('richtfest.title'), subtitle: t('richtfest.sub'), emoji: '🔨', accent: '#ffd98a', button: '#2f6a2f', bg: '#2a3a24',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ i = 0; depth = 0; taps = 0; time = 0; phase = 'ready'; tt = 0; hit = 0; miss = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(phase === 'end') return; const n = NAILS[i];
    if(Math.hypot(x - n[0], y - n[1] + 10) > 75){ miss++; ctx.tone(140, 0, .08, 'sine', .04); return; }
    if(phase === 'ready') phase = 'play';
    taps++; depth++; hit = .18; fx.shake(4);
    ctx.noise(0, .08, .25, 1800); ctx.tone(depth === 3 ? 880 : 520 + depth*60, 0, .07, 'square', .05);
    fx.burst(n[0], n[1] - 6, 6, ['#d9b27a', '#f3e2bd', '#8a6a3a'], 140, 500, 3);
    if(depth >= 3){ fx.sparkle(n[0], n[1], 14); fx.pop(n[0], n[1] - 40, '✔', '#fff6c2', 34); depth = 0; i++;
      if(i >= NAILS.length) this.finish(ctx); else ctx.tone(660, .08, .12, 'triangle', .06); } },
  update(dt, ctx){ tt += dt; fx.update(dt); if(hit > 0) hit -= dt; if(phase === 'play') time += dt; },
  finish(ctx){ phase = 'end'; const s = Math.round(time*10)/10, b = best('richtfest', s, false);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('richtfest'), [t('richtfest.line'), t('richtfest.score', { s: s.toFixed(1) }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('richtfest.best', { s: b.best.toFixed ? b.best.toFixed(1) : b.best })], MEL.fanfare), 500); },
  draw(g, ctx){ const dt = 1/60;
    for(let k = 0; k < i; k++){ const n = NAILS[k]; g.fillStyle = '#5a5a5a'; g.beginPath(); g.ellipse(n[0], n[1], 6, 2.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(n[0] - 3, n[1] - 1.5, 2, 1); }
    if(phase !== 'end'){ const n = NAILS[i], up = (3 - depth)*8; g.save(); g.translate(n[0], n[1]); g.scale(1.7, 1.7); g.translate(-n[0], -n[1]);
      const pul = .5 + .5*Math.sin(tt*6); g.save(); g.strokeStyle = `rgba(255,235,140,${.35 + .4*pul})`; g.lineWidth = 3; g.beginPath(); g.arc(n[0], n[1] - up/2, 24 + pul*6, 0, 7); g.stroke(); g.restore();
      const gr = g.createLinearGradient(n[0] - 3, 0, n[0] + 3, 0); gr.addColorStop(0, '#6a6a6a'); gr.addColorStop(.5, '#e0e0e0'); gr.addColorStop(1, '#6a6a6a');
      g.fillStyle = gr; g.fillRect(n[0] - 2.5, n[1] - up, 5, up + 2); g.fillStyle = '#9a9a9a'; g.beginPath(); g.ellipse(n[0], n[1] - up, 8, 3, 0, 0, 7); g.fill(); g.fillStyle = '#e8e8e8'; g.beginPath(); g.ellipse(n[0] - 2, n[1] - up - 1, 4, 1.4, 0, 0, 7); g.fill();
      const a = hit > 0 ? (hit/.18)*-.9 : -.9 + Math.sin(tt*3)*.08, hx = n[0] + 8, hy = n[1] - up - 6;
      g.save(); g.translate(hx + 70, hy + 40); g.rotate(a); g.fillStyle = '#a0662e'; g.fillRect(-80, -5, 82, 10); g.fillStyle = '#c0c4c8'; g.fillRect(-92, -16, 22, 32); g.fillStyle = '#7a7e84'; g.fillRect(-92, -16, 6, 32); g.restore(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🔨 ' + Math.min(i, NAILS.length) + '/' + NAILS.length, '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('richtfest.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(40,50,30,', .18); } };
startCard(scene);
window.__rf = { get phase(){ return phase; }, get i(){ return i; }, get time(){ return time; }, NAILS };
