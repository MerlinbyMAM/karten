// Büro-Kollege: „Kaffee-Kellner“. Die gedruckte Tasse von der Maschine zum Untersetzer am Schreibtisch tragen – ruhig, sonst schwappt es über! 3 Tassen, am Ende zählt, wie viel Kaffee ankam.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'tasse', x: 94, y: 576, w: 98, h: 80, cx: 142.7, cy: 616.7, px: 97.5, py: 580, pw: 91, ph: 78.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const CUP = 0, HOME = ctr(0), PAD = { x: 397, y: 640 }, TRAY = { x: HOME.x, y: HOME.y };
let c, phase, fill, total, served, slosh, fx, fin, tt, held, last, drip;
const scene = {
  title: t('buero.title'), subtitle: t('buero.sub'), emoji: '☕', accent: '#ffd9a0', button: '#8a5a2a', bg: '#5a3a1a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ c = { x: HOME.x, y: HOME.y, tilt: 0, vx: 0 }; phase = 'ready'; fill = 1; total = 0; served = 0; slosh = 0; tt = 0; held = false; last = null; drip = 0; fx.clear(); fin.stop(); },
  onTap(x, y){ if(phase !== 'ready') return; if(Math.hypot(x - c.x, y - c.y) < 70){ held = true; phase = 'carry'; c.ox = c.x - x; c.oy = c.y - y; last = [x, y, performance.now()]; } },
  onDrag(x, y, ctx){ if(!held) return; const now = performance.now(), dt = Math.max(.008, (now - last[2])/1000), vx = (x - last[0])/dt, vy = (y - last[1])/dt; last = [x, y, now];
    c.x = x + c.ox; c.y = y + c.oy; const a = (vx - c.vx)/dt; c.vx += (vx - c.vx)*.3; slosh += Math.min(6, Math.abs(a)/9000 + Math.hypot(vx, vy)/1600)*dt*60*.012;
    if(slosh > 1){ slosh = .55; fill = Math.max(0, fill - .08); for(let k = 0; k < 6; k++) fx.burst(c.x + (vx > 0 ? -1 : 1)*30, c.y - 20, 1, ['#6a3a1a', '#8a5a2a'], 120, 900, 3); ctx.tone(180, 0, .08, 'sine', .05); } },
  onRelease(ctx){ if(!held) return; held = false;
    if(Math.hypot(c.x - PAD.x, c.y - PAD.y) < 55){ phase = 'served'; c.x = PAD.x; c.y = PAD.y; total += fill; served++; c.t = 0; ctx.tone(660, 0, .1, 'triangle', .07); ctx.tone(880, .1, .2, 'triangle', .07);
      fx.pop(PAD.x, PAD.y - 80, Math.round(fill*100) + '%', fill > .85 ? '#ffe08a' : '#ffffff', 30); }
    else { phase = 'carry'; held = false; } },
  update(dt, ctx){ tt += dt; fx.update(dt); slosh = Math.max(0, slosh - dt*.6); c.tilt += ((held ? -c.vx/2500 : 0) - c.tilt)*Math.min(1, dt*8); c.vx *= Math.pow(.05, dt);
    if(phase === 'carry' && !held){ phase = 'ready'; }
    if(phase === 'served'){ c.t += dt; if(c.t > 1.4){ if(served >= 3){ this.finish(ctx); return; } phase = 'brew'; drip = 0; } }
    if(phase === 'brew'){ drip += dt; if(Math.random() < .2) ctx.noise(0, .05, .02, 600); if(drip > 1.6){ c.x = HOME.x; c.y = HOME.y; fill = 1; phase = 'ready'; ctx.tone(1046, 0, .1, 'triangle', .05); } } },
  finish(ctx){ phase = 'end'; const p = Math.round(total/3*100), b = best('buero', p, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    fin.start(ctx, greeting('buero'), [t('buero.line'), t('buero.score', { n: p }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('buero.best', { n: b.best })], MEL.birthday); },
  draw(g, ctx){ const dt = 1/60;
    if(phase !== 'ready' || served) hole(g, CUP);
    if(phase === 'brew'){ g.save(); g.fillStyle = '#4a2a10'; g.globalAlpha = .9; g.fillRect(HOME.x - 2, HOME.y - 60, 4, 30 + Math.sin(tt*30)*2); g.restore(); spr(g, CUP, HOME.x, HOME.y, 1, 0, Math.min(1, drip/1.2)); }
    if(phase !== 'brew' && phase !== 'end'){ const k = held ? 1.06 : 1; g.save(); if(held){ g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 12; g.shadowOffsetY = 10; } spr(g, CUP, c.x, c.y, k, c.tilt); g.restore();
      const b = OB[CUP]; g.save(); g.translate(c.x, c.y); g.rotate(c.tilt); g.fillStyle = 'rgba(70,35,10,.9)'; g.beginPath(); g.ellipse(-6, -b.h*.32, b.w*.27, 5, -c.tilt*2 + Math.sin(tt*12)*slosh*.3, 0, 7); g.globalAlpha = fill < 1 ? .25 + (1 - fill) : 0; g.fill(); g.restore(); }
    if(phase === 'ready' || phase === 'carry'){ const k = .4 + .3*Math.sin(tt*4); g.save(); g.strokeStyle = `rgba(255,217,160,${k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(PAD.x, PAD.y + 8, 46, 14, 0, 0, 7); g.stroke(); g.restore(); }
    if(held){ g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(200, 760, 200, 12); g.fillStyle = slosh > .7 ? '#e05a3a' : '#ffd9a0'; g.fillRect(200, 760, 200*Math.min(1, slosh), 12); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '☕ ' + served + '/3', Math.round(fill*100) + '%', 846);
    if(!fin.on && served === 0 && phase === 'ready') hint(g, t('buero.hint'), tt, 720, 99);
    fin.draw(g, dt, 'rgba(60,35,15,', .2); } };
startCard(scene);
window.__bu = { OB, PAD, get c(){ return c; }, get phase(){ return phase; }, get served(){ return served; } };
