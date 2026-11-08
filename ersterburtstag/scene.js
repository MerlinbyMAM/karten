// 1. Geburtstag: „Entchen-Ständchen“. Fünf gedruckte Quietscheentchen schwimmen im Planschbecken.
// Jedes Antippen lässt ein Entchen hüpfen und spielt den nächsten Ton von „Happy Birthday“ – egal welches. Ohne Punkte.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'ente1', x: 182, y: 348, w: 64, h: 62, cx: 215.0, cy: 383.7, px: 175.5, py: 346, pw: 77, ph: 71 },
  { n: 'ente2', x: 298, y: 346, w: 64, h: 58, cx: 329.1, cy: 378.5, px: 293, py: 342.5, pw: 74.5, ph: 68 },
  { n: 'ente3', x: 150, y: 425, w: 72, h: 61, cx: 187.7, cy: 457.0, px: 146, py: 417.5, pw: 81, ph: 74.5 },
  { n: 'ente4', x: 340, y: 410, w: 64, h: 58, cx: 371.7, cy: 441.5, px: 334, py: 404, pw: 78.5, ph: 72 },
  { n: 'ente5', x: 258, y: 445, w: 68, h: 58, cx: 290.8, cy: 475.9, px: 252, py: 437, pw: 80.5, ph: 73.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const F = { C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G4: 392, A4: 440, B4: 493.9, G5: 784 };
const SONG = ['G4','G4','A4','G4','C5','B4','G4','G4','A4','G4','D5','C5','G4','G4','G5','E5','C5','B4','A4','F5','F5','E5','C5','D5','C5'];
const CANDLE = { x: 483, y: 432 };
let S, fx, fin, tt, n, over, rings;
const scene = {
  title: t('ersterburtstag.title'), subtitle: t('ersterburtstag.sub'), emoji: '🐥', accent: '#ffe27a', button: '#5a9ad0', bg: '#4a8ac0',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(() => ({ st: 'swim', t: 0 })); tt = 0; n = 0; over = false; rings = []; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; let bi = -1, bd = 55;
    OB.forEach((b, i) => { const d = Math.hypot(x - b.cx, y - b.cy); if(d < bd){ bd = d; bi = i; } });
    if(bi < 0) return; const s = S[bi]; s.st = 'jump'; s.t = 0;
    const note = SONG[n]; ctx.tone(F[note], 0, .38, 'triangle', .1); ctx.tone(F[note]*2, 0, .12, 'sine', .03); n++;
    fx.pop(OB[bi].cx, OB[bi].y - 18, '♪', ['#ff8ab0', '#8ac8ff', '#ffb24a', '#7ad07a'][n % 4], 30);
    if(n === SONG.length) this.finish(ctx); },
  update(dt, ctx){ tt += dt; fx.update(dt); rings = rings.filter(r => (r.t += dt) < 1.2);
    S.forEach((s, i) => { s.t += dt; if(s.st === 'jump' && s.t >= .45){ s.st = 'swim'; s.t = 0; rings.push({ x: OB[i].cx, y: OB[i].y + OB[i].h*.85, t: 0 }); fx.burst(OB[i].cx, OB[i].y + OB[i].h*.8, 6, ['#ffffff', '#bfe9f5'], 90, 300, 3); } }); },
  finish(ctx){ over = true;
    for(let k = 0; k < 4; k++) setTimeout(() => fx.burst(CANDLE.x, CANDLE.y, 22, ['#ffe27a', '#ff8ab0', '#8ac8ff', '#ffffff'], 300, 260, 6), 300 + k*350);
    setTimeout(() => fin.start(ctx, greeting('ersterburtstag'), [t('ersterburtstag.line')], null), 1900); },
  draw(g, ctx){ const dt = 1/60;
    for(const r of rings){ const u = r.t/1.2; g.save(); g.strokeStyle = `rgba(255,255,255,${.85*(1 - u)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(r.x, r.y, 14 + u*40, (14 + u*40)*.32, 0, 0, 7); g.stroke(); g.restore(); }
    S.forEach((s, i) => { const b = OB[i]; if(!IMG[i].spr.complete) return;
      let dy = Math.sin(tt*2.2 + i*1.3)*1.5, rot = Math.sin(tt*1.7 + i)*.03, sx = 1, sy = 1;
      if(s.st === 'jump'){ const u = s.t/.45; dy = -Math.sin(u*Math.PI)*34; rot = Math.sin(u*Math.PI*2)*.25; sx = u < .15 ? 1.12 : 1; sy = u < .15 ? .88 : 1; if(IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
      else if(IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph);
      g.save(); g.translate(b.cx, b.y + b.h + dy); g.rotate(rot); g.scale(sx, sy); g.drawImage(IMG[i].spr, b.x - b.cx, -b.h, b.w, b.h); g.restore(); });
    if(over){ const k = .6 + .4*Math.sin(tt*9); g.save(); g.globalAlpha = k; const r = g.createRadialGradient(CANDLE.x, CANDLE.y, 2, CANDLE.x, CANDLE.y, 40); r.addColorStop(0, 'rgba(255,240,170,1)'); r.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = r; g.beginPath(); g.arc(CANDLE.x, CANDLE.y, 40, 0, 7); g.fill(); g.restore(); }
    fx.draw(g);
    if(!fin.on){ const w = 260, x0 = 300 - w/2; g.save(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.roundRect(x0 - 6, 770 - 10, w + 12, 20, 10); g.fill(); g.fillStyle = '#ffd23a'; g.beginPath(); g.roundRect(x0, 770 - 5, w*n/SONG.length, 10, 5); g.fill(); g.restore(); }
    if(!fin.on && n === 0) hint(g, t('ersterburtstag.hint'), tt, 560, 10);
    fin.draw(g, dt, 'rgba(60,110,170,', .18); } };
startCard(scene);
window.__eg = { OB, get n(){ return n; } };
