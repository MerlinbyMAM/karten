// Radfahrer: „Bergwertung!“ Abwechselnd links und rechts tippen – wie beim Treten in die Pedale. Im richtigen Rhythmus fliegt das Rad den Pass hinauf, die gedruckten Räder drehen mit. 2 km auf Zeit.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL, cardImg } from '../core/kit.js';
const WH = [[159, 700, 90], [440, 700, 90]], CR = { x: 272, y: 722 }, GOAL = 2000;
let fx, fin, tt, phase, v, dist, time, last, rot, crank, taps, flash;
const grade = d => .4 + .6*Math.sin(Math.min(1, d/GOAL)*Math.PI*.9);
const scene = {
  title: t('rad.title'), subtitle: t('rad.sub'), emoji: '🚴', accent: '#9cf27a', button: '#1d4a8a', bg: '#1e2e44',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; v = 0; dist = 0; time = 0; last = ''; rot = 0; crank = 0; taps = 0; flash = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; if(phase === 'ready') phase = 'ride'; const s = x < 300 ? 'L' : 'R';
    if(s !== last){ v = Math.min(45, v + 2.4 - v*.035); taps++; crank += Math.PI; ctx.tone(s === 'L' ? 330 : 392, 0, .05, 'triangle', .04); }
    else { v = Math.max(0, v - 4); flash = .4; fx.pop(300, 470, t('rad.takt'), '#ffd0c8', 28); ctx.tone(150, 0, .1, 'sine', .05); }
    last = s; },
  update(dt, ctx){ tt += dt; fx.update(dt); if(flash > 0) flash -= dt;
    if(phase === 'ride'){ time += dt; v = Math.max(0, v - dt*(2.2 + grade(dist)*4.5)); dist += v/3.6*dt*12; rot += v*dt*.35;
      if(dist >= GOAL){ dist = GOAL; this.finish(ctx); } }
    if(phase === 'end'){ v = Math.max(0, v - dt*10); rot += v*dt*.35; } },
  finish(ctx){ phase = 'end'; const s = Math.round(time*10)/10, b = best('rad', s, false);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('rad'), [t('rad.line'), t('rad.score', { s: s.toFixed(1) }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('rad.best', { s: Number(b.best).toFixed(1) })], MEL.birthday), 500); },
  draw(g, ctx){ const dt = 1/60;
    if(rot > 0 && cardImg.complete && cardImg.naturalWidth){ const k = cardImg.naturalWidth/600;
      for(const w of WH){ g.save(); g.beginPath(); g.arc(w[0], w[1], w[2], 0, 7); g.arc(w[0], w[1], w[2]*.74, 0, 7, true); g.clip(); g.translate(w[0], w[1]); g.rotate(rot); g.drawImage(cardImg, (w[0] - w[2])*k, (w[1] - w[2])*k, w[2]*2*k, w[2]*2*k, -w[2], -w[2], w[2]*2, w[2]*2); g.restore();
        if(v > 15){ g.save(); g.globalAlpha = Math.min(.45, (v - 15)/40); g.strokeStyle = '#ddd'; g.lineWidth = 2; for(let i = 0; i < 3; i++){ g.beginPath(); g.arc(w[0], w[1], w[2]*(.35 + i*.2), rot*2 + i, rot*2 + i + 1.3); g.stroke(); } g.restore(); } } }
    if(phase !== 'ready'){ const c = crank + (v > 0 ? 0 : 0); g.save(); g.strokeStyle = '#2a2a2a'; g.lineWidth = 7; g.lineCap = 'round'; for(const o of [0, Math.PI]){ const x = CR.x + Math.cos(c + o)*34, y = CR.y + Math.sin(c + o)*34; g.beginPath(); g.moveTo(CR.x, CR.y); g.lineTo(x, y); g.stroke(); g.fillStyle = '#d0d0d0'; g.fillRect(x - 12, y - 4, 24, 8); } g.restore(); }
    if(!fin.on){ const X0 = 70, X1 = 530, Y0 = 380, H = 60; g.save(); g.fillStyle = 'rgba(20,30,50,.55)'; g.beginPath(); g.roundRect(X0 - 16, Y0 - H - 34, X1 - X0 + 32, H + 52, 12); g.fill();
      g.beginPath(); for(let i = 0; i <= 40; i++){ const u = i/40, y = Y0 - H*(1 - Math.cos(u*Math.PI*.9))/1.95; i ? g.lineTo(X0 + (X1 - X0)*u, y) : g.moveTo(X0, y); } g.strokeStyle = '#9cf27a'; g.lineWidth = 3; g.stroke();
      const u = dist/GOAL, mx = X0 + (X1 - X0)*u, my = Y0 - H*(1 - Math.cos(u*Math.PI*.9))/1.95; g.fillStyle = '#ff5a4a'; g.beginPath(); g.arc(mx, my, 7, 0, 7); g.fill();
      g.font = 'bold 18px Georgia'; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(Math.round(v) + ' km/h', X0, Y0 - H - 10); g.textAlign = 'right'; g.fillText((dist/1000).toFixed(2) + ' / 2 km', X1, Y0 - H - 10); g.restore();
      if(phase !== 'end'){ g.save(); g.globalAlpha = .18 + (last === 'R' ? .25 : 0); g.fillStyle = '#fff'; g.fillRect(0, 440, 4, 300); g.globalAlpha = .18 + (last === 'L' ? .25 : 0); g.fillRect(596, 440, 4, 300); g.restore(); } }
    fx.draw(g);
    if(!fin.on) hud2(g, '🚴 ' + Math.round(v), '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('rad.hint'), tt, 500, 99);
    fin.draw(g, dt, 'rgba(20,30,50,', .18); } };
startCard(scene);
window.__ra = { get phase(){ return phase; }, get dist(){ return dist; }, get v(){ return v; }, get time(){ return time; } };
