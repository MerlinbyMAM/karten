// Motorrad: „Volle Fahrt!“ Gedrückt halten lässt den Motor hochdrehen, loslassen schaltet. Im grünen Bereich schalten, nicht in den Begrenzer – fünf Gänge auf Zeit.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'bike', x: 8, y: 532, w: 334, h: 230, cx: 180.8, cy: 654.0, px: 10.5, py: 535.5, pw: 332, ph: 229 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const B = 0, BC = ctr(0), VP = { x: 380, y: 525 }, BX = 90, BW = 420, BY = 330;
const ZONES = [[.74, .9], [.76, .9], [.78, .9], [.8, .91], [.82, .92]];
let fx, fin, tt, phase, gear, rpm, held, time, speed, perfect, lines, puff, snd, lim, msgT;
const scene = {
  title: t('motorrad.title'), subtitle: t('motorrad.sub'), emoji: '🏍️', accent: '#ffb35a', button: '#8a3a1a', bg: '#3a2414',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; gear = 1; rpm = .15; held = false; time = 0; speed = 0; perfect = 0; lines = []; puff = []; snd = 0; lim = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; if(phase === 'ready'){ phase = 'run'; ctx.noise(0, .4, .15, 300); } held = true; },
  onRelease(ctx){ if(!held || phase !== 'run') return; held = false; const z = ZONES[gear - 1];
    if(rpm < z[0] - .12){ fx.pop(300, 480, t('motorrad.frueh'), '#ffe0c0', 28); return; }
    let q; if(rpm >= z[0] && rpm <= z[1]){ q = 1; perfect++; fx.pop(300, 480, t('motorrad.perfekt'), '#b9ff9a', 32); ctx.tone(880, 0, .1, 'triangle', .07); }
    else { q = .55; fx.pop(300, 480, rpm < z[0] ? t('motorrad.frueh') : t('motorrad.spaet'), '#ffe0c0', 28); }
    speed += 50*q + 10; ctx.noise(0, .12, .2, 1200); puff.push({ x: 40, y: 690, t: 0 });
    if(gear >= 5){ this.finish(ctx); return; } gear++; rpm = .38; },
  update(dt, ctx){ tt += dt; fx.update(dt); if(lim > 0) lim -= dt;
    if(phase === 'run'){ time += dt;
      if(held){ rpm += dt*(.75 - gear*.05)*(1 + rpm*.4); if(rpm >= 1){ rpm = .86; lim = .35; time += .25; fx.pop(300, 480, t('motorrad.begrenzer'), '#ff9a8a', 28); ctx.tone(90, 0, .25, 'square', .06); } }
      else rpm = Math.max(.2, rpm - dt*.35);
      snd -= dt; if(snd <= 0){ snd = .07; ctx.tone(55 + rpm*150 + gear*12, 0, .09, 'sawtooth', .025); } }
    if(phase === 'end') speed = Math.max(0, speed - dt*40);
    const sp = phase === 'run' ? 20 + speed : speed;
    if(sp > 1 && Math.random() < sp*dt*.25){ const a = Math.random()*Math.PI*.9 + .05; lines.push({ a, d: 20 + Math.random()*40, v: 0 }); }
    for(const l of lines){ l.v = sp*6; l.d += l.v*dt*(1 + l.d/200); } lines = lines.filter(l => l.d < 700);
    for(const p of puff) p.t += dt; puff = puff.filter(p => p.t < 1); },
  finish(ctx){ phase = 'end'; held = false; const s = Math.round(time*100)/100, b = best('motorrad', s, false);
    ctx.noise(0, .8, .2, 400); ctx.melody([['G4', .25], ['C5', .25], ['E5', .25], ['G5', .75]], 180, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('motorrad'), [t('motorrad.line'), t('motorrad.score', { s: s.toFixed(2), p: perfect }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('motorrad.best', { s: Number(b.best).toFixed(2) })], MEL.birthday), 900); },
  draw(g, ctx){ const dt = 1/60;
    g.save(); for(const l of lines){ const x = VP.x - Math.cos(l.a)*l.d*1.6, y = VP.y + Math.sin(l.a)*l.d*.9, x2 = VP.x - Math.cos(l.a)*(l.d + 30 + l.v*.04)*1.6, y2 = VP.y + Math.sin(l.a)*(l.d + 30 + l.v*.04)*.9;
      g.strokeStyle = `rgba(255,240,210,${Math.min(.6, l.d/300)})`; g.lineWidth = 1 + l.d/250; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); } g.restore();
    for(const p of puff){ g.fillStyle = `rgba(220,220,220,${.5*(1 - p.t)})`; g.beginPath(); g.arc(p.x - p.t*60, p.y - p.t*20, 10 + p.t*30, 0, 7); g.fill(); }
    const j = phase === 'run' ? rpm*(held ? 1.6 : .7) : 0; spr(g, B, BC.x + (Math.random() - .5)*j, BC.y + (Math.random() - .5)*j);
    if(phase !== 'end' && !fin.on){ const z = ZONES[gear - 1];
      g.save(); g.fillStyle = 'rgba(30,20,10,.55)'; g.beginPath(); g.roundRect(BX - 12, BY - 14, BW + 24, 52, 14); g.fill();
      g.fillStyle = '#3a3a3a'; g.fillRect(BX, BY, BW, 24); g.fillStyle = 'rgba(90,220,90,.85)'; g.fillRect(BX + BW*z[0], BY, BW*(z[1] - z[0]), 24); g.fillStyle = 'rgba(230,60,40,.85)'; g.fillRect(BX + BW*.95, BY, BW*.05, 24);
      const gr = g.createLinearGradient(BX, 0, BX + BW, 0); gr.addColorStop(0, '#ffd27a'); gr.addColorStop(1, '#ff6a3a'); g.fillStyle = gr; g.globalAlpha = .9; g.fillRect(BX, BY + 6, BW*Math.min(1, rpm), 12); g.globalAlpha = 1;
      g.fillStyle = '#fff'; g.fillRect(BX + BW*Math.min(1, rpm) - 2, BY - 4, 4, 32);
      g.font = 'bold 22px Georgia'; g.textAlign = 'left'; g.fillText(t('motorrad.gang', { n: gear }), BX, BY + 52); g.textAlign = 'right'; g.fillText(Math.round(rpm*9000), BX + BW, BY + 52); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '⚙️ ' + gear + '/5', '⏱ ' + time.toFixed(2) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('motorrad.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(50,30,15,', .18); } };
startCard(scene);
window.__mr = { get phase(){ return phase; }, get rpm(){ return rpm; }, get gear(){ return gear; }, get time(){ return time; }, ZONES };
