// Reise: „Einmal um die Welt“ – den gedruckten Papierflieger mit Schwung über die Weltkarte werfen und alle fünf Reiseziele (Stecknadeln) anfliegen. Wie wenige Würfe brauchst du?
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'flieger', x: 6, y: 680, w: 244, h: 165, cx: 127.6, cy: 751.4, px: 3, py: 674.5, pw: 250.5, ph: 175.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const F = 0, FH = ctr(0), PINS = [[80, 420], [163, 583], [320, 612], [441, 408], [522, 618]], BASE = Math.atan2(-.62, 1);
let fx, fin, tt, phase, p, held, track, moved, hit, throws, trail;
const scene = {
  title: t('reise.title'), subtitle: t('reise.sub'), emoji: '✈️', accent: '#ffb39a', button: '#1d3a6a', bg: '#2a2a3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ p = { x: FH.x, y: FH.y, r: 0, s: 1, a: 1 }; phase = 'ready'; held = false; moved = false; hit = PINS.map(() => false); throws = 0; trail = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready' && Math.hypot(x - p.x, y - p.y) < 110){ held = true; track = [[x, y, performance.now()]]; } },
  onDrag(x, y){ if(held){ track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); } },
  onRelease(ctx){ if(!held) return; held = false; const f = flick(track), v = Math.hypot(f.vx, f.vy); if(v < 250) return;
    const k = Math.min(1, 1500/v)*.95; p.vx = f.vx*k; p.vy = f.vy*k; phase = 'fly'; moved = true; throws++; p.t = 0; trail = []; ctx.noise(0, .3, .08, 2500); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'fly'){ p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; const dr = Math.pow(.2, dt); p.vx *= dr; p.vy *= dr; p.r = Math.atan2(p.vy, p.vx) - BASE; p.s = Math.max(.45, 1 - p.t*.35);
      trail.push([p.x, p.y]); if(trail.length > 40) trail.shift();
      PINS.forEach((q, k) => { if(!hit[k] && Math.hypot(q[0] - p.x, q[1] - 20 - p.y) < 40){ hit[k] = true; fx.burst(q[0], q[1] - 20, 18, ['#ffd34d', '#ff7a5a', '#ffffff'], 200, 300, 5); fx.pop(q[0], q[1] - 60, '✔', '#fff6c2', 36);
        ctx.tone(660 + hit.filter(Boolean).length*110, 0, .15, 'triangle', .08); } });
      if(Math.hypot(p.vx, p.vy) < 60 || p.x < -80 || p.x > 680 || p.y < 200 || p.y > 980){ phase = 'back'; p.t = 0; }
      if(hit.every(Boolean)){ phase = 'end'; setTimeout(() => this.finish(ctx), 900); } }
    if(phase === 'back'){ p.t += dt; if(p.t > .5){ p.x = FH.x; p.y = FH.y; p.r = 0; p.s = 1; p.a = Math.min(1, (p.t - .5)/.4); if(p.t > .9){ p.a = 1; phase = throws >= 12 ? 'end' : 'ready'; if(phase === 'end') this.finish(ctx); } } else p.a = 1 - p.t/.5; }
    if(phase === 'fly') p.a = 1; },
  finish(ctx){ phase = 'end'; const n = hit.filter(Boolean).length, sc = n === 5 ? throws : 99, b = n === 5 ? best('reise', throws, false) : { isNew: false, best: '–' };
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .25], ['G5', .25], ['C6', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('reise'), [t('reise.line'), (n === 5 ? t('reise.score', { n: throws }) : t('reise.teil', { n })) + (b.isNew ? '  ★' : '') + '  ·  ' + t('reise.best', { n: b.best })], MEL.birthday), 300); },
  draw(g, ctx){ const dt = 1/60;
    if(moved) hole(g, F);
    PINS.forEach((q, k) => { if(hit[k]){ g.save(); g.fillStyle = 'rgba(255,214,77,.9)'; g.strokeStyle = '#8a5a10'; g.lineWidth = 2; g.beginPath(); g.arc(q[0] + 18, q[1] - 34, 11, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#5a3a00'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText('✔', q[0] + 18, q[1] - 29); g.restore(); }
      else if(phase !== 'end'){ const u = (tt*1.2 + k*.3) % 1; g.strokeStyle = `rgba(220,80,50,${.6*(1 - u)})`; g.lineWidth = 2; g.beginPath(); g.arc(q[0], q[1] - 20, 14 + u*26, 0, 7); g.stroke(); } });
    if(trail.length > 1){ g.save(); g.strokeStyle = 'rgba(80,90,120,.45)'; g.setLineDash([6, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(trail[0][0], trail[0][1]); for(const q of trail) g.lineTo(q[0], q[1]); g.stroke(); g.restore(); }
    if(moved) spr(g, F, p.x, p.y, p.s, p.r, p.a);
    fx.draw(g);
    if(!fin.on) hud2(g, '✈️ ' + throws, '📍 ' + hit.filter(Boolean).length + '/5', 846);
    if(!fin.on && phase === 'ready' && throws === 0) hint(g, t('reise.hint'), tt, 670, 99);
    fin.draw(g, dt, 'rgba(30,40,70,', .18); } };
startCard(scene);
window.__rs = { get phase(){ return phase; }, get p(){ return p; }, get hit(){ return hit; }, get throws(){ return throws; }, PINS };
