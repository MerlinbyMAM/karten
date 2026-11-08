// Ehefrau: „Sterne fürs Glas“. Fünf gedruckte Sterne hängen am Nachthimmel. Jeden Stern ins gedruckte Einmachglas ziehen –
// darin leuchten sie weiter. Auf Zeit, Rekord.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'stern1', x: 84, y: 294, w: 68, h: 72, cx: 115.6, cy: 335.0, px: 79, py: 296, pw: 73, ph: 73 },
  { n: 'stern2', x: 189, y: 358, w: 67, h: 74, cx: 220.5, cy: 397.1, px: 184, py: 359.5, pw: 73.5, ph: 71.5 },
  { n: 'stern3', x: 339, y: 362, w: 67, h: 72, cx: 374.3, cy: 403.3, px: 338, py: 365.5, pw: 73, ph: 71.5 },
  { n: 'stern4', x: 429, y: 294, w: 67, h: 72, cx: 462.3, cy: 333.7, px: 426, py: 295.5, pw: 73, ph: 72 },
  { n: 'stern5', x: 491, y: 409, w: 67, h: 72, cx: 524.8, cy: 447.9, px: 488.5, py: 409, pw: 73.5, ph: 73 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const JAR = { x: 410, y: 575, x0: 360, x1: 462, y0: 560, y1: 730 }, SPOTS = [[392, 690], [428, 700], [410, 655], [385, 640], [436, 650]];
let S, fx, fin, tt, time, n, over, held, started;
const scene = {
  title: t('ehefrau.title'), subtitle: t('ehefrau.sub'), emoji: '⭐', accent: '#ffe08a', button: '#2a3a8a', bg: '#141e4a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(b => ({ st: 'home', x: b.cx, y: b.cy, sc: 1, t: 0, moved: false })); tt = 0; time = 0; n = 0; over = false; held = -1; started = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; held = -1; let bd = 55; S.forEach((s, i) => { if(s.st !== 'home' && s.st !== 'back') return; const d = Math.hypot(x - s.x, y - s.y); if(d < bd){ bd = d; held = i; } });
    if(held < 0) return; started = true; const s = S[held]; s.st = 'held'; s.moved = true; s.ox = s.x - x; s.oy = s.y - y; ctx.tone(1318, 0, .15, 'sine', .04); },
  onDrag(x, y){ if(held < 0) return; const s = S[held]; s.x = x + s.ox; s.y = y + s.oy; },
  onRelease(ctx){ if(held < 0) return; const s = S[held], i = held; held = -1;
    if(Math.hypot(s.x - JAR.x, s.y - JAR.y) < 80){ s.st = 'in'; s.t = 0; s.x0 = s.x; s.y0 = s.y; s.slot = SPOTS[n]; n++; ctx.tone([659, 784, 880, 988, 1175][n - 1], 0, .5, 'sine', .07); fx.burst(JAR.x, JAR.y, 12, ['#ffe08a', '#ffffff'], 140, 100, 4);
      if(n === OB.length) setTimeout(() => this.finish(ctx), 700); }
    else { s.st = 'back'; s.t = 0; s.x0 = s.x; s.y0 = s.y; } },
  update(dt, ctx){ tt += dt; fx.update(dt); if(started && !over) time += dt;
    S.forEach((s, i) => { s.t += dt; const b = OB[i];
      if(s.st === 'back'){ const u = Math.min(1, s.t/.4), e = 1 - (1 - u)**3; s.x = s.x0 + (b.cx - s.x0)*e; s.y = s.y0 + (b.cy - s.y0)*e; if(u >= 1) s.st = 'home'; }
      if(s.st === 'in'){ const u = Math.min(1, s.t/.6), e = u*u*(3 - 2*u); s.x = s.x0 + (s.slot[0] - s.x0)*e; s.y = s.y0 + (s.slot[1] - s.y0)*e - Math.sin(u*Math.PI)*30; s.sc = 1 - .5*e; } }); },
  finish(ctx){ over = true; const secs = Math.round(time*10)/10, b = best('ehefrau', secs, false);
    fin.start(ctx, greeting('ehefrau'), [t('ehefrau.line'), t('ehefrau.score', { s: secs }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('ehefrau.best', { s: b.best })], MEL.birthday); },
  draw(g, ctx){ const dt = 1/60;
    S.forEach((s, i) => { const b = OB[i]; if(s.moved && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    if(n){ const a = Math.min(1, n/5)*(.6 + .15*Math.sin(tt*3)); g.save(); g.globalAlpha = a; const r = g.createRadialGradient(JAR.x, 670, 10, JAR.x, 670, 140); r.addColorStop(0, 'rgba(255,230,140,.9)'); r.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = r; g.fillRect(JAR.x - 150, 520, 300, 300); g.restore(); }
    S.forEach((s, i) => { const b = OB[i]; if(!IMG[i].spr.complete || s.st === 'home') return; const tw = s.st === 'in' ? 1 + .08*Math.sin(tt*5 + i) : 1;
      g.save(); g.translate(s.x, s.y); g.scale(s.sc*tw, s.sc*tw); if(s.st === 'held'){ g.shadowColor = '#ffe08a'; g.shadowBlur = 24; } g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); });
    if(held >= 0 && Math.hypot(S[held].x - JAR.x, S[held].y - JAR.y) < 80){ g.save(); g.strokeStyle = 'rgba(255,224,138,.9)'; g.lineWidth = 3; g.beginPath(); g.ellipse(JAR.x, JAR.y, 52, 14, 0, 0, 7); g.stroke(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '⭐ ' + n + '/5', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !started) hint(g, t('ehefrau.hint'), tt, 520, 99);
    fin.draw(g, dt, 'rgba(10,15,50,', .2); } };
startCard(scene);
window.__ef = { OB, JAR, S: () => S, get n(){ return n; } };
