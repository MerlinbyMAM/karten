// Angler: „Petri Heil!“ Die gedruckte Pose vom Steg ins Wasser werfen, warten bis sie zuckt und abtaucht – dann anschlagen (tippen)! 5 Würfe, die Fische werden gemessen.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'pose', x: 126, y: 576, w: 38, h: 58, cx: 145.9, cy: 607.2, px: 122.5, py: 567, pw: 47, ph: 73 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const P = 0, PH = ctr(0), TIP = { x: 262, y: 448 };
const FISH = [['Rotauge', '#c0c8d0', 18, 30], ['Barsch', '#8ab04a', 20, 38], ['Forelle', '#c8a07a', 28, 50], ['Karpfen', '#c8a040', 40, 80], ['Hecht', '#6a8a4a', 55, 110]];
let p, phase, casts, cm, catchList, fx, fin, tt, held, track, moved, fish, bite;
const scene = {
  title: t('angler.title'), subtitle: t('angler.sub'), emoji: '🎣', accent: '#ffe08a', button: '#4a6a3a', bg: '#2a4a2a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ p = { x: PH.x, y: PH.y, s: 1, dip: 0 }; phase = 'ready'; casts = 0; cm = 0; catchList = []; tt = 0; held = false; moved = false; fish = null; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(phase === 'ready'){ if(Math.hypot(x - p.x, y - p.y) < 80){ held = true; track = [[x, y, performance.now()]]; } return; }
    if(phase === 'wait'){ phase = 'early'; p.t = 0; fx.pop(p.x, p.y - 50, t('angler.frueh'), '#ffe0e0', 26); ctx.tone(220, 0, .2, 'sine', .06); return; }
    if(phase === 'bite'){ const f = FISH[Math.min(4, Math.floor(Math.random()*Math.random()*5 + Math.random()*1.5))], size = Math.round(f[2] + Math.random()*(f[3] - f[2])); cm += size; catchList.push(size);
      fish = { f, size, x: p.x, y: p.y, t: 0 }; phase = 'catch'; ctx.noise(0, .3, .2, 900); ctx.tone(523, .1, .15, 'triangle', .08); ctx.tone(784, .25, .3, 'triangle', .08); fx.burst(p.x, p.y, 20, ['#ffffff', '#bfe9f5'], 220, 400, 4); } },
  onDrag(x, y){ if(held){ track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); } },
  onRelease(ctx){ if(!held) return; held = false; const f = flick(track); if(f.vy > -150 && f.vx < 150) return;
    const pw = Math.min(1, Math.hypot(f.vx, f.vy)/1800); p.tx = Math.max(300, Math.min(560, 300 + pw*180 + f.vx*.08)); p.ty = Math.max(480, Math.min(760, 720 - pw*230)); p.x0 = p.x; p.y0 = p.y; p.t = 0;
    phase = 'cast'; moved = true; casts++; ctx.noise(0, .25, .06, 3000); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'cast'){ p.t += dt; const u = Math.min(1, p.t/.8); p.x = p.x0 + (p.tx - p.x0)*u; p.y = p.y0 + (p.ty - p.y0)*u - Math.sin(u*Math.PI)*170; p.s = 1 - .45*u;
      if(u >= 1){ phase = 'wait'; p.wait = 1.5 + Math.random()*3; p.t = 0; ctx.tone(300, 0, .15, 'sine', .05); fx.burst(p.x, p.y + 8, 10, ['#ffffff', '#bfe9f5'], 90, 200, 3); } }
    if(phase === 'wait'){ p.t += dt; p.dip = Math.sin(tt*2.5)*1.5 + (Math.random() < .02 ? 3 : 0); if(p.t > p.wait){ phase = 'bite'; p.t = 0; ctx.tone(180, 0, .1, 'square', .05); } }
    if(phase === 'bite'){ p.t += dt; p.dip = 6 + Math.sin(p.t*40)*5 + Math.min(1, p.t/.3)*12; if(p.t > 1){ phase = 'gone'; p.t = 0; fx.pop(p.x, p.y - 50, t('angler.weg'), '#ffe0e0', 26); ctx.tone(200, 0, .25, 'sine', .06); } }
    if(phase === 'catch'){ fish.t += dt; if(fish.t > 1.6){ phase = 'reel'; p.t = 0; p.x0 = p.x; p.y0 = p.y; } }
    if(phase === 'early' || phase === 'gone'){ p.t += dt; if(p.t > .9){ phase = 'reel'; p.t = 0; p.x0 = p.x; p.y0 = p.y; } }
    if(phase === 'reel'){ p.t += dt; const u = Math.min(1, p.t/.7); p.x = p.x0 + (PH.x - p.x0)*u; p.y = p.y0 + (PH.y - p.y0)*u - Math.sin(u*Math.PI)*50; p.s = .55 + .45*u; p.dip = 0;
      if(u >= 1){ p.x = PH.x; p.y = PH.y; p.s = 1; if(casts >= 5) this.finish(ctx); else phase = 'ready'; } } },
  finish(ctx){ phase = 'end'; const b = best('angler', cm, true);
    ctx.melody([['G4', .25], ['C5', .25], ['E5', .25], ['G5', .75]], 180, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('angler'), [t('angler.line'), t('angler.score', { n: catchList.length, c: cm }) + (b.isNew && cm ? '  ★' : '') + '  ·  ' + t('angler.best', { n: b.best })], MEL.birthday), 400); },
  draw(g, ctx){ const dt = 1/60;
    if(moved) hole(g, P);
    if(phase !== 'ready' && phase !== 'end'){ g.save(); g.strokeStyle = 'rgba(240,240,240,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(TIP.x, TIP.y); g.quadraticCurveTo((TIP.x + p.x)/2, Math.max(TIP.y, p.y) + 30, p.x, p.y - 10*p.s); g.stroke(); g.restore(); }
    if(phase === 'wait' || phase === 'bite'){ g.save(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; const r = (tt*30) % 30; g.beginPath(); g.ellipse(p.x, p.y + 14*p.s, 10 + r, (10 + r)*.3, 0, 0, 7); g.stroke(); g.restore(); }
    if(moved && phase !== 'end'){ g.save(); if(phase === 'wait' || phase === 'bite'){ g.beginPath(); g.rect(0, 0, 600, p.y + 12*p.s); g.clip(); } spr(g, P, p.x, p.y + p.dip, p.s); g.restore(); }
    if(fish){ const u = Math.min(1, fish.t/1.6), y = fish.y - Math.sin(u*Math.PI)*140, s = .5 + fish.size/90, f = fish.f; g.save(); g.translate(fish.x, y); g.rotate(Math.sin(fish.t*14)*.4); g.scale(s, s);
      g.fillStyle = f[1]; g.beginPath(); g.ellipse(0, 0, 34, 13, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(30, 0); g.lineTo(52, -14); g.lineTo(52, 14); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-22, -3, 4, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(-22, -3, 2, 0, 7); g.fill(); g.restore();
      if(fish.t < 1.6){ g.save(); g.font = 'bold 26px Georgia'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 4; const txt = t('angler.fisch.' + f[0]) + ' · ' + fish.size + ' cm'; g.strokeText(txt, 300, 400); g.fillText(txt, 300, 400); g.restore(); } else if(phase !== 'catch') fish = null; }
    fx.draw(g);
    if(!fin.on) hud2(g, '🎣 ' + casts + '/5', '🐟 ' + cm + ' cm', 846);
    if(!fin.on && (phase === 'ready' && casts === 0)) hint(g, t('angler.hint'), tt, 700, 99);
    if(!fin.on && phase === 'wait') hint(g, t('angler.warte'), 1, 700, 99);
    if(!fin.on && phase === 'bite') hint(g, t('angler.jetzt'), 1, 700, 99);
    fin.draw(g, dt, 'rgba(30,50,30,', .18); } };
startCard(scene);
window.__an = { get phase(){ return phase; }, get p(){ return p; }, get cm(){ return cm; }, get casts(){ return casts; } };
