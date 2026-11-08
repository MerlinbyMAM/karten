// Katzen-Geburtstag: „Mäuse-Jagd“. Aus den gedruckten Geschenken springen Mäuse – schnell antippen, bevor sie wieder verschwinden! 25 Sekunden.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'geschenk1', x: 10, y: 598, w: 126, h: 150, cx: 75.3, cy: 672.0, px: 12, py: 595.5, pw: 126, ph: 152.5 },
  { n: 'geschenk2', x: 128, y: 618, w: 114, h: 150, cx: 185.0, cy: 688.5, px: 127.5, py: 617, pw: 115, ph: 143 },
  { n: 'geschenk3', x: 243, y: 622, w: 119, h: 146, cx: 301.4, cy: 695.0, px: 241.5, py: 622.5, pw: 120, ph: 145.5 },
  { n: 'geschenk4', x: 362, y: 618, w: 116, h: 144, cx: 419.7, cy: 691.6, px: 361, py: 618.5, pw: 119, ph: 146 },
  { n: 'geschenk5', x: 468, y: 598, w: 124, h: 154, cx: 529.1, cy: 675.4, px: 470, py: 600.5, pw: 120.5, ph: 148.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const DUR = 25;
let mice, t0, caught, escaped, fx, fin, tt, phase, spawn, lid;
function mouse(g, x, y, s, a){ g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#c0a0a8'; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 8); g.quadraticCurveTo(38, 20, 30, -6); g.stroke();
  g.fillStyle = '#9a9aa6'; g.beginPath(); g.ellipse(0, 6, 22, 15, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-16, -6, 13, 11, 0, 0, 7); g.fill();
  g.fillStyle = '#ffc0cc'; for(const ex of [-24, -10]){ g.beginPath(); g.arc(ex, -16, 7, 0, 7); g.fill(); }
  g.fillStyle = '#222'; g.beginPath(); g.arc(-21, -7, 2.2, 0, 7); g.fill(); g.fillStyle = '#ff8aa0'; g.beginPath(); g.arc(-29, -3, 3, 0, 7); g.fill(); g.restore(); }
const scene = {
  title: t('miautag.title'), subtitle: t('miautag.sub'), emoji: '🐭', accent: '#ffd0e0', button: '#d070a0', bg: '#a05080',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ mice = []; caught = 0; escaped = 0; tt = 0; phase = 'ready'; spawn = 0; lid = OB.map(() => 0); fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; t0 = tt; return; } if(phase !== 'play') return;
    for(const m of mice){ if(m.st !== 'up') continue; if(Math.hypot(x - m.x, y - (m.y - m.h)) < 48){ m.st = 'hit'; m.t = 0; caught++; ctx.tone(1400, 0, .06, 'square', .05); ctx.tone(1800, .05, .08, 'square', .04); fx.burst(m.x, m.y - m.h, 14, ['#ffd0e0', '#ffffff', '#ffe27a'], 200, 300, 4); fx.pop(m.x, m.y - m.h - 50, t('miautag.quiek'), '#ffffff', 26); return; } } },
  update(dt, ctx){ tt += dt; fx.update(dt); lid = lid.map(v => Math.max(0, v - dt*3));
    if(phase === 'play'){ const left = DUR - (tt - t0); spawn -= dt;
      if(spawn <= 0 && left > .8){ const free = OB.map((b, i) => i).filter(i => !mice.some(m => m.i === i && m.st !== 'gone')); if(free.length){ const i = free[Math.floor(Math.random()*free.length)], b = OB[i];
        mice.push({ i, x: b.x + b.w/2, y: b.y + 18, h: 0, st: 'up', t: 0, life: Math.max(.6, 1.3 - (tt - t0)*.025) }); lid[i] = 1; ctx.tone(500, 0, .05, 'triangle', .04); } spawn = Math.max(.35, .9 - (tt - t0)*.02); }
      for(const m of mice){ m.t += dt; if(m.st === 'up'){ m.h = Math.min(1, m.t/.15)*44; if(m.t > m.life){ m.st = 'down'; m.t = 0; escaped++; } }
        if(m.st === 'down'){ m.h = Math.max(0, 44 - m.t*300); if(m.h <= 0) m.st = 'gone'; } if(m.st === 'hit' && m.t > .4) m.st = 'gone'; }
      mice = mice.filter(m => m.st !== 'gone'); if(left <= 0) this.finish(ctx); } },
  finish(ctx){ phase = 'end'; const b = best('miautag', caught, true);
    ctx.melody([['C6', .25], ['G5', .25], ['E5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('miautag'), [t('miautag.line'), t('miautag.score', { n: caught }) + (b.isNew && caught ? '  ★' : '') + '  ·  ' + t('miautag.best', { n: b.best })], MEL.birthday), 600); },
  draw(g, ctx){ const dt = 1/60;
    for(const m of mices()){ const b = OB[m.i]; g.save(); g.beginPath(); g.rect(b.x - 20, 0, b.w + 40, b.y + 22); g.clip(); mouse(g, m.x, m.y - m.h + 10, 1, m.st === 'hit' ? 1 - m.t/.4 : 1); g.restore(); }
    OB.forEach((b, i) => { if(lid[i] > 0) spr(g, i, b.x + b.w/2, b.y + b.h/2 - Math.sin(lid[i]*Math.PI)*8, 1 + .04*Math.sin(lid[i]*Math.PI), Math.sin(lid[i]*20)*.03); });
    fx.draw(g);
    if(!fin.on) hud2(g, '🐭 ' + caught, '⏱ ' + (phase === 'play' ? Math.max(0, Math.ceil(DUR - (tt - t0))) : DUR) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('miautag.hint'), tt, 560, 99);
    fin.draw(g, dt, 'rgba(120,50,90,', .18); } };
function mices(){ return mice; }
startCard(scene);
window.__kg = { OB, get mice(){ return mice; }, get caught(){ return caught; }, get phase(){ return phase; } };
