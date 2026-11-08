// Ski: „Slalom-König“ – den gedruckten Skifahrer mit dem Finger nach links und rechts steuern, durch die Tore fahren und den Tannen ausweichen. 25 Tore.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'skier', x: 232, y: 592, w: 132, h: 156, cx: 305.5, cy: 684.0, px: 231, py: 592.5, pw: 136.5, ph: 165 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const SK = 0, SC = ctr(0), TOTAL = 25;
let fx, fin, tt, phase, x, tx, vx, objs, spawned, nextT, gates, missed, crash, moved, speed, trail;
const scene = {
  title: t('ski.title'), subtitle: t('ski.sub'), emoji: '⛷️', accent: '#9ad8ff', button: '#1d3a8a', bg: '#22324a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; x = SC.x; tx = x; vx = 0; objs = []; spawned = 0; nextT = 0; gates = 0; missed = 0; crash = 0; moved = false; speed = 260; trail = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(px, py, ctx){ if(phase === 'end') return; if(phase === 'ready'){ phase = 'run'; moved = true; ctx.noise(0, .4, .08, 2500); } tx = Math.max(60, Math.min(540, px)); },
  onDrag(px){ if(phase === 'run') tx = Math.max(60, Math.min(540, px)); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'run'){ const nx = x + (tx - x)*Math.min(1, dt*7); vx = (nx - x)/dt; x = nx; speed = Math.min(420, speed + dt*6);
      if(crash > 0) crash -= dt;
      nextT -= dt; if(nextT <= 0 && spawned < TOTAL){ const gx = 130 + Math.random()*340, w = 150 - spawned*2; objs.push({ k: 'g', x: gx, w, y: 930, done: false, c: spawned % 2 ? '#2a6aff' : '#ff3a2a' }); spawned++;
        if(Math.random() < .7){ const side = gx < 300 ? 1 : -1; objs.push({ k: 't', x: gx + side*(w/2 + 70 + Math.random()*80), y: 930 + 80 + Math.random()*80, done: false }); }
        nextT = 1.25 - spawned*.012; }
      for(const o of objs){ o.y -= speed*dt;
        if(!o.done && o.y < SC.y){ o.done = true;
          if(o.k === 'g'){ if(Math.abs(x - o.x) < o.w/2){ gates++; fx.pop(o.x, SC.y - 60, '✔', '#b9ff9a', 30); ctx.tone(660 + gates*10, 0, .08, 'triangle', .05); } else { missed++; fx.pop(o.x, SC.y - 60, t('ski.verpasst'), '#ffd0c8', 24); ctx.tone(200, 0, .12, 'sine', .05); } }
          else if(Math.abs(x - o.x) < 34 && crash <= 0){ crash = .9; speed = 200; fx.burst(x, SC.y, 22, ['#ffffff', '#dff2ff'], 260, 400, 5); fx.shake(8); fx.pop(x, SC.y - 70, t('ski.sturz'), '#ffffff', 28); ctx.noise(0, .4, .25, 900); } } }
      objs = objs.filter(o => o.y > 250);
      if(Math.random() < .6) trail.push({ x, y: SC.y + 60, a: 1 }); for(const p of trail){ p.y -= speed*dt; p.a -= dt*.6; } trail = trail.filter(p => p.a > 0 && p.y > 300);
      if(spawned >= TOTAL && !objs.some(o => !o.done)) this.finish(ctx); } },
  finish(ctx){ phase = 'end'; const b = best('ski', gates, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('ski'), [t('ski.line'), t('ski.score', { n: gates, m: TOTAL }) + (b.isNew && gates ? '  ★' : '') + '  ·  ' + t('ski.best', { n: b.best })], MEL.birthday), 400); },
  tree(g, x, y){ g.save(); g.fillStyle = 'rgba(90,110,140,.25)'; g.beginPath(); g.ellipse(x + 10, y + 34, 26, 8, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a1a'; g.fillRect(x - 4, y + 18, 8, 16);
    for(let i = 0; i < 3; i++){ g.fillStyle = ['#1f5a3a', '#2a6a44', '#33784c'][i]; g.beginPath(); g.moveTo(x, y - 44 + i*16); g.lineTo(x - 26 + i*4, y + 22 - i*6); g.lineTo(x + 26 - i*4, y + 22 - i*6); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(x, y - 44 + i*16); g.lineTo(x - 8, y - 30 + i*16); g.lineTo(x + 8, y - 30 + i*16); g.closePath(); g.fill(); } g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    if(moved) hole(g, SK);
    for(const p of trail){ g.fillStyle = `rgba(150,180,215,${p.a*.4})`; g.fillRect(p.x - 8, p.y, 3, 4); g.fillRect(p.x + 6, p.y, 3, 4); }
    const fade = o => Math.min(1, (o.y - 250)/120);
    for(const o of objs){ g.save(); g.globalAlpha = fade(o);
      if(o.k === 'g'){ for(const s of [-1, 1]){ const px = o.x + s*o.w/2; g.strokeStyle = o.c; g.lineWidth = 4; g.beginPath(); g.moveTo(px, o.y); g.lineTo(px, o.y - 46); g.stroke(); g.fillStyle = o.c; g.beginPath(); g.moveTo(px, o.y - 46); g.lineTo(px - s*24, o.y - 38); g.lineTo(px, o.y - 30); g.closePath(); g.fill(); }
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(o.x - o.w/2, o.y); g.lineTo(o.x + o.w/2, o.y); g.stroke(); }
      else this.tree(g, o.x, o.y); g.restore(); }
    if(moved && phase !== 'end' || phase === 'end'){ const r = crash > 0 ? Math.sin(crash*14)*.6 : Math.max(-.35, Math.min(.35, vx/900)); spr(g, SK, x, SC.y, 1, r); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🚩 ' + gates + '/' + TOTAL, '❌ ' + missed, 846);
    if(!fin.on && phase === 'ready') hint(g, t('ski.hint'), tt, 480, 99);
    fin.draw(g, dt, 'rgba(30,50,80,', .18); } };
startCard(scene);
window.__sk = { get phase(){ return phase; }, get objs(){ return objs; }, get x(){ return x; }, get gates(){ return gates; } };
