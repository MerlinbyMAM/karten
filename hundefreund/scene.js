// Hundefreund: „Stöckchen werfen“. Gedrucktes Stöckchen wegwischen – der gedruckte Golden Retriever rennt los, holt es und bringt es zurück. 5 Würfe, weitester zählt.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'hund', x: 334, y: 428, w: 266, h: 358, cx: 449.1, cy: 624.8, px: 330, py: 423, pw: 270, ph: 372 },
  { n: 'stock', x: 24, y: 710, w: 228, h: 92, cx: 129.4, cy: 758.9, px: 19, py: 708, pw: 237, ph: 103 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const DOG = 0, ST = 1, HOME = { x: ctr(0).x, y: OB[0].y + OB[0].h }, SH = ctr(1);
const sc = fy => Math.max(.38, Math.min(1, .38 + (fy - 470)/290*.62));
let dog, stick, phase, throws, bestM, last, fx, fin, tt, held, track, moved;
const scene = {
  title: t('hundefreund.title'), subtitle: t('hundefreund.sub'), emoji: '🐕', accent: '#ffe08a', button: '#4a8a3a', bg: '#3a6a2a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ dog = { x: HOME.x, y: HOME.y, dir: 1, run: 0, carry: false }; stick = { x: SH.x, y: SH.y, r: 0, s: 1 }; phase = 'ready'; throws = 0; bestM = 0; last = 0; tt = 0; held = false; moved = false; fx.clear(); fin.stop(); },
  onTap(x, y){ if(phase !== 'ready') return; if(Math.hypot(x - stick.x, y - stick.y) < 110){ held = true; track = [[x, y, performance.now()]]; } },
  onDrag(x, y){ if(held){ track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); stick.x += (x - stick.x)*.5; stick.y += (y - stick.y)*.5; } },
  onRelease(ctx){ if(!held) return; held = false; const f = flick(track); if(f.vy > -200){ stick.x = SH.x; stick.y = SH.y; return; }
    const p = Math.min(1, -f.vy/1800); stick.tx = Math.max(40, Math.min(560, stick.x + f.vx*.25)); stick.ty = Math.max(485, 760 - p*270); stick.x0 = stick.x; stick.y0 = stick.y; stick.t = 0;
    phase = 'fly'; throws++; moved = true; ctx.tone(500, 0, .12, 'sine', .05); ctx.tone(220, .05, .2, 'triangle', .06); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'fly'){ stick.t += dt; const u = Math.min(1, stick.t/.7); stick.x = stick.x0 + (stick.tx - stick.x0)*u; stick.y = stick.y0 + (stick.ty - stick.y0)*u - Math.sin(u*Math.PI)*160; stick.s = 1 - .55*u*(1 - sc(stick.ty)); stick.r += dt*9;
      if(u >= 1){ stick.r = .3; stick.s = sc(stick.ty); phase = 'run'; last = Math.round((HOME.y - stick.ty)/7 + Math.abs(stick.tx - HOME.x)/14); fx.burst(stick.x, stick.y, 8, ['#c8e08a', '#8a6a3a'], 90, 300, 3);
        ctx.tone(330, 0, .08, 'square', .05); ctx.tone(330, .12, .08, 'square', .05); fx.pop(HOME.x - 60, HOME.y - 260, t('hundefreund.wuff'), '#ffffff', 30); } }
    if(phase === 'run' || phase === 'back'){ const tx = phase === 'run' ? stick.x : HOME.x, ty = phase === 'run' ? stick.y : HOME.y, dx = tx - dog.x, dy = ty - dog.y, d = Math.hypot(dx, dy), sp = 420*dt;
      dog.run += dt; if(Math.abs(dx) > 4) dog.dir = dx > 0 ? -1 : 1;
      if(d <= sp){ dog.x = tx; dog.y = ty; if(phase === 'run'){ phase = 'back'; dog.carry = true; ctx.tone(660, 0, .1, 'triangle', .06); }
        else { phase = 'ret'; dog.carry = false; dog.dir = 1; stick.x = HOME.x - 70; stick.y = HOME.y - 20; stick.s = 1; stick.r = 0; stick.t = 0; if(last > bestM) bestM = last;
          fx.pop(HOME.x, HOME.y - 330, last + ' m', '#ffe08a', 34); ctx.tone(784, 0, .2, 'triangle', .08); } }
      else { dog.x += dx/d*sp; dog.y += dy/d*sp; }
      if(dog.carry){ const s = sc(dog.y); stick.x = dog.x - dog.dir*95*s; stick.y = dog.y - 300*s; stick.s = s*.55; stick.r = 0; } }
    if(phase === 'ret'){ stick.t += dt; const u = Math.min(1, stick.t/.6); stick.x = HOME.x - 70 + (SH.x - HOME.x + 70)*u; stick.y = HOME.y - 20 + (SH.y - HOME.y + 20)*u; if(u >= 1){ stick.x = SH.x; stick.y = SH.y; if(throws >= 5) this.finish(ctx); else phase = 'ready'; } } },
  finish(ctx){ phase = 'end'; const b = best('hundefreund', bestM, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('hundefreund'), [t('hundefreund.line'), t('hundefreund.score', { n: bestM }) + (b.isNew && bestM ? '  ★' : '') + '  ·  ' + t('hundefreund.best', { n: b.best })], MEL.birthday), 500); },
  draw(g, ctx){ const dt = 1/60;
    if(moved){ hole(g, ST); if(dog.x !== HOME.x || dog.y !== HOME.y || phase === 'run') hole(g, DOG); }
    const s = sc(dog.y), bob = (phase === 'run' || phase === 'back') ? Math.abs(Math.sin(dog.run*14))*8*s : 0;
    const drawDog = () => { if(!(dog.x === HOME.x && dog.y === HOME.y) || phase === 'run') spr(g, DOG, dog.x, dog.y - OB[0].h/2*s - bob, s, (phase === 'run' || phase === 'back') ? Math.sin(dog.run*14)*.05 : 0, 1, dog.dir); };
    const drawStick = () => { if(moved || held) spr(g, ST, stick.x, stick.y, stick.s, stick.r); };
    if(stick.y < dog.y && !dog.carry){ drawStick(); drawDog(); } else { drawDog(); drawStick(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🦴 ' + throws + '/5', '📏 ' + bestM + ' m', 846);
    if(!fin.on && throws === 0 && phase === 'ready') hint(g, t('hundefreund.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(30,60,20,', .2); } };
startCard(scene);
window.__hd = { OB, get phase(){ return phase; }, get throws(){ return throws; }, get stick(){ return stick; }, get best(){ return bestM; } };
