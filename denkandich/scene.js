// Ich denk an dich: „Papierboot“ – ohne Punkte. Tippe ins Wasser: Die Wellen schieben das gedruckte Papierboot sanft weiter. Führe es über den Teich bis zum Steg.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'boot', x: 100, y: 618, w: 145, h: 84, cx: 173.0, cy: 660.5, px: 91, py: 612, pw: 161, ph: 93.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const B = 0, BC = ctr(0), J = { x: 440, y: 395 }, NOTES = [523, 587, 659, 784, 880];
let fx, fin, tt, phase, b, rip, moved, done, nt;
const scene = {
  title: t('denkandich.title'), subtitle: t('denkandich.sub'), emoji: '⛵', accent: '#bfe9e0', button: '#2a6a7a', bg: '#1e3a40',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; b = { x: BC.x, y: BC.y, vx: 0, vy: 0, r: 0 }; rip = []; moved = false; done = false; nt = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(done || y < 330) return; phase = 'play'; moved = true; rip.push({ x, y, t: 0 }); ctx.tone(NOTES[nt++ % 5], 0, .6, 'sine', .04);
    const dx = b.x - x, dy = b.y - y, d = Math.max(30, Math.hypot(dx, dy)), f = Math.max(0, 1 - d/280)*260; b.vx += dx/d*f; b.vy += dy/d*f; },
  update(dt, ctx){ tt += dt; fx.update(dt); for(const r of rip) r.t += dt; rip = rip.filter(r => r.t < 2);
    b.x += b.vx*dt; b.y += b.vy*dt; b.vx *= Math.pow(.35, dt); b.vy *= Math.pow(.35, dt);
    if(b.x < 60){ b.x = 60; b.vx = Math.abs(b.vx)*.5; } if(b.x > 560){ b.x = 560; b.vx = -Math.abs(b.vx)*.5; } if(b.y < 380){ b.y = 380; b.vy = Math.abs(b.vy)*.5; } if(b.y > 820){ b.y = 820; b.vy = -Math.abs(b.vy)*.5; }
    b.r += ((Math.max(-.4, Math.min(.4, b.vx/300))) - b.r)*Math.min(1, dt*3);
    if(!done && Math.hypot(b.x - J.x, b.y - J.y) < 50){ done = true; b.vx = b.vy = 0; fx.sparkle(J.x, J.y, 24); ctx.melody([['E5', .5], ['G5', .5], ['C6', 1]], 90, 'sine', .08); setTimeout(() => fin.start(ctx, greeting('denkandich'), [t('denkandich.line')], null), 1600); } },
  draw(g, ctx){ const dt = 1/60;
    if(moved) hole(g, B);
    for(const r of rip){ g.save(); g.strokeStyle = `rgba(255,255,255,${.5*(1 - r.t/2)})`; g.lineWidth = 2; for(const k of [0, .3]){ const rr = (r.t - k)*90; if(rr > 0){ g.beginPath(); g.ellipse(r.x, r.y, rr, rr*.45, 0, 0, 7); g.stroke(); } } g.restore(); }
    if(!done && phase === 'play'){ g.save(); g.globalAlpha = .4 + .3*Math.sin(tt*3); g.strokeStyle = '#fff6c0'; g.lineWidth = 3; g.setLineDash([5, 6]); g.beginPath(); g.ellipse(J.x, J.y, 46, 18, 0, 0, 7); g.stroke(); g.restore(); }
    if(moved){ g.save(); g.fillStyle = 'rgba(20,60,70,.18)'; g.beginPath(); g.ellipse(b.x + 4, b.y + 30, 62, 10, 0, 0, 7); g.fill(); g.restore(); spr(g, B, b.x, b.y + Math.sin(tt*2)*2, 1, b.r*.3 + Math.sin(tt*1.6)*.03); }
    if(done){ g.save(); g.globalAlpha = .9; g.font = '30px sans-serif'; g.textAlign = 'center'; g.fillText('💌', b.x, b.y - 60 - Math.sin(tt*2)*6); g.restore(); }
    fx.draw(g);
    if(!fin.on && phase === 'ready') hint(g, t('denkandich.hint'), tt, 560, 99);
    fin.draw(g, dt, 'rgba(30,60,70,', .15); } };
startCard(scene);
window.__dk = { get b(){ return b; }, get done(){ return done; }, J };
