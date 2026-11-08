// Tennis: „Return!“ Bälle fliegen über das Netz auf dich zu – wenn der Ball vorn ankommt, mit einem Wisch nach oben zurückschlagen. Je besser das Timing, desto härter der Return. 15 Bälle.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const HZ = 735, TOTAL = 15;
let fx, fin, tt, phase, ball, n, hits, perf, track, held, nextT, streak;
const scene = {
  title: t('tennis.title'), subtitle: t('tennis.sub'), emoji: '🎾', accent: '#e0ff6a', button: '#2a5a2a', bg: '#2a3a24',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; ball = null; n = 0; hits = 0; perf = 0; held = false; nextT = 0; streak = 0; tt = 0; fx.clear(); fin.stop(); },
  serve(){ n++; const x0 = 230 + Math.random()*140, x1 = 140 + Math.random()*320; ball = { st: 'in', t: 0, x0, x1, dur: 1.25 - Math.min(.45, n*.03), x: x0, y: 470, r: 4 }; },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; nextT = .5; return; } if(phase === 'play'){ held = true; track = [[x, y, performance.now()]]; } },
  onDrag(x, y, ctx){ if(!held) return; track.push([x, y, performance.now()]); if(track.length > 6) track.shift(); const f = flick(track);
    if(f.vy < -500 && ball && ball.st === 'in'){ held = false; const d = Math.abs(ball.y - HZ);
      if(d < 75){ const good = d < 28; ball.st = 'back'; ball.t = 0; ball.bx = ball.x; ball.by = ball.y; ball.tx = 300 + Math.max(-200, Math.min(200, f.vx*.15)); hits++; streak++; if(good) perf++;
        fx.pop(ball.x, ball.y - 60, good ? t('tennis.perfekt') : t('tennis.gut'), good ? '#e0ff6a' : '#ffffff', good ? 32 : 26); fx.burst(ball.x, ball.y, 12, ['#e0ff6a', '#ffffff'], 240, 200, 4);
        ctx.noise(0, .08, .35, 2200); ctx.tone(good ? 880 : 520, 0, .08, 'triangle', .06); }
      else { fx.pop(300, 600, t('tennis.zufrueh'), '#ffd0c8', 26); ctx.tone(200, 0, .1, 'sine', .04); } } },
  onRelease(){ held = false; },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play'){
      if(!ball){ nextT -= dt; if(nextT <= 0){ if(n >= TOTAL){ this.finish(ctx); return; } this.serve(); ctx.noise(0, .06, .2, 2500); } }
      else if(ball.st === 'in'){ ball.t += dt; const u = ball.t/ball.dur; const yy = 470 + (HZ + 30 - 470)*u; ball.x = ball.x0 + (ball.x1 - ball.x0)*u; ball.r = 4 + 16*u*u; ball.y = yy - Math.sin(Math.min(1, u/.7)*Math.PI)*60*(u < .7 ? 1 : 0) - (u > .7 ? Math.sin((u - .7)/.3*Math.PI)*90 : 0);
        if(u > .7 && !ball.bounced){ ball.bounced = true; ctx.tone(260, 0, .05, 'sine', .04); fx.burst(ball.x, ball.y, 4, ['#c86a3a'], 80, 300, 3); }
        if(u >= 1.1){ ball = null; nextT = .8; streak = 0; fx.pop(300, 640, t('tennis.vorbei'), '#ffd0c8', 26); ctx.tone(180, 0, .15, 'sine', .05); } }
      else if(ball.st === 'back'){ ball.t += dt; const u = Math.min(1, ball.t/.7); ball.x = ball.bx + (ball.tx - ball.bx)*u; ball.y = ball.by + (440 - ball.by)*u - Math.sin(u*Math.PI)*140; ball.r = 20 - 16*u;
        if(u >= 1){ fx.burst(ball.x, ball.y + 10, 8, ['#c86a3a', '#e8a070'], 120, 300, 3); ball = null; nextT = .6; } } } },
  finish(ctx){ phase = 'end'; const b = best('tennis', hits, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('tennis'), [t('tennis.line'), t('tennis.score', { n: hits, m: TOTAL }) + (b.isNew && hits ? '  ★' : '') + '  ·  ' + t('tennis.best', { n: b.best })], MEL.birthday), 300); },
  draw(g, ctx){ const dt = 1/60;
    if(phase === 'play'){ g.save(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([8, 8]); g.lineWidth = 2; g.beginPath(); g.ellipse(300, HZ, 260, 26, 0, 0, 7); g.stroke(); g.restore(); }
    if(ball){ g.save(); g.fillStyle = 'rgba(60,30,10,.3)'; const gy = ball.st === 'in' ? 470 + (HZ + 30 - 470)*(ball.t/ball.dur) : ball.y + 30; g.beginPath(); g.ellipse(ball.x, gy + 6, ball.r, ball.r*.35, 0, 0, 7); g.fill();
      const gr = g.createRadialGradient(ball.x - ball.r*.3, ball.y - ball.r*.3, 1, ball.x, ball.y, ball.r); gr.addColorStop(0, '#f8ff9a'); gr.addColorStop(1, '#b8d020'); g.fillStyle = gr; g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = Math.max(1, ball.r/8); g.beginPath(); g.arc(ball.x - ball.r*.9, ball.y, ball.r*.7, -.9, .9); g.stroke(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🎾 ' + hits + '/' + TOTAL, streak > 2 ? '🔥 ' + streak : '⭐ ' + perf, 846);
    if(!fin.on && phase === 'ready') hint(g, t('tennis.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(30,40,20,', .18); } };
function flick(track){ const a = track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000 }; }
startCard(scene);
window.__te = { get phase(){ return phase; }, get ball(){ return ball; }, get hits(){ return hits; }, HZ };
