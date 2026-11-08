// Führerschein: „Hütchen-Slalom“. Das gedruckte rote Auto steht auf dem Übungsplatz, davor fünf gedruckte Pylonen.
// Auto mit dem Finger steuern und der Reihe nach an jeder Pylone vorbeifahren (die nächste leuchtet). Umgefahren = Fehler, sie fliegt weg.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'auto', x: 44, y: 496, w: 160, h: 108, cx: 122.0, cy: 550.3, px: 36.5, py: 488, pw: 174, ph: 125 },
  { n: 'kegel1', x: 238, y: 526, w: 54, h: 68, cx: 265.2, cy: 567.6, px: 234, py: 523, pw: 63, ph: 76.5 },
  { n: 'kegel2', x: 320, y: 497, w: 52, h: 59, cx: 345.1, cy: 533.6, px: 316, py: 492.5, pw: 59, ph: 71 },
  { n: 'kegel3', x: 410, y: 520, w: 54, h: 66, cx: 437.5, cy: 559.8, px: 406, py: 514.5, pw: 63.5, ph: 78.5 },
  { n: 'kegel4', x: 504, y: 545, w: 62, h: 71, cx: 534.3, cy: 588.9, px: 500, py: 539, pw: 69.5, ph: 85 },
  { n: 'kegel5', x: 476, y: 642, w: 74, h: 92, cx: 512.9, cy: 698.4, px: 471, py: 637.5, pw: 83.5, ph: 103 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const CAR = OB[0], CO = OB.slice(1), IMGC = IMG.slice(1);
const base = c => ({ x: c.cx, y: c.y + c.h*.86 });
let car, C, fx, fin, tt, time, next, err, over, held, started, tgt;
const scene = {
  title: t('fuehrerschein.title'), subtitle: t('fuehrerschein.sub'), emoji: '🚗', accent: '#ffd36a', button: '#c0392b', bg: '#7a2a20',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ car = { x: CAR.cx, y: CAR.cy, rot: 0, moved: false, vx: 0 }; C = CO.map(c => ({ st: 'up', t: 0, x: c.cx, y: c.cy, rot: 0, ok: false })); tt = 0; time = 0; next = 0; err = 0; over = false; held = false; started = false; tgt = null; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; if(Math.abs(x - car.x) < 95 && Math.abs(y - car.y) < 70){ held = true; started = true; car.moved = true; car.ox = car.x - x; car.oy = car.y - y; tgt = { x: car.x, y: car.y }; ctx.tone(110, 0, .25, 'sawtooth', .04); } },
  onDrag(x, y){ if(!held) return; tgt = { x: Math.max(60, Math.min(540, x + car.ox)), y: Math.max(470, Math.min(800, y + car.oy)) }; },
  onRelease(){ held = false; },
  update(dt, ctx){ tt += dt; fx.update(dt); if(started && !over) time += dt;
    if(tgt){ const px = car.x; car.x += (tgt.x - car.x)*Math.min(1, dt*10); car.y += (tgt.y - car.y)*Math.min(1, dt*10); car.vx = (car.x - px)/dt; car.rot += (Math.max(-.22, Math.min(.22, (tgt.y - car.y)*.004)) - car.rot)*Math.min(1, dt*8); }
    const foot = { x: car.x, y: car.y + CAR.h*.32 };
    C.forEach((c, i) => { c.t += dt; const b = base(CO[i]);
      if(c.st === 'up' && started){ const d = Math.hypot(foot.x - b.x, (foot.y - b.y)*1.6);
        if(d < 48){ c.st = 'fly'; c.t = 0; err++; c.vx = (car.vx > 0 ? 1 : -1)*260 + (b.x - foot.x)*3; c.vy = -420; ctx.tone(180, 0, .15, 'square', .06); fx.pop(b.x, b.y - 70, t('fuehrerschein.bumm'), '#ffe0e0', 24); }
        else if(i === next && d < 110){ c.ok = true; next++; ctx.tone(660 + next*110, 0, .15, 'triangle', .08); fx.burst(b.x, b.y - 40, 10, ['#7ad07a', '#ffffff'], 140, 260, 4);
          if(next === CO.length) this.finish(ctx); } }
      if(c.st === 'fly'){ c.vy += 1300*dt; c.x += c.vx*dt; c.y += c.vy*dt; c.rot += c.vx*dt*.02; if(c.t > 1.1){ c.st = 'up'; c.x = CO[i].cx; c.y = CO[i].cy; c.rot = 0; } } }); },
  finish(ctx){ over = true; held = false; const secs = Math.round((time + err*2)*10)/10, b = best('fuehrerschein', secs, false);
    ctx.tone(330, 0, .12, 'square', .05); ctx.tone(330, .18, .12, 'square', .05);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 220, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('fuehrerschein'), [t('fuehrerschein.line'), t('fuehrerschein.score', { s: secs, e: err }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('fuehrerschein.best', { s: b.best })], MEL.birthday), 1300); },
  draw(g, ctx){ const dt = 1/60;
    if(car.moved && IMG[0].bg.complete) g.drawImage(IMG[0].bg, CAR.px, CAR.py, CAR.pw, CAR.ph);
    C.forEach((c, i) => { const b = CO[i]; if(c.st !== 'up' && IMGC[i].bg.complete) g.drawImage(IMGC[i].bg, b.px, b.py, b.pw, b.ph); });
    if(!over && next < CO.length){ const b = base(CO[next]), k = .5 + .5*Math.sin(tt*6); g.save(); g.strokeStyle = `rgba(255,211,106,${.5 + .5*k})`; g.lineWidth = 4; g.shadowColor = '#ffd36a'; g.shadowBlur = 14; g.beginPath(); g.ellipse(b.x, b.y, 46 + k*6, 15 + k*2, 0, 0, 7); g.stroke(); g.restore(); }
    const items = C.map((c, i) => ({ y: c.st === 'up' ? base(CO[i]).y : 2000, i })); items.push({ y: car.y + CAR.h*.32, i: -1 }); items.sort((a, b) => a.y - b.y);
    for(const it of items){ if(it.i < 0){ if(!IMG[0].spr.complete) continue; g.save(); g.translate(car.x, car.y); g.rotate(car.rot); if(held){ g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 10; g.shadowOffsetY = 6; } g.drawImage(IMG[0].spr, CAR.x - CAR.cx, CAR.y - CAR.cy, CAR.w, CAR.h); g.restore(); continue; }
      const c = C[it.i], b = CO[it.i]; if(!IMGC[it.i].spr.complete) continue; g.save(); g.translate(c.x, c.y); g.rotate(c.rot); g.drawImage(IMGC[it.i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore();
      if(c.ok){ g.save(); g.fillStyle = '#2fa84f'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(b.cx, b.y - 14, 12, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(b.cx - 6, b.y - 14); g.lineTo(b.cx - 1, b.y - 9); g.lineTo(b.cx + 7, b.y - 19); g.stroke(); g.restore(); } }
    C.forEach((c, i) => { if(c.st === 'fly'){ const b = CO[i]; g.save(); g.translate(c.x, c.y); g.rotate(c.rot); g.drawImage(IMGC[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); } });
    fx.draw(g);
    if(!fin.on) hud2(g, '🔺 ' + next + '/5  ✖ ' + err, '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !started) hint(g, t('fuehrerschein.hint'), tt, 440, 10);
    fin.draw(g, dt, 'rgba(60,20,20,', .2); } };
startCard(scene);
window.__fs = { OB, base, S: () => C, get next(){ return next; }, get err(){ return err; } };
