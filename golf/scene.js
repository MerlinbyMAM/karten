// 60. Geburtstag: Der gedruckte Golfball rollt. Vom Ball weg nach unten ziehen (Zielhilfe zeigt Richtung und Stärke),
// loslassen = Putt. Der Ball wird mit der Entfernung kleiner (Perspektive). Langsam genug über dem Loch = eingelocht,
// zu schnell = er springt drüber. Gezählt werden die Schläge.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, rnd, MEL } from '../core/kit.js';

const BALL = { x: 289, y: 744, w: 30, h: 30, cx: 304, cy: 759 };
const PL = [{ px: 286, py: 741, pw: 36, ph: 36, src: 'ball_platz.png' }, { px: 297, py: 761, pw: 40, ph: 24, src: 'schatten_platz.png' }].map(p => ({ ...p, img: Object.assign(new Image(), { src: p.src }) }));
const SPR = Object.assign(new Image(), { src: 'ball.png' });
const HOLE = { x: 301, y: 585, rx: 13, ry: 5.5 }, SLOPE = 34;     // leichter Hang nach rechts
const GREEN = { x: 290, y: 690, rx: 310, ry: 170 };           // Grün-Ellipse (vermessen)
const sc = y => .5 + .5*Math.max(0, Math.min(1, (y - HOLE.y + 20)/(BALL.cy - HOLE.y + 20)));

let b, aim, strokes, fx, fin, tt, over, moved, lastPos, sinkT, msgT;

const scene = {
  title: t('golf.title'), subtitle: t('golf.sub'), emoji: '⛳',
  accent: '#d9f0b8', button: '#2f7a3a', bg: '#2f5a2a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ b = { x: BALL.cx, y: BALL.cy, vx: 0, vy: 0, roll: false, in: false }; aim = null; strokes = 0; tt = 0; over = false; moved = false; lastPos = { x: BALL.cx, y: BALL.cy }; sinkT = 0; msgT = 0; fx.clear(); fin.stop(); },
  onTap(x, y){ if(over || b.roll) return; if(Math.hypot(x - b.x, y - b.y) < 70) aim = { x, y }; },
  onDrag(x, y){ if(aim){ aim.x = x; aim.y = y; } },
  onRelease(ctx){
    if(!aim) return;
    const dx = b.x - aim.x, dy = b.y - aim.y, d = Math.min(220, Math.hypot(dx, dy)); aim = null;
    if(d < 12) return;
    const k = d*3.1/Math.hypot(dx, dy); b.vx = dx*k; b.vy = dy*k; b.roll = true; moved = true; strokes++; lastPos = { x: b.x, y: b.y };
    ctx.tone(520, 0, .05, 'triangle', .1); ctx.noise(0, .04, .05, 3000);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); msgT = Math.max(0, msgT - dt);
    if(b.in){ sinkT += dt; return; }
    if(!b.roll) return;
    const s = sc(b.y), steps = 4;
    for(let i = 0; i < steps; i++){
      const h = dt/steps;
      b.vx += SLOPE*h; b.x += b.vx*h*s; b.y += b.vy*h*s;
      const v = Math.hypot(b.vx, b.vy), f = Math.max(0, v - 260*h)/Math.max(v, 1e-6); b.vx *= f; b.vy *= f;
      const hx = (b.x - HOLE.x)/HOLE.rx, hy = (b.y - HOLE.y)/HOLE.ry;
      if(hx*hx + hy*hy < 1.3){
        if(v < 330){ b.in = true; b.roll = false; this.holed(ctx); return; }
        else if(!b.lipped){ b.lipped = true; b.vy *= .8; b.vx += rnd(-60, 60); ctx.tone(700, 0, .05, 'square', .05); }
      } else b.lipped = false;
    }
    const gx = (b.x - GREEN.x)/GREEN.rx, gy = (b.y - GREEN.y)/GREEN.ry;
    if(gx*gx + gy*gy > 1){ b.roll = false; fx.pop(b.x, b.y - 30, t('golf.long'), '#fff', 30); ctx.tone(220, 0, .2, 'sine', .05);
      setTimeout(() => { b.x = lastPos.x; b.y = lastPos.y; }, 700); return; }
    if(Math.hypot(b.vx, b.vy) < 6){ b.roll = false; b.vx = b.vy = 0; fx.pop(b.x, b.y - 30, b.y > HOLE.y ? t('golf.short') : t('golf.long'), '#fff', 28); }
  },
  holed(ctx){
    over = true; fx.pop(HOLE.x, HOLE.y - 50, strokes === 1 ? t('golf.ace') : t('golf.hole'), '#ffe27a', strokes === 1 ? 40 : 34);
    fx.burst(HOLE.x, HOLE.y, 30, ['#ffe27a', '#ffffff', '#ff5a5a', '#9be27a'], 260, 260, 7);
    ctx.noise(0, .08, .1, 1200); ctx.melody([['C5', .2], ['E5', .2], ['G5', .2], ['C6', .5]], 260, 'triangle', .1);
    const bb = best('golf', strokes, false);
    setTimeout(() => fin.start(ctx, greeting('golf'), [t('golf.score', { n: strokes }) + (bb.isNew ? '  ★' : ''), t('golf.best', { n: bb.best })], MEL.fanfare), 1200);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(moved){ for(const p of PL) if(p.img.complete) g.drawImage(p.img, p.px, p.py, p.pw, p.ph); }
    // Zielhilfe: gestrichelte Linie in Schussrichtung, Länge = Stärke
    if(aim){ const dx = b.x - aim.x, dy = b.y - aim.y, d = Math.min(220, Math.hypot(dx, dy)), ux = dx/(Math.hypot(dx, dy) || 1), uy = dy/(Math.hypot(dx, dy) || 1);
      g.save(); g.setLineDash([8, 8]); g.lineWidth = 3; g.strokeStyle = `hsl(${120 - d/220*120},90%,60%)`;
      g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x + ux*d*1.2, b.y + uy*d*.9); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(aim.x, aim.y); g.stroke(); g.restore(); }
    if(moved && !(b.in && sinkT > .25)){
      const s = sc(b.y)*(b.in ? Math.max(0, 1 - sinkT*4) : 1);
      g.save(); g.fillStyle = 'rgba(20,50,10,.35)'; g.beginPath(); g.ellipse(b.x - 7*s, b.y + 12*s, 15*s, 5*s, 0, 0, 7); g.fill(); g.restore();
      if(SPR.complete){ g.save(); g.translate(b.x, b.y + (b.in ? sinkT*20 : 0)); g.rotate((b.y + b.x)*.05); g.drawImage(SPR, -15*s, -15*s, 30*s, 30*s); g.restore(); }
    }
    fx.draw(g);
    if(!fin.on) hud2(g, '⛳ ' + strokes, '🏆 ' + (peekBest('golf') ?? '–'), 455);
    if(!fin.on && !moved && !aim) hint(g, t('golf.hint'), tt, 680, 9);
    fin.draw(g, dt, 'rgba(30,60,30,', .2);
  }
};
startCard(scene);
window.__gf = { HOLE, get b(){ return b; }, get strokes(){ return strokes; }, get over(){ return over; } };
