// Kindergeburtstag Fußball: „Ball hochhalten“. Der gedruckte Ball springt hoch – antippen, bevor er auf den Rasen fällt!
// Jede Berührung zählt, Rekord wird gespeichert.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'ball', x: 146, y: 514, w: 306, h: 302, cx: 300.4, cy: 667.2, px: 144, py: 512.5, pw: 313, ph: 308.5 } ];
const B0 = OB[0], IMG = new Image(), BG = new Image(); IMG.src = 'ball.png'; BG.src = 'ball_platz.png';
const GROUND = 770, SC = .48, R = B0.w*.5*SC, GR = 1500;
let ball, touches, phase, fx, fin, tt, moved;
const scene = {
  title: t('kicker.title'), subtitle: t('kicker.sub'), emoji: '⚽', accent: '#ffe27a', button: '#2a7a2a', bg: '#1e5a1e',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ ball = { x: B0.cx, y: B0.cy, vx: 0, vy: 0, s: 1, rot: 0 }; touches = 0; phase = 'ready'; tt = 0; moved = false; fx.clear(); fin.stop(); },
  kick(x, ctx){ ball.vy = -980 - Math.random()*120; ball.vx = (ball.x - x)*7 + (Math.random() - .5)*60; touches++; ctx.tone(180, 0, .08, 'square', .07); ctx.tone(500 + Math.min(touches, 30)*25, .02, .1, 'triangle', .06);
    fx.burst(ball.x, ball.y + R*.8, 6, ['#ffffff', '#a8e07a'], 120, 300, 3); if(touches % 10 === 0) fx.pop(ball.x, ball.y - 80, touches + '!', '#ffe27a', 34); },
  onTap(x, y, ctx){
    if(phase === 'ready'){ if(Math.hypot(x - ball.x, y - ball.y) < B0.w*.55){ phase = 'play'; moved = true; ball.s = SC; this.kick(x, ctx); } return; }
    if(phase === 'play' && Math.hypot(x - ball.x, y - ball.y) < R + 38) this.kick(x, ctx); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play'){ ball.vy += GR*dt; ball.x += ball.vx*dt; ball.y += ball.vy*dt; ball.rot += ball.vx*dt*.02;
      if(ball.x < R){ ball.x = R; ball.vx = Math.abs(ball.vx)*.7; } if(ball.x > 600 - R){ ball.x = 600 - R; ball.vx = -Math.abs(ball.vx)*.7; }
      if(ball.y < R + 10){ ball.y = R + 10; ball.vy = Math.abs(ball.vy)*.3; }
      if(ball.y > GROUND - R){ ball.y = GROUND - R; phase = 'down'; ball.vy = -260; ctx.tone(110, 0, .2, 'sine', .08); this.finish(ctx); } }
    if(phase === 'down'){ ball.vy += GR*dt; ball.y += ball.vy*dt; ball.x += ball.vx*dt*.3; if(ball.y > GROUND - R){ ball.y = GROUND - R; ball.vy = -ball.vy*.35; } } },
  finish(ctx){ const b = best('kicker', touches, true);
    setTimeout(() => { ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
      fin.start(ctx, greeting('kicker'), [t('kicker.line'), t('kicker.score', { n: touches }) + (b.isNew && touches ? '  ★' : '') + '  ·  ' + t('kicker.best', { n: b.best })], MEL.birthday); }, 900); },
  draw(g, ctx){ const dt = 1/60;
    if(moved && BG.complete) g.drawImage(BG, B0.px, B0.py, B0.pw, B0.ph);
    if(phase !== 'ready'){ const h = Math.max(0, Math.min(1, (GROUND - ball.y)/500)); g.save(); g.globalAlpha = .25*(1 - h*.7); g.fillStyle = '#103010'; g.beginPath(); g.ellipse(ball.x, GROUND - 4, R*(1 - h*.4), R*.25*(1 - h*.4), 0, 0, 7); g.fill(); g.restore(); }
    if(IMG.complete){ g.save(); g.translate(ball.x, ball.y); g.rotate(ball.rot); g.scale(ball.s, ball.s); g.drawImage(IMG, B0.x - B0.cx, B0.y - B0.cy, B0.w, B0.h); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '⚽ ' + touches, '★ ' + (peekBest('kicker') || 0), 846);
    if(!fin.on && phase === 'ready') hint(g, t('kicker.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(15,50,15,', .2); } };
startCard(scene);
window.__kk = { B0, get ball(){ return ball; }, get touches(){ return touches; }, get phase(){ return phase; } };
