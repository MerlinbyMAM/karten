// Pferd: „Springreiten“ – das gedruckte Pferd galoppiert, Hindernisse kommen von rechts. Im richtigen Moment tippen, damit es springt. Zehn Sprünge – schaffst du einen Null-Fehler-Ritt?
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'pferd', x: 12, y: 402, w: 406, h: 310, cx: 234.2, cy: 553.3, px: 14.5, py: 405, pw: 407.5, ph: 315.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const H = 0, HC = ctr(0), GY = 708, FX = 360, TOTAL = 10;
let fx, fin, tt, phase, jy, jt, air, obs, spawned, nextT, clear, faults, speed;
const scene = {
  title: t('pferd.title'), subtitle: t('pferd.sub'), emoji: '🐎', accent: '#ffd98a', button: '#6a3a1a', bg: '#2a3a20',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; jy = 0; jt = 0; air = false; obs = []; spawned = 0; nextT = 0; clear = 0; faults = 0; speed = 300; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; if(phase === 'ready'){ phase = 'ride'; nextT = 1; return; } if(!air){ air = true; jt = 0; ctx.tone(330, 0, .15, 'triangle', .05); ctx.noise(0, .1, .1, 900); } },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(air){ jt += dt; const u = jt/.82; jy = -Math.sin(Math.min(1, u)*Math.PI)*150; if(u >= 1){ air = false; jy = 0; ctx.noise(0, .12, .15, 500); } }
    if(phase === 'ride'){ nextT -= dt; if(nextT <= 0 && spawned < TOTAL){ obs.push({ x: 680, h: 46 + Math.random()*26, done: false, hit: 0, oxer: Math.random() < .3 }); spawned++; nextT = 1.6 + Math.random()*1.1; }
      for(const o of obs){ o.x -= speed*dt; if(o.hit > 0) o.hit += dt;
        if(!o.done && o.x < FX + 20 && o.x > FX - 50){ if(-jy < o.h + 10){ o.done = true; o.hit = .01; faults++; fx.pop(FX, 520, t('pferd.fehler'), '#ffd0c8', 28); ctx.tone(180, 0, .2, 'sine', .06); ctx.noise(0, .2, .2, 1200); } }
        if(!o.done && o.x < FX - 50){ o.done = true; clear++; fx.pop(FX, 520, t('pferd.sauber'), '#b9ff9a', 28); ctx.tone(660 + clear*20, 0, .1, 'triangle', .06); } }
      obs = obs.filter(o => o.x > -120); speed = Math.min(380, speed + dt*3);
      if(spawned >= TOTAL && !obs.length) this.finish(ctx); } },
  finish(ctx){ phase = 'end'; const b = best('pferd', faults, false);
    ctx.melody([['G4', .25], ['C5', .25], ['E5', .25], ['G5', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('pferd'), [t('pferd.line'), (faults ? t('pferd.score', { n: faults }) : t('pferd.null')) + (b.isNew ? '  ★' : '') + '  ·  ' + t('pferd.best', { n: b.best })], MEL.birthday), 400); },
  fence(g, o){ const x = o.x, y = GY, wob = o.hit > 0 ? Math.min(1, o.hit*3) : 0;
    g.save(); g.fillStyle = 'rgba(40,60,20,.25)'; g.beginPath(); g.ellipse(x + 10, y + 4, 60, 8, 0, 0, 7); g.fill();
    for(const s of [-40, 40]){ g.fillStyle = '#f5f5f0'; g.fillRect(x + s - 4, y - o.h - 18, 8, o.h + 18); g.fillStyle = '#3a6ad0'; g.fillRect(x + s - 4, y - o.h - 18, 8, 6); }
    for(let i = 0; i < 2; i++){ const yy = y - o.h + i*o.h*.45, dr = wob*(i === 0 ? 1 : 0); g.save(); g.translate(x, yy + dr*o.h*.9); g.rotate(dr*.5); for(let k = -44; k < 44; k += 16){ g.fillStyle = (k/16 + 3) % 2 < 1 ? '#e03a2a' : '#ffffff'; g.fillRect(k, -4, 16, 8); } g.restore(); }
    g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    hole(g, H);
    for(const o of obs) this.fence(g, o);
    const bob = phase === 'ride' && !air ? Math.abs(Math.sin(tt*9))*-6 : 0, tilt = air ? (jt < .41 ? -.12 : .1)*Math.sin(Math.min(1, jt/.82)*Math.PI) : Math.sin(tt*9)*.015;
    g.save(); g.fillStyle = `rgba(40,60,20,${.3 + jy/600})`; g.beginPath(); g.ellipse(HC.x + 20, GY + 2, 170 + jy/3, 14, 0, 0, 7); g.fill(); g.restore();
    spr(g, H, HC.x, HC.y + jy + bob, 1, tilt);
    fx.draw(g);
    if(!fin.on) hud2(g, '🏇 ' + Math.min(spawned, TOTAL) + '/' + TOTAL, '❌ ' + faults, 846);
    if(!fin.on && phase === 'ready') hint(g, t('pferd.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(40,50,30,', .18); } };
startCard(scene);
window.__pf = { get phase(){ return phase; }, get obs(){ return obs; }, get air(){ return air; }, get faults(){ return faults; }, FX };
