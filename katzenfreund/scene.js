// Katzenfreund: „Woll-Curling“. Gedrucktes Wollknäuel anschubsen – es rollt über den Holzboden und zieht einen roten Faden. Ziel: genau vor den Pfoten des Katers liegen bleiben. 3 Würfe, Punkte nach Nähe.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'katze', x: 8, y: 512, w: 324, h: 188, cx: 184.6, cy: 598.7, px: 9.5, py: 509, pw: 320.5, ph: 181.5 },
  { n: 'wolle', x: 300, y: 640, w: 266, h: 140, cx: 457.6, cy: 717.3, px: 296.5, py: 638.5, pw: 276, ph: 146 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const CAT = 0, W = 1, WH = ctr(1), TGT = { x: 175, y: 745 }, R = OB[1].h*.32;
let y, phase, trail, tries, pts, fx, fin, tt, held, track, moved, pounce;
const scene = {
  title: t('katzenfreund.title'), subtitle: t('katzenfreund.sub'), emoji: '🧶', accent: '#ffd36a', button: '#a0602a', bg: '#6a3a1a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ y = { x: WH.x, y: WH.y, vx: 0, vy: 0, r: 0, s: 1 }; phase = 'ready'; trail = []; tries = 0; pts = 0; tt = 0; held = false; moved = false; pounce = 0; fx.clear(); fin.stop(); },
  onTap(x, yy){ if(phase !== 'ready') return; if(Math.hypot(x - y.x, yy - y.y) < 90){ held = true; track = [[x, yy, performance.now()]]; } },
  onDrag(x, yy){ if(held){ track.push([x, yy, performance.now()]); if(track.length > 8) track.shift(); } },
  onRelease(ctx){ if(!held) return; held = false; const f = flick(track); const sp = Math.hypot(f.vx, f.vy); if(sp < 100) return;
    const k = Math.min(.3, 700/sp); y.vx = f.vx*k; y.vy = f.vy*k; phase = 'roll'; moved = true; tries++; trail = [[y.x, y.y]]; ctx.tone(260, 0, .1, 'triangle', .05); },
  update(dt, ctx){ tt += dt; fx.update(dt); pounce = Math.max(0, pounce - dt*1.5);
    if(phase === 'roll'){ y.x += y.vx*dt; y.y += y.vy*dt; const f = Math.pow(.2, dt); y.vx *= f; y.vy *= f; y.r += (y.vx/R)*dt; y.s = Math.max(.55, Math.min(1, .7 + (y.y - 600)/200*.3));
      if(y.x < 30){ y.x = 30; y.vx = -y.vx*.6; } if(y.x > 570){ y.x = 570; y.vx = -y.vx*.6; } if(y.y < 640){ y.y = 640; y.vy = -y.vy*.6; } if(y.y > 835){ y.y = 835; y.vy = -y.vy*.6; }
      const l = trail[trail.length - 1]; if(Math.hypot(y.x - l[0], y.y - l[1]) > 6) trail.push([y.x, y.y + R*.4*y.s]);
      if(Math.hypot(y.vx, y.vy) < 12){ phase = 'stop'; y.t = 0; const d = Math.hypot(y.x - TGT.x, y.y - TGT.y), p = Math.max(0, Math.round(100 - d*.8)); pts += p;
        fx.pop(y.x, y.y - 70, p >= 90 ? t('katzenfreund.perfekt') : '+' + p, p >= 90 ? '#ffe08a' : '#ffffff', p >= 90 ? 34 : 28);
        if(p >= 60){ pounce = 1; ctx.tone(880, 0, .12, 'sawtooth', .04); ctx.tone(660, .1, .25, 'sawtooth', .04); fx.pop(150, 470, t('katzenfreund.miau'), '#ffffff', 30); } else ctx.tone(300, 0, .15, 'sine', .05); } }
    if(phase === 'stop'){ y.t += dt; if(y.t > 1.4){ phase = 'home'; y.t = 0; y.x0 = y.x; y.y0 = y.y; } }
    if(phase === 'home'){ y.t += dt; const u = Math.min(1, y.t/.6); y.x = y.x0 + (WH.x - y.x0)*u; y.y = y.y0 + (WH.y - y.y0)*u - Math.sin(u*Math.PI)*60; y.s = 1; trail = trail.slice(Math.ceil(trail.length*.1));
      if(u >= 1){ trail = []; if(tries >= 3) this.finish(ctx); else phase = 'ready'; } } },
  finish(ctx){ phase = 'end'; const b = best('katzenfreund', pts, true);
    ctx.melody([['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('katzenfreund'), [t('katzenfreund.line'), t('katzenfreund.score', { n: pts }) + (b.isNew && pts ? '  ★' : '') + '  ·  ' + t('katzenfreund.best', { n: b.best })], MEL.birthday), 400); },
  draw(g, ctx){ const dt = 1/60;
    if(moved && phase !== 'end') hole(g, W);
    if(phase === 'ready' || phase === 'roll'){ const k = .4 + .3*Math.sin(tt*4); g.save(); g.strokeStyle = `rgba(255,220,120,${k})`; g.lineWidth = 3; g.setLineDash([8, 7]); for(const r of [24, 48, 72]){ g.beginPath(); g.ellipse(TGT.x, TGT.y, r, r*.35, 0, 0, 7); g.stroke(); } g.restore(); }
    if(pounce > 0){ const c = ctr(CAT), e = Math.sin(pounce*Math.PI); spr(g, CAT, c.x + e*18, c.y - e*14, 1 + e*.04, -e*.05); }
    if(trail.length > 1){ g.save(); g.strokeStyle = '#a0201e'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); trail.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.restore(); }
    if(moved && phase !== 'end') spr(g, W, y.x, y.y, y.s, y.r);
    fx.draw(g);
    if(!fin.on) hud2(g, '🧶 ' + tries + '/3', '★ ' + pts, 846);
    if(!fin.on && tries === 0 && phase === 'ready') hint(g, t('katzenfreund.hint'), tt, 450, 99);
    fin.draw(g, dt, 'rgba(60,30,10,', .2); } };
startCard(scene);
window.__kz = { OB, TGT, get y(){ return y; }, get phase(){ return phase; }, get pts(){ return pts; }, get tries(){ return tries; } };
