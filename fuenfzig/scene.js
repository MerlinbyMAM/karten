// 50. Geburtstag: Trickkerzen. Die fünf gedruckten Flammen flackern live. Ein Wisch über eine Flamme pustet sie aus
// (Rauchfaden steigt auf) – aber Trickkerzen zünden sich nach kurzer Zeit wieder an. Ziel: alle fünf gleichzeitig aus.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, rnd, MEL } from '../core/kit.js';

const FL = [
  { n: 'flamme1', x: 193, y: 226, w: 26, h: 54, px: 191, py: 224, pw: 30, ph: 58 },
  { n: 'flamme2', x: 243, y: 226, w: 26, h: 54, px: 241, py: 224, pw: 30, ph: 58 },
  { n: 'flamme3', x: 292, y: 226, w: 26, h: 54, px: 290, py: 224, pw: 30, ph: 58 },
  { n: 'flamme4', x: 342, y: 226, w: 26, h: 54, px: 340, py: 224, pw: 30, ph: 58 },
  { n: 'flamme5', x: 390, y: 226, w: 26, h: 54, px: 388, py: 224, pw: 30, ph: 58 } ];
const IMG = FL.map(f => { const a = new Image(); a.src = f.n + '.png'; const b = new Image(); b.src = f.n + '_platz.png'; return { spr: a, bg: b }; });

let S, smoke, fx, fin, tt, time, over, last, started, breath = 0;
const cx = f => f.x + f.w/2, cy = f => f.y + f.h/2;

const scene = {
  title: t('fuenfzig.title'), subtitle: t('fuenfzig.sub'), emoji: '🎂',
  accent: '#f3d37a', button: '#2f7a55', bg: '#163a2c',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = FL.map(() => ({ on: true, t: 0, relight: 0, lit: 1 })); smoke = []; tt = 0; time = 0; over = false; last = null; started = false; fx.clear(); fin.stop(); },
  onTap(x, y){ last = { x, y }; breath = 0; },
  onDrag(x, y, ctx){
    if(over || !last) return;
    const sp = Math.hypot(x - last.x, y - last.y);
    FL.forEach((f, i) => { const s = S[i];
      if(s.on && sp > 6 && breath < 2 && Math.abs(x - cx(f)) < 26 && y > f.y - 40 && y < f.y + f.h + 40){
        s.on = false; s.t = 0; started = true; breath++;
        if(breath === 2) fx.pop(cx(f) + 30, f.y - 30, '💨', '#fff', 30);
        const n = S.filter(q => !q.on).length;
        s.relight = Math.max(1.3, 2.6 - time*.03) + rnd(-.3, .5);   // Trickkerze: geht nach kurzer Zeit wieder an
        for(let k = 0; k < 6; k++) smoke.push({ x: cx(f) + rnd(-2, 2), y: f.y + f.h - 6, vx: rnd(-10, 10) + (x - last.x)*.6, vy: rnd(-40, -25), a: .55, r: rnd(3, 6) });
        ctx.noise(0, .18, .06, 900); ctx.tone(220 + n*60, 0, .12, 'sine', .05);
      } });
    last = { x, y };
  },
  onRelease(){ last = null; },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(started && !over) time += dt;
    S.forEach((s, i) => { const f = FL[i]; s.t += dt; s.lit += ((s.on ? 1 : 0) - s.lit)*Math.min(1, dt*(s.on ? 6 : 14));
      if(!over && !s.on && s.t >= s.relight){ s.on = true; s.t = 0; fx.burst(cx(f), f.y + f.h - 8, 8, ['#ffe08a', '#fff4c0', '#ff9a3c'], 90, 60, 4);
        fx.pop(cx(f), f.y - 26, t('fuenfzig.again'), '#ffe7a6', 22); ctx.tone(1200, 0, .06, 'square', .04); } });
    for(const m of smoke){ m.x += m.vx*dt; m.y += m.vy*dt; m.vx *= .97; m.r += dt*6; m.a -= dt*.28; }
    smoke = smoke.filter(m => m.a > 0);
    if(!over && S.every(s => !s.on)) this.finish(ctx);
  },
  finish(ctx){
    over = true; const secs = Math.round(time*10)/10, b = best('fuenfzig', secs, false);
    ctx.noise(0, .1, .03, 3000);
    setTimeout(() => { fx.burst(300, 300, 50, ['#f3d37a', '#ffffff', '#c9a24a', '#9fe0b8'], 380, 320, 8);
      fin.start(ctx, greeting('fuenfzig'), [t('fuenfzig.score', { s: secs }) + (b.isNew ? '  ★' : ''), t('fuenfzig.best', { s: b.best })], MEL.birthday);
      S.forEach(s => { s.on = true; }); }, 900);
  },
  draw(g, ctx){
    const dt = 1/60;
    FL.forEach((f, i) => {
      const s = S[i], k = s.lit;
      if(k < .999 && IMG[i].bg.complete){
        g.save(); g.globalAlpha = 1 - k; g.drawImage(IMG[i].bg, f.px, f.py, f.pw, f.ph);
        const r = g.createRadialGradient(cx(f), cy(f), 2, cx(f), cy(f), 30); r.addColorStop(0, 'rgba(14,34,24,.55)'); r.addColorStop(1, 'rgba(14,34,24,0)');
        g.fillStyle = r; g.beginPath(); g.arc(cx(f), cy(f), 30, 0, 7); g.fill();
        g.strokeStyle = '#2a1d14'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx(f), f.y + f.h - 2); g.lineTo(cx(f) + 1, f.y + f.h - 9); g.stroke();
        if(!s.on){ g.fillStyle = `rgba(255,120,40,${.6*Math.max(0, 1 - s.t*1.5)})`; g.beginPath(); g.arc(cx(f) + 1, f.y + f.h - 9, 2, 0, 7); g.fill(); }
        g.restore();
      }
      if(k > .001 && IMG[i].spr.complete){   // gedruckte Flamme flackert
        const fl = 1 + Math.sin(tt*17 + i*2)*.05 + Math.sin(tt*29 + i)*.04, sw = Math.sin(tt*7 + i*1.7)*.05;
        g.save(); g.globalAlpha = k; g.translate(cx(f), f.y + f.h); g.rotate(sw); g.scale(k*(2 - fl)*.98 + .02, k*fl);
        g.drawImage(IMG[i].spr, -f.w/2, -f.h, f.w, f.h); g.restore();
      }
    });
    for(const m of smoke){ g.fillStyle = `rgba(220,215,205,${m.a*.5})`; g.beginPath(); g.arc(m.x, m.y, m.r, 0, 7); g.fill(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🕯 ' + S.filter(s => !s.on).length + '/5', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !started) hint(g, t('fuenfzig.hint'), tt, 470, 9);
    fin.draw(g, dt, 'rgba(15,40,30,', .22);
  }
};
startCard(scene);
window.__fz = { FL, S: () => S, get time(){ return time; } };
