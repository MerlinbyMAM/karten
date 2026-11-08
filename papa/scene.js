// Geburtstag für Papa: Torwandschießen wie im Sportstudio. Sechs Schüsse – drei aufs untere Loch,
// drei aufs obere. Wischen = Schuss: Richtung und Länge des Wischs bestimmen, wohin der Ball fliegt.
// Treffer: Ball verschwindet im Loch, das Stadion jubelt. Am Ende „Happy Birthday, Papa!“ mit Trefferzahl.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, rnd, MEL } from '../core/kit.js';

// Löcher der Torwand auf dem Kartenbild (600 × 900) – nach Motiv eingestellt
const HOLES = [{ x: 243, y: 517, r: 36 }, { x: 378, y: 411, r: 36 }];
const SPOT = { x: 300, y: 792 }, SHOTS = 6, FLY = .62;
let ball, aim, shot, goals, fx, fin, tt, crowd, results, wait;

function target(){ return HOLES[shot < 3 ? 0 : 1]; }
function drawBall(g, x, y, r, rot){
  g.save(); g.translate(x, y); g.rotate(rot);
  const gr = g.createRadialGradient(-r*.35, -r*.35, r*.1, 0, 0, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c9ccd1');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.fillStyle = '#222'; for(let i=0;i<5;i++){ const a = i/5*Math.PI*2; g.beginPath(); for(let k=0;k<5;k++){ const b = a + k/5*Math.PI*2; const px = Math.cos(a)*r*.62 + Math.cos(b)*r*.2, py = Math.sin(a)*r*.62 + Math.sin(b)*r*.2; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.fill(); }
  g.beginPath(); for(let k=0;k<5;k++){ const b = k/5*Math.PI*2 - Math.PI/2; const px = Math.cos(b)*r*.28, py = Math.sin(b)*r*.28; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.fill();
  g.restore();
}
function cheer(ctx){ ctx.noise(0, 1.6, .22, 400); ctx.noise(.15, 1.2, .16, 900); [523, 659, 784].forEach((f, i) => ctx.tone(f, .1 + i*.12, .3, 'square', .05)); }

const scene = {
  title: t('papa.title'), subtitle: t('papa.sub'), emoji: '⚽',
  accent: '#ffd34d', button: '#2e7d4f', bg: '#14324a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ ball = { x: SPOT.x, y: SPOT.y, r: 30, rot: 0, st: 'ready' }; aim = null; shot = 0; goals = 0; tt = 0; results = []; wait = 0; fx.clear(); fin.stop(); },
  onTap(x, y){ if(ball.st === 'ready') aim = { x0: x, y0: y, x, y, t0: tt }; },
  onDrag(x, y){ if(aim){ aim.x = x; aim.y = y; } },
  onRelease(ctx){
    if(!aim || ball.st !== 'ready') { aim = null; return; }
    const dx = aim.x - aim.x0, dy = aim.y - aim.y0; aim = null;
    if(dy > -40) return;                                         // nur Wisch nach oben schießt
    // Zielpunkt: Wischrichtung bestimmt die Seite, Wischlänge die Höhe
    const len = Math.min(520, -dy);
    const tx = SPOT.x + dx/(-dy)*(SPOT.y - 460)*1.05 + rnd(-8, 8);
    const ty = SPOT.y - len*0.95 + rnd(-8, 8);
    ball = { x: SPOT.x, y: SPOT.y, r: 30, rot: 0, st: 'fly', u: 0, x0: SPOT.x, y0: SPOT.y, tx, ty, curve: dx*.08 };
    ctx.noise(0, .12, .4, 200); ctx.tone(120, 0, .12, 'sine', .2);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(ball.st === 'fly'){
      ball.u = Math.min(1, ball.u + dt/FLY); const u = ball.u;
      ball.x = ball.x0 + (ball.tx - ball.x0)*u + Math.sin(u*Math.PI)*ball.curve;
      ball.y = ball.y0 + (ball.ty - ball.y0)*u - Math.sin(u*Math.PI)*60;
      ball.r = 30 - 16*u; ball.rot += dt*12;
      if(u >= 1){
        const h = target(), d = Math.hypot(ball.x - h.x, ball.y - h.y);
        const other = HOLES[shot < 3 ? 1 : 0], d2 = Math.hypot(ball.x - other.x, ball.y - other.y);
        if(d < h.r - ball.r*.4 || d2 < other.r - ball.r*.4){        // Treffer (auch das andere Loch zählt)
          ball.st = 'in'; ball.hole = d < h.r ? h : other; goals++; results.push(1);
          fx.pop(ball.hole.x, ball.hole.y - 60, t('papa.goal'), '#ffd34d', 52); fx.burst(ball.hole.x, ball.hole.y, 26, ['#ffd34d', '#fff', '#2e7d4f']); cheer(ctx);
        } else {
          results.push(0);
          const onBoard = ball.x > 70 && ball.x < 537 && ball.y > 295 && ball.y < 652;
          ball.st = 'miss'; ball.vx = (ball.x - 300)*.6 + rnd(-60, 60); ball.vy = onBoard ? 120 : -40;
          fx.pop(ball.x, ball.y - 50, t(onBoard ? 'papa.post' : 'papa.wide'), '#fff', 38);
          if(onBoard){ ctx.noise(0, .18, .5, 150); ctx.tone(90, 0, .2, 'sine', .25); fx.shake(5); } else ctx.noise(0, .3, .12, 2000);
        }
        wait = 1.2;
      }
    } else if(ball.st === 'in'){ ball.r = Math.max(0, ball.r - dt*40); }
    else if(ball.st === 'miss'){ ball.vy += 900*dt; ball.x += ball.vx*dt; ball.y += ball.vy*dt; ball.rot += dt*8; }
    if(wait > 0){ wait -= dt; if(wait <= 0){ shot++; if(shot >= SHOTS) this.finish(ctx); else ball = { x: SPOT.x, y: SPOT.y, r: 30, rot: 0, st: 'ready' }; } }
  },
  finish(ctx){
    ball.st = 'done'; const b = best('papa', goals);
    fin.start(ctx, greeting('papa'), [t('papa.score', { n: goals, m: SHOTS }) + (b.isNew ? '  ★' : ''), t('papa.best', { n: b.best })], goals >= 3 ? MEL.birthday : MEL.fanfare);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(!fin.on){
      hud(g, ['⚽ ' + Math.min(shot + 1, SHOTS) + ' / ' + SHOTS, '🥅 ' + goals, '🏆 ' + (peekBest('papa') ?? '–')], 664);
      // Ziel-Loch markieren
      if(ball.st === 'ready'){ const h = target(), p = .5 + .5*Math.sin(tt*5);
        g.strokeStyle = `rgba(255,211,77,${.5 + p*.5})`; g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.arc(h.x, h.y, h.r + 10 + p*4, 0, 7); g.stroke(); g.setLineDash([]); }
      // Schuss-Kugeln
      for(let i=0;i<SHOTS;i++){ g.fillStyle = i < results.length ? (results[i] ? '#4cd964' : '#ff5b5b') : 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(300 - 75 + i*30, 732, 9, 0, 7); g.fill(); }
    }
    fx.applyShake(g);
    if(ball.st === 'in' && ball.hole){ g.save(); g.beginPath(); g.arc(ball.hole.x, ball.hole.y, ball.hole.r, 0, 7); g.clip(); drawBall(g, ball.x, ball.y, ball.r, ball.rot); g.restore(); }
    else if(ball.st !== 'done'){ g.fillStyle = 'rgba(0,0,0,.25)'; if(ball.st === 'ready'){ g.beginPath(); g.ellipse(ball.x, ball.y + 26, 26, 7, 0, 0, 7); g.fill(); } drawBall(g, ball.x, ball.y, ball.r, ball.rot); }
    if(aim){ g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(aim.x0, aim.y0); g.lineTo(aim.x, aim.y); g.stroke(); g.setLineDash([]); }
    fx.draw(g); g.restore();
    if(!fin.on && shot === 0 && ball.st === 'ready') hint(g, t('papa.hint'), tt, 610, 5);
    fin.draw(g, dt, 'rgba(10,30,50,');
  }
};
startCard(scene);
