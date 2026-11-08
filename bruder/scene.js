// Bruder: „Elfmeter“. Gedruckter Ball auf dem Punkt, gedruckter Torwart im Tor. Ball per Wisch schießen –
// der Torwart hechtet in eine Ecke. 5 Schüsse, Tore zählen, Rekord.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'ball', x: 238, y: 632, w: 124, h: 124, cx: 299.7, cy: 693.0, px: 232, py: 628, pw: 135.5, ph: 129 },
  { n: 'torwart', x: 251.5, y: 461, w: 101, h: 125.5, cx: 302.0, cy: 523.8, px: 246, py: 455, pw: 112, ph: 137 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const BALL = OB[0], KEEP = OB[1], GOAL = { x0: 156, x1: 462, y0: 446, y1: 570 }, SHOTS = 5;
let ball, kp, shots, goals, phase, pt, fx, fin, tt, track, held, net, over;
const scene = {
  title: t('bruder.title'), subtitle: t('bruder.sub'), emoji: '⚽', accent: '#ffe27a', button: '#1f6a2a', bg: '#164a1e',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ shots = 0; goals = 0; over = false; tt = 0; fx.clear(); fin.stop(); this.reset(); },
  reset(){ ball = { x: BALL.cx, y: BALL.cy, s: 1, moved: shots > 0 }; kp = { dx: 0, dir: 0, t: 0, moved: shots > 0 }; phase = 'ready'; pt = 0; held = false; net = 0; },
  onTap(x, y){ if(phase !== 'ready' || over) return; if(Math.hypot(x - ball.x, y - ball.y) < 90){ held = true; track = [[x, y, performance.now()]]; } },
  onDrag(x, y){ if(held){ track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); } },
  onRelease(ctx){ if(!held) return; held = false; const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], dtm = Math.max(16, b[2] - a[2]);
    const vx = (b[0] - a[0])/dtm*1000, vy = (b[1] - a[1])/dtm*1000; if(vy > -250) return;
    const pw = Math.min(1, -vy/1700); ball.tx = 300 + vx*.3; ball.ty = GOAL.y1 + 4 - pw*150; ball.x0 = ball.x; ball.y0 = ball.y; ball.moved = true; kp.moved = true;
    const side = ball.tx < 270 ? -1 : ball.tx > 330 ? 1 : 0, r = Math.random(); kp.dir = r < .4 ? side : r < .7 ? -side || 1 : 0; kp.t = 0;
    phase = 'fly'; pt = 0; shots++; ctx.tone(120, 0, .12, 'square', .08); ctx.noise(0, .08, .2, 900); },
  update(dt, ctx){ tt += dt; fx.update(dt); pt += dt; net = Math.max(0, net - dt*1.5); if(kp.moved && phase !== 'ready') kp.t += dt;
    const ke = Math.min(1, kp.t/.35); kp.dx = kp.dir*100*ke;
    if(phase === 'fly'){ const u = Math.min(1, pt/.5); ball.x = ball.x0 + (ball.tx - ball.x0)*u; ball.y = ball.y0 + (ball.ty - ball.y0)*u - Math.sin(u*Math.PI)*25; ball.s = 1 - .58*u;
      if(u >= 1){ const kx = KEEP.cx + kp.dx, ky = KEEP.cy - 12*Math.abs(kp.dir), out = ball.tx < GOAL.x0 || ball.tx > GOAL.x1 || ball.ty < GOAL.y0, saved = !out && Math.hypot((ball.tx - kx)*.9, ball.ty - ky) < 62;
        if(out){ phase = 'miss'; fx.pop(ball.x, ball.y - 40, t('bruder.daneben'), '#ffe0e0', 28); ctx.tone(200, 0, .3, 'sine', .07); }
        else if(saved){ phase = 'saved'; ball.vx = (ball.x - kx)*3; ball.vy = 260; fx.pop(ball.x, ball.y - 50, t('bruder.gehalten'), '#ffe0e0', 28); ctx.tone(160, 0, .1, 'square', .07); }
        else { phase = 'goal'; goals++; net = 1; ctx.noise(0, 1.2, .18, 400); ctx.tone(523, .1, .2, 'triangle', .09); ctx.tone(784, .25, .3, 'triangle', .09);
          fx.burst(ball.x, ball.y, 26, ['#ffe27a', '#ffffff', '#3fbf5f'], 280, 300, 5); fx.pop(300, 400, t('bruder.tor'), '#ffffff', 44); }
        pt = 0; } }
    if(phase === 'saved'){ ball.x += ball.vx*dt; ball.y += ball.vy*dt; ball.s = Math.min(.8, ball.s + dt*.6); }
    if((phase === 'miss' || phase === 'saved' || phase === 'goal') && pt > 1.4){ if(shots >= SHOTS) this.finish(ctx); else this.reset(); } },
  finish(ctx){ over = true; phase = 'end'; const b = best('bruder', goals, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('bruder'), [t('bruder.line'), t('bruder.score', { n: goals }) + (b.isNew && goals ? '  ★' : '') + '  ·  ' + t('bruder.best', { n: b.best })], MEL.birthday), 400); },
  draw(g, ctx){ const dt = 1/60;
    if(kp.moved && IMG[1].bg.complete) g.drawImage(IMG[1].bg, KEEP.px, KEEP.py, KEEP.pw, KEEP.ph);
    if(ball.moved && IMG[0].bg.complete) g.drawImage(IMG[0].bg, BALL.px, BALL.py, BALL.pw, BALL.ph);
    if(net > 0){ g.save(); g.globalAlpha = net*.7; g.strokeStyle = '#ffffff'; g.lineWidth = 2; for(let k = 0; k < 4; k++){ g.beginPath(); g.ellipse(ball.tx, ball.ty, 20 + k*12 + (1 - net)*20, 10 + k*6, 0, 0, 7); g.stroke(); } g.restore(); }
    const drawBall = () => { if(phase === 'end' || !IMG[0].spr.complete) return; g.save(); g.globalAlpha = phase === 'miss' || phase === 'saved' ? Math.max(0, 1 - pt/1.2) : 1; g.translate(ball.x, ball.y); g.rotate(phase === 'fly' ? pt*12 : 0); g.scale(ball.s, ball.s); g.drawImage(IMG[0].spr, BALL.x - BALL.cx, BALL.y - BALL.cy, BALL.w, BALL.h); g.restore(); };
    const drawKeeper = () => { if(!IMG[1].spr.complete) return; const e = Math.min(1, kp.t/.35); g.save(); g.translate(KEEP.cx + kp.dx, KEEP.y + KEEP.h - Math.sin(e*Math.PI)*18*Math.abs(kp.dir)); g.rotate(kp.dir*1.1*e); g.drawImage(IMG[1].spr, KEEP.x - KEEP.cx, -KEEP.h, KEEP.w, KEEP.h); g.restore(); };
    if(phase === 'goal'){ drawBall(); drawKeeper(); } else { drawKeeper(); drawBall(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '⚽ ' + goals + '/' + shots, t('bruder.schuss', { n: Math.min(shots + (phase === 'ready' ? 1 : 0), SHOTS) }), 846);
    if(!fin.on && shots === 0 && phase === 'ready') hint(g, t('bruder.hint'), tt, 610, 99);
    fin.draw(g, dt, 'rgba(10,50,20,', .2); } };
startCard(scene);
window.__br = { OB, get phase(){ return phase; }, get goals(){ return goals; }, get shots(){ return shots; } };
