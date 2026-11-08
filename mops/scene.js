// Lustiger Hund: „Happs!“ Wirf dem gedruckten Mops Leckerlis ins offene Maul – aber Achtung, der Wind dreht jedes Mal. 8 Leckerlis.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const M = { x: 292, y: 457, r: 50 }, S = { x: 300, y: 790 }, TOTAL = 8;
let fx, fin, tt, phase, b, held, track, n, hits, wind, chew, crumbs;
function flick(tr){ const now = performance.now(), f = tr.filter(p => now - p[2] < 140), a = f[0] || tr[0], z = tr[tr.length - 1], d = Math.max(16, z[2] - a[2]); return { vx: (z[0] - a[0])/d*1000, vy: (z[1] - a[1])/d*1000 }; }
const scene = {
  title: t('mops.title'), subtitle: t('mops.sub'), emoji: '🐶', accent: '#ffe07a', button: '#6a3aa8', bg: '#3a2a50',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; b = { x: S.x, y: S.y, vx: 0, vy: 0, r: 0 }; held = false; n = 0; hits = 0; wind = (Math.random() - .5)*2; chew = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready' || phase === 'aim'){ if(Math.hypot(x - b.x, y - b.y) < 90){ held = true; track = [[x, y, performance.now()]]; phase = 'aim'; } } },
  onDrag(x, y){ if(held){ track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); } },
  onRelease(ctx){ if(!held) return; held = false; const f = flick(track); if(f.vy > -300) return;
    b.vx = f.vx*.6; b.vy = Math.max(-1300, f.vy*.8); phase = 'fly'; n++; b.t = 0; ctx.noise(0, .1, .06, 2500); },
  update(dt, ctx){ tt += dt; fx.update(dt); if(chew > 0) chew -= dt;
    if(phase === 'fly'){ b.t += dt; b.vx += wind*260*dt; b.vy += 1300*dt; b.x += b.vx*dt; b.y += b.vy*dt; b.r += dt*9;
      if(Math.hypot(b.x - M.x, b.y - M.y) < M.r && b.vy > -450){ hits++; chew = 1.2; phase = 'next'; b.t = 0; fx.pop(M.x, M.y - 90, t('mops.happs'), '#ffe07a', 38); fx.burst(M.x, M.y, 14, ['#c88a4a', '#ffd7a0', '#ff7aa8'], 180, 500, 4);
        ctx.tone(520, 0, .08, 'square', .05); ctx.tone(620, .12, .08, 'square', .05); ctx.tone(720, .24, .1, 'square', .05); }
      else if(b.y > 920 || b.x < -60 || b.x > 660 || (b.vy > 0 && b.y > M.y + 160)){ phase = 'next'; b.t = 0; fx.pop(300, 600, t('mops.daneben'), '#ffffff', 28); ctx.tone(180, 0, .2, 'sine', .05); } }
    if(phase === 'next'){ b.t += dt; if(b.t > 1.1){ if(n >= TOTAL){ this.finish(ctx); return; } b = { x: S.x, y: S.y, vx: 0, vy: 0, r: 0 }; wind = (Math.random() - .5)*(1 + n*.25); phase = 'aim'; } } },
  finish(ctx){ phase = 'end'; const bb = best('mops', hits, true);
    ctx.melody([['G4', .25], ['A4', .25], ['G4', .25], ['C5', .75]], 170, 'square', .07);
    setTimeout(() => fin.start(ctx, greeting('mops'), [t('mops.line'), t('mops.score', { n: hits, m: TOTAL }) + (bb.isNew && hits ? '  ★' : '') + '  ·  ' + t('mops.best', { n: bb.best })], MEL.birthday), 300); },
  bone(g, x, y, r, a = 1){ g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.fillStyle = '#f3e2c0'; g.strokeStyle = '#a07a4a'; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-18, -6, 36, 12, 5); g.fill(); g.stroke(); for(const s of [-1, 1]) for(const u of [-1, 1]){ g.beginPath(); g.arc(s*20, u*6, 7, 0, 7); g.fill(); g.stroke(); } g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    if(phase !== 'end' && !fin.on){ const w = wind;
      g.save(); g.translate(300, 728); g.fillStyle = 'rgba(60,30,90,.5)'; g.beginPath(); g.roundRect(-90, -18, 180, 36, 14); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 18px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('🌬️', -66, 1); const L = w*55; g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(10 - L, 0); g.lineTo(10 + L, 0); g.stroke(); if(Math.abs(L) > 4){ g.beginPath(); g.moveTo(10 + L, 0); g.lineTo(10 + L - Math.sign(L)*10, -8); g.moveTo(10 + L, 0); g.lineTo(10 + L - Math.sign(L)*10, 8); g.stroke(); } g.restore(); }
    if(chew > 0){ g.save(); g.globalAlpha = Math.min(1, chew); for(let i = 0; i < 3; i++){ const a = tt*3 + i*2.1; g.font = '26px sans-serif'; g.textAlign = 'center'; g.fillText('💛', M.x + Math.cos(a)*90, M.y - 60 - (1.2 - chew)*60 + Math.sin(a)*20); } g.restore(); }
    if(phase === 'aim' || phase === 'ready' || phase === 'fly') this.bone(g, b.x, b.y, b.r, 1);
    fx.draw(g);
    if(!fin.on) hud2(g, '🦴 ' + n + '/' + TOTAL, '😋 ' + hits, 846);
    if(!fin.on && phase === 'ready') hint(g, t('mops.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(60,40,80,', .18); } };
startCard(scene);
window.__mo = { get phase(){ return phase; }, get b(){ return b; }, get wind(){ return wind; }, get hits(){ return hits; }, M };
