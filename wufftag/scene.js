// Hunde-Geburtstag: „Leckerli-Regen“. Leckerli fallen vom Himmel – antippen, dann fliegen sie in den gedruckten Napf. Die drei gedruckten Knochen sind die ersten. Der Dackel freut sich bei jedem Treffer.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'napf', x: 300, y: 660, w: 172, h: 112, cx: 384.3, cy: 717.5, px: 298.5, py: 660, pw: 172.5, ph: 112.5 },
  { n: 'knochen1', x: 60, y: 698, w: 128, h: 84, cx: 122.4, cy: 738.1, px: 54, py: 689, pw: 141, ph: 98.5 },
  { n: 'knochen2', x: 452, y: 628, w: 116, h: 74, cx: 511.7, cy: 666.2, px: 449, py: 624, pw: 125.5, ph: 84 },
  { n: 'knochen3', x: 418, y: 738, w: 134, h: 88, cx: 485.0, cy: 782.9, px: 415, py: 729.5, pw: 145.5, ph: 105.5 },
  { n: 'dackel', x: 160, y: 292, w: 232, h: 352, cx: 286.4, cy: 501.1, px: 161, py: 289.5, pw: 232.5, ph: 357 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const NAPF = 0, DACK = 4, BOWL = { x: ctr(0).x, y: OB[0].y + OB[0].h*.32 }, TOTAL = 20;
let bones, spawn, made, n, missed, fx, fin, tt, wag, over, started;
const scene = {
  title: t('wufftag.title'), subtitle: t('wufftag.sub'), emoji: '🐶', accent: '#ffd36a', button: '#c0392b', bg: '#8a3a2a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ bones = [1, 2, 3].map(i => ({ i, src: i, x: ctr(i).x, y: ctr(i).y, st: 'print', vy: 0, r: 0 })); spawn = 0; made = 0; n = 3; missed = 0; tt = 0; wag = 0; over = false; started = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; let bi = null, bd = 70;
    for(const b of bones){ if(b.st !== 'print' && b.st !== 'fall') continue; const d = Math.hypot(x - b.x, y - b.y); if(d < bd){ bd = d; bi = b; } }
    if(!bi) return; started = true; bi.st = 'toss'; bi.t = 0; bi.x0 = bi.x; bi.y0 = bi.y; ctx.tone(700, 0, .08, 'sine', .05); },
  update(dt, ctx){ tt += dt; fx.update(dt); wag = Math.max(0, wag - dt*2.5);
    if(started && !over && n < TOTAL){ spawn -= dt; if(spawn <= 0){ spawn = Math.max(.55, 1.2 - n*.03); n++; bones.push({ i: 1 + (n % 3), x: 50 + Math.random()*500, y: -30, st: 'fall', vy: 90 + n*7, r: Math.random()*6, vr: (Math.random() - .5)*4 }); } }
    for(const b of bones){
      if(b.st === 'fall'){ b.y += b.vy*dt; b.r += b.vr*dt; if(b.y > 840){ b.st = 'gone'; missed++; ctx.tone(160, 0, .12, 'sine', .05); fx.burst(b.x, 840, 6, ['#c89a5a'], 80, 400, 3); } }
      if(b.st === 'toss'){ b.t += dt; const u = Math.min(1, b.t/.55); b.x = b.x0 + (BOWL.x - b.x0)*u; b.y = b.y0 + (BOWL.y - b.y0)*u - Math.sin(u*Math.PI)*120; b.r += dt*10;
        if(u >= 1){ b.st = 'gone'; made++; wag = 1; ctx.tone(523 + (made % 8)*60, 0, .12, 'triangle', .08); ctx.tone(330, .08, .06, 'square', .04); fx.burst(BOWL.x, BOWL.y, 10, ['#ffd36a', '#ffffff', '#c89a5a'], 140, 300, 4); if(made % 5 === 0) fx.pop(BOWL.x, BOWL.y - 70, t('wufftag.wuff'), '#ffffff', 30); } } }
    if(!over && started && n >= TOTAL && !bones.some(b => b.st === 'fall' || b.st === 'toss' || b.st === 'print')) this.finish(ctx); },
  finish(ctx){ over = true; const b = best('wufftag', made, true);
    ctx.melody([['G5', .25], ['E5', .25], ['C5', .25], ['G5', .5], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('wufftag'), [t('wufftag.line'), t('wufftag.score', { n: made, m: TOTAL }) + (b.isNew && made ? '  ★' : '')], MEL.birthday), 700); },
  draw(g, ctx){ const dt = 1/60;
    for(const b of bones){ if(b.src && b.st !== 'print') hole(g, b.src); }
    if(wag > 0){ const d = OB[DACK], s = 1 + .05*Math.sin(wag*Math.PI); spr(g, DACK, d.x + d.w/2, d.y + d.h/2 - Math.sin(wag*Math.PI)*12, s, Math.sin(wag*30)*.04); }
    for(const b of bones){ if(b.st === 'fall' || b.st === 'toss' || (b.st === 'print' && false)) spr(g, b.i, b.x, b.y, b.st === 'toss' ? .75 : .7, b.r); }
    for(const b of bones){ if(b.st === 'print' && !started){ const k = .3 + .3*Math.sin(tt*4 + b.i); g.save(); g.strokeStyle = `rgba(255,240,180,${k})`; g.lineWidth = 3; g.beginPath(); g.ellipse(b.x, b.y, 62, 36, 0, 0, 7); g.stroke(); g.restore(); } }
    fx.draw(g);
    if(!fin.on) hud2(g, '🦴 ' + made + '/' + TOTAL, '💨 ' + missed, 846);
    if(!fin.on && !started) hint(g, t('wufftag.hint'), tt, 560, 99);
    fin.draw(g, dt, 'rgba(80,30,20,', .2); } };
startCard(scene);
window.__hg = { OB, get bones(){ return bones; }, get made(){ return made; }, get over(){ return over; } };
