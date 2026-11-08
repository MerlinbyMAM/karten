// Koch: „Pfannkuchen-Profi“ – den gedruckten Pfannkuchen mit einem Wisch nach oben aus der Pfanne werfen und genau einmal wenden. Zu schwach, überdreht oder perfekt? 5 Würfe.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'pfk', x: 108, y: 562, w: 282, h: 138, cx: 249.0, cy: 631.0, px: 106, py: 560, pw: 286, ph: 142 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const P = 0, PC = ctr(0), G = 2400, W = Math.PI/.78;
let fx, fin, tt, phase, p, held, track, flips, pts, side, moved, msg;
const scene = {
  title: t('koch.title'), subtitle: t('koch.sub'), emoji: '🥞', accent: '#ffd27a', button: '#8a3a14', bg: '#2e1e12',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; p = { x: PC.x, y: PC.y, a: 0, vy: 0, t: 0, sq: 0 }; held = false; flips = 0; pts = 0; side = 0; moved = false; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready' && Math.hypot(x - p.x, (y - p.y)*1.8) < 190){ held = true; track = [[x, y, performance.now()]]; } },
  onDrag(x, y){ if(held){ track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); } },
  onRelease(ctx){ if(!held) return; held = false; const f = flick(track); if(f.vy > -200) return;
    p.vy = -Math.min(1500, Math.max(450, -f.vy*1.05)); p.t = 0; p.a = 0; p.y0 = PC.y; phase = 'air'; moved = true; ctx.noise(0, .12, .12, 1500); ctx.tone(330, 0, .1, 'triangle', .05); },
  update(dt, ctx){ tt += dt; fx.update(dt); if(p.sq > 0) p.sq -= dt;
    if(phase === 'air'){ p.t += dt; p.y = p.y0 + p.vy*p.t + G*p.t*p.t/2; p.a = W*p.t;
      if(p.y >= PC.y && p.t > .1){ p.y = PC.y; flips++; const turns = p.a/Math.PI, n = Math.round(turns), d = Math.abs(turns - n); let q, txt, col = '#ffffff';
        if(n === 0){ q = 0; txt = t('koch.schwach'); }
        else if(n > 1){ q = Math.max(0, Math.round(60 - d*120)); txt = t('koch.ueber'); }
        else if(d < .12){ q = 100; txt = t('koch.perfekt'); col = '#b9ff9a'; fx.sparkle(PC.x, PC.y - 30, 18); }
        else if(d < .3){ q = 60; txt = t('koch.gut'); }
        else { q = 10; txt = t('koch.klecks'); }
        if(n % 2) side ^= 1; pts += q; p.a = 0; p.sq = .25; fx.shake(q < 50 ? 6 : 3);
        fx.pop(PC.x, PC.y - 110, txt + (q ? '  +' + q : ''), col, 30); fx.burst(PC.x, PC.y, 10, ['#f3c06a', '#ffffff'], 160, 500, 3);
        ctx.noise(0, .15, .2, 700); ctx.tone(q >= 100 ? 784 : 392, 0, .12, 'triangle', .06);
        phase = flips >= 5 ? 'end' : 'land'; p.t = 0; if(phase === 'end') this.finish(ctx); } }
    if(phase === 'land'){ p.t += dt; if(p.t > .6) phase = 'ready'; } },
  finish(ctx){ const b = best('koch', pts, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('koch'), [t('koch.line'), t('koch.score', { n: pts }) + (b.isNew && pts ? '  ★' : '') + '  ·  ' + t('koch.best', { n: b.best })], MEL.birthday), 900); },
  draw(g, ctx){ const dt = 1/60, b = OB[P];
    if(moved){ g.save(); g.translate(PC.x, PC.y); const gr = g.createRadialGradient(-30, -20, 10, 0, 0, b.w*.55); gr.addColorStop(0, '#3a3836'); gr.addColorStop(1, '#141312'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, b.w*.5 + 2, b.h*.5 + 2, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.ellipse(-40, -18, 60, 14, -.2, 0, 7); g.fill(); g.restore(); }
    if(moved){ const c = Math.cos(p.a), sy = Math.max(.06, Math.abs(c)) * (p.sq > 0 ? 1 - p.sq*.4 : 1), sx = p.sq > 0 ? 1 + p.sq*.3 : 1, h = Math.max(0, PC.y - p.y), s = 1 + h/1400, under = (c < 0) !== (side === 1);
      g.save(); g.fillStyle = `rgba(0,0,0,${.25 - Math.min(.2, h/2000)})`; g.beginPath(); g.ellipse(PC.x, PC.y + 8, b.w*.45*(1 - h/1600), b.h*.35*(1 - h/1600), 0, 0, 7); g.fill(); g.restore();
      g.save(); g.translate(p.x, p.y); g.scale(s*sx, s*sy); g.translate(-p.x, -p.y); spr(g, P, p.x, p.y);
      if(under){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(160,80,20,.28)'; g.beginPath(); g.ellipse(p.x, p.y, b.w*.48, b.h*.47, 0, 0, 7); g.fill(); }
      g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🥞 ' + flips + '/5', '⭐ ' + pts, 846);
    if(!fin.on && phase === 'ready' && flips === 0) hint(g, t('koch.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(46,30,18,', .18); } };
startCard(scene);
window.__ko = { get phase(){ return phase; }, get p(){ return p; }, get pts(){ return pts; }, get flips(){ return flips; } };
