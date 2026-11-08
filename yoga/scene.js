// Yoga: „In Balance“ – der oberste gedruckte Stein gerät ins Wanken. Mit sanften Wischbewegungen nach links und rechts im Gleichgewicht halten. Atme ruhig – wie lange schaffst du es?
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'stein', x: 248, y: 366, w: 116, h: 60, cx: 306.4, cy: 397.3, px: 245, py: 361.5, pw: 122.5, ph: 70.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const S = 0, PIV = { x: 306, y: 422 }, SC = ctr(0), GOAL = 40;
let fx, fin, tt, phase, a, va, held, lx, corr, held_t, wind, fall, moved;
const scene = {
  title: t('yoga.title'), subtitle: t('yoga.sub'), emoji: '🧘', accent: '#bfe9e0', button: '#2a6a6a', bg: '#2a2a3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; a = 0; va = 0; held = false; corr = 0; held_t = 0; wind = 0; fall = null; moved = false; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end' || phase === 'fall') return; if(phase === 'ready'){ phase = 'play'; ctx.tone(392, 0, .6, 'sine', .05); moved = true; } held = true; lx = x; },
  onDrag(x, y){ if(held && phase === 'play'){ corr += (x - lx)*.0016; lx = x; } },
  onRelease(){ held = false; },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play'){ held_t += dt; const lvl = 1 + held_t/18; wind += (Math.random() - .5)*dt*3*lvl; wind *= Math.pow(.6, dt); 
      va += (a*1.3*lvl + wind*.6 + corr*9)*dt; corr *= Math.pow(.02, dt); va *= Math.pow(.55, dt); a += va*dt;
      if(Math.random() < dt*.8) ctx.tone(196 + Math.abs(a)*200, 0, .5, 'sine', .015);
      if(Math.abs(a) > .55){ phase = 'fall'; fall = { t: 0, dir: Math.sign(a) }; ctx.tone(150, 0, .4, 'sine', .07); ctx.noise(.4, .2, .2, 600); }
      if(held_t >= GOAL) this.finish(ctx); }
    if(phase === 'fall'){ fall.t += dt; a += fall.dir*dt*3; if(fall.t > 1.2) this.finish(ctx); } },
  finish(ctx){ phase = 'end'; const s = Math.round(held_t*10)/10, b = best('yoga', s, true);
    ctx.melody([['E5', .5], ['G5', .5], ['B5', .5], ['E6', 1]], 90, 'sine', .08);
    setTimeout(() => fin.start(ctx, greeting('yoga'), [t('yoga.line'), (s >= GOAL ? t('yoga.voll') : t('yoga.score', { s: s.toFixed(1) })) + (b.isNew && s ? '  ★' : '') + '  ·  ' + t('yoga.best', { s: Number(b.best).toFixed(1) })], MEL.soft), 600); },
  draw(g, ctx){ const dt = 1/60;
    if(moved) hole(g, S);
    if(moved && !(phase === 'end' && fall)){ g.save(); let px = PIV.x, py = PIV.y; if(fall){ px += fall.dir*fall.t*80; py += fall.t*fall.t*260; }
      g.translate(px + Math.sin(a)*14, py); g.rotate(a); g.translate(-PIV.x, -PIV.y); spr(g, S, SC.x, SC.y); g.restore(); }
    if(phase === 'play'){ const br = (Math.sin(held_t*Math.PI/4) + 1)/2; g.save(); g.strokeStyle = `rgba(255,255,255,${.25 + br*.35})`; g.lineWidth = 3; g.beginPath(); g.arc(490, 440, 22 + br*16, 0, 7); g.stroke();
      g.font = 'italic 20px Georgia'; g.textAlign = 'center'; g.fillStyle = 'rgba(40,60,70,.8)'; g.fillText(br > .5 ? t('yoga.ein') : t('yoga.aus'), 490, 496); g.restore();
      const w = Math.max(-1, Math.min(1, a/.55)); g.save(); g.fillStyle = 'rgba(30,50,60,.35)'; g.fillRect(150, 780, 300, 10); g.fillStyle = Math.abs(w) > .7 ? '#ff7a6a' : '#8affd8'; g.fillRect(298 + w*148, 774, 6, 22); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🧘', '⏱ ' + held_t.toFixed(1) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('yoga.hint'), tt, 520, 99);
    fin.draw(g, dt, 'rgba(40,40,60,', .18); } };
startCard(scene);
window.__yo = { get phase(){ return phase; }, get a(){ return a; }, get held_t(){ return held_t; } };
