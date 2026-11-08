// 30. Geburtstag: Die gedruckte „30“-Piñata hängt am Seil. Jeder Treffer lässt sie pendeln und Papierfransen rieseln;
// ein kräftiger Wisch zählt doppelt. Nach 30 Treffer-Punkten platzt sie in Stücke und Bonbons regnen.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, rnd, MEL, alter } from '../core/kit.js';

const P = { x: 58, y: 268, w: 484, h: 474, px: 57, py: 264.5, pw: 485, ph: 481 };
const PIV = { x: 300, y: 266 }, HP = alter() ? Math.max(10, Math.min(80, alter())) : 30;   // so viele Trefferpunkte wie Lebensjahre
const SPR = new Image(), PLATZ = new Image(); SPR.src = 'pinata.png'; PLATZ.src = 'pinata_platz.png';
const COLS = ['#ff4f9a', '#ffd23f', '#2ec4b6', '#7b4fd6', '#ff8a3d'];

let a, va, dmg, hits, fx, fin, tt, over, pieces, candies, paper, last, burstT, flash;

function drawPinata(g, ang, sc = 1, al = 1){
  if(!SPR.complete) return;
  g.save(); g.globalAlpha = al; g.translate(PIV.x, PIV.y); g.rotate(ang); g.scale(sc, sc);
  g.drawImage(SPR, P.x - PIV.x, P.y - PIV.y, P.w, P.h);
  if(flash > 0){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(255,255,255,${.5*flash})`; g.fillRect(P.x - PIV.x, P.y - PIV.y, P.w, P.h); }
  g.restore();
}
function hit(x, y, power, ctx){
  if(over) return;
  const side = x < PIV.x + Math.sin(a)*250 ? 1 : -1;
  va += side*(.9 + .5*power)*rnd(.8, 1.2); dmg += power; hits++; flash = 1;
  fx.pop(x, y - 30, power > 1 ? t('pinata.hit') + ' ×2' : t('pinata.hit'), '#fff', power > 1 ? 34 : 28);
  for(let k = 0; k < 6*power; k++) paper.push({ x: x + rnd(-30, 30), y: y + rnd(-20, 20), vx: rnd(-120, 120), vy: rnd(-200, 20), r: rnd(0, 6), vr: rnd(-8, 8), c: COLS[k % 5] });
  ctx.noise(0, .1, .14, 700); ctx.tone(180 + dmg*8, 0, .08, 'triangle', .07); fx.shake(2 + 2*power);
  if(dmg >= HP) burst(ctx);
}
function burst(ctx){
  over = true; burstT = 0;
  // Piñata zerfällt in 6 Stücke (Ausschnitte des Druckbilds)
  pieces = [];
  for(let i = 0; i < 6; i++){ const c = i % 3, r = Math.floor(i/3);
    pieces.push({ sx: P.x + c*P.w/3, sy: P.y + r*P.h/2, sw: P.w/3, sh: P.h/2, x: 0, y: 0, vx: rnd(-260, 260), vy: rnd(-500, -200), r: 0, vr: rnd(-6, 6) }); }
  for(let k = 0; k < 40; k++) candies.push({ x: 300 + rnd(-120, 120), y: 560 + rnd(-60, 60), vx: rnd(-280, 280), vy: rnd(-650, -150), r: rnd(0, 6), vr: rnd(-9, 9), c: COLS[k % 5], c2: COLS[(k + 2) % 5] });
  ctx.noise(0, .3, .5, 300); ctx.tone(120, 0, .3, 'sawtooth', .08); fx.shake(10);
  fx.burst(300, 560, 50, COLS, 420, 300, 8);
  const b = best('pinata', hits, false);
  setTimeout(() => fin.start(ctx, greeting('pinata'), [t('pinata.score', { n: hits }) + (b.isNew ? '  ★' : ''), t('pinata.best', { n: b.best })], MEL.birthday), 1300);
}

const scene = {
  title: t('pinata.title'), subtitle: t('pinata.sub'), emoji: '🪅',
  accent: '#ffd23f', button: '#7b4fd6', bg: '#7a2f5b',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ a = 0; va = 0; dmg = 0; hits = 0; tt = 0; over = false; pieces = []; candies = []; paper = []; last = null; burstT = 0; flash = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ last = { x, y, t: performance.now(), used: false }; },
  onDrag(x, y, ctx){
    if(!last || last.used) return;
    const d = Math.hypot(x - last.x, y - last.y), dt = (performance.now() - last.t)/1000;
    if(d > 70 && d/dt > 900 && this.onP(x, y)){ last.used = true; hit(x, y, 2, ctx); }
  },
  onRelease(ctx){ if(last && !last.used && this.onP(last.x, last.y)) hit(last.x, last.y, 1, ctx); last = null; },
  onP(x, y){ const dx = x - PIV.x, dy = y - PIV.y, c = Math.cos(-a), s = Math.sin(-a), u = dx*c - dy*s + PIV.x, v = dx*s + dy*c + PIV.y;
    return u > P.x + 40 && u < P.x + P.w - 40 && v > P.y + 20 && v < P.y + P.h - 60; },
  update(dt, ctx){
    tt += dt; fx.update(dt); flash = Math.max(0, flash - dt*6);
    va += (-9*Math.sin(a) - 1.6*va)*dt; a += va*dt; a = Math.max(-.7, Math.min(.7, a));
    for(const p of paper){ p.vy += 500*dt; p.vx *= .98; p.x += p.vx*dt; p.y += p.vy*dt*.6; p.r += p.vr*dt; }
    paper = paper.filter(p => p.y < 920);
    if(over){ burstT += dt;
      for(const p of pieces){ p.vy += 1200*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.r += p.vr*dt; }
      for(const c of candies){ c.vy += 1100*dt; c.x += c.vx*dt; c.y += c.vy*dt; c.r += c.vr*dt; if(c.y > 790 && c.vy > 0){ c.vy *= -.35; c.vx *= .6; c.y = 790; } } }
  },
  draw(g, ctx){
    const dt = 1/60;
    if(PLATZ.complete && (Math.abs(a) > .002 || over)) g.drawImage(PLATZ, P.px, P.py, P.pw, P.ph);
    fx.applyShake(g);
    if(!over){ if(Math.abs(a) > .002 || flash > 0) drawPinata(g, a); }
    else {
      // Seil bleibt hängen
      g.strokeStyle = '#9a6b3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(PIV.x, PIV.y); g.lineTo(PIV.x + Math.sin(burstT*3)*6, PIV.y + 60); g.stroke();
      if(SPR.complete) for(const p of pieces){ g.save(); g.translate(p.sx + p.sw/2 + p.x, p.sy + p.sh/2 + p.y); g.rotate(p.r);
        g.drawImage(SPR, (p.sx - P.x)*SPR.naturalWidth/P.w, (p.sy - P.y)*SPR.naturalHeight/P.h, p.sw*SPR.naturalWidth/P.w, p.sh*SPR.naturalHeight/P.h, -p.sw/2, -p.sh/2, p.sw, p.sh); g.restore(); }
      for(const c of candies){ g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.fillStyle = c.c2;
        g.beginPath(); g.moveTo(-12, 0); g.lineTo(-22, -8); g.lineTo(-22, 8); g.closePath(); g.fill(); g.beginPath(); g.moveTo(12, 0); g.lineTo(22, -8); g.lineTo(22, 8); g.closePath(); g.fill();
        g.fillStyle = c.c; g.beginPath(); g.ellipse(0, 0, 14, 10, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-5, -9, 4, 18); g.restore(); }
      // im Finale steht die Piñata wieder wie gedruckt da
      if(burstT > 1.6) drawPinata(g, 0, 1, Math.min(1, (burstT - 1.6)*1.2));
    }
    for(const p of paper){ g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-4, -9, 8, 18); g.restore(); }
    fx.draw(g); g.restore();
    if(!over && !fin.on){ // Füllstand
      g.save(); g.fillStyle = 'rgba(60,20,60,.45)'; g.beginPath(); g.roundRect(150, 742, 300, 16, 8); g.fill();
      const gr = g.createLinearGradient(150, 0, 450, 0); COLS.forEach((c, i) => gr.addColorStop(i/4, c)); g.fillStyle = gr;
      g.beginPath(); g.roundRect(152, 744, 296*Math.min(1, dmg/HP), 12, 6); g.fill(); g.restore(); }
    if(!fin.on) hud2(g, '🪅 ' + hits, '💥 ' + Math.min(HP, dmg) + '/' + HP, 846);
    if(!fin.on && hits === 0) hint(g, t('pinata.hint'), tt, 505, 9);
    fin.draw(g, dt, 'rgba(90,30,70,', .2);
  }
};
startCard(scene);
window.__pn = { get dmg(){ return dmg; }, get hits(){ return hits; }, get a(){ return a; }, get over(){ return over; } };
