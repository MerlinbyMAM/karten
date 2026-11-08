// 18. Geburtstag: Die gedruckte Sektflasche will knallen. Schnelles Auf-und-ab-Wischen über der Flasche schüttelt sie
// (sie wackelt, Bläschen steigen im Hals auf); ist der Druck groß genug, schießt der goldene Korken davon.
// Danach Finger auf ein gedrucktes Glas halten = einschenken. Ziel: alle vier Gläser bis zur Markierung, ohne Überlaufen.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, rnd, MEL } from '../core/kit.js';

const BOT = { x: 232, y: 314, w: 132, h: 458, cx: 298.4, cy: 589.3, px: 233, py: 315, pw: 131, ph: 459.5 };
const NECK = { x: 299, y: 322 };                            // Korken-Oberkante
// Gedruckte Gläser: Kelch innen (oben, unten, Breite oben/unten) – vermessen
const GL = [{ x: 99, top: 462, bot: 606, wt: 64, wb: 28 }, { x: 171, top: 462, bot: 606, wt: 64, wb: 28 },
            { x: 418, top: 462, bot: 606, wt: 64, wb: 28 }, { x: 489, top: 462, bot: 606, wt: 64, wb: 28 }];
const LINE = .82, SPR = new Image(), PLATZ = new Image(); SPR.src = 'flasche.png'; PLATZ.src = 'flasche_platz.png';

let pressure, shakeA, lastY, popped, cork, fill, foam, pour, fx, fin, tt, time, over, bubbles, running;

function drawBottle(g, x, y, rot){
  if(!SPR.complete) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(SPR, BOT.x - BOT.cx, BOT.y - BOT.cy, BOT.w, BOT.h); g.restore();
}
function glassPath(g, G, level){                            // Kelch-Inneres bis Füllhöhe (0..1.2)
  const h = G.bot - G.top, yT = G.bot - h*Math.min(level, 1.0), wAt = y => G.wb + (G.wt - G.wb)*(G.bot - y)/h;
  g.beginPath(); g.moveTo(G.x - G.wb/2, G.bot); g.lineTo(G.x - wAt(yT)/2, yT); g.lineTo(G.x + wAt(yT)/2, yT); g.lineTo(G.x + G.wb/2, G.bot); g.closePath();
  return yT;
}

const scene = {
  title: t('sekt.title'), subtitle: t('sekt.sub'), emoji: '🍾',
  accent: '#ffd36e', button: '#d64fa0', bg: '#1e1b3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ pressure = 0; shakeA = 0; lastY = null; popped = false; cork = null; fill = GL.map(() => 0); foam = GL.map(() => 0); pour = -1;
    tt = 0; time = 0; over = false; bubbles = []; running = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    if(!popped){ lastY = y; running = true; return; }
    const i = GL.findIndex(G => Math.abs(x - G.x) < 40 && y > G.top - 60 && y < G.bot + 140);
    if(i >= 0 && fill[i] < 1.15) pour = i;
  },
  onDrag(x, y, ctx){
    if(over || popped || lastY === null) return;
    const d = Math.abs(y - lastY); lastY = y;
    if(Math.abs(x - BOT.cx) < 120){ pressure = Math.min(1, pressure + d*.0007); shakeA = Math.min(1, shakeA + d*.012);
      if(Math.random() < d*.05) bubbles.push({ x: BOT.cx + rnd(-10, 10), y: rnd(420, 600), v: rnd(60, 140), r: rnd(1.5, 3.5) });
      if(d > 12 && Math.random() < .25) ctx.noise(0, .05, .03, 1800); }
    if(pressure >= 1) this.pop(ctx);
  },
  onRelease(){ lastY = null; pour = -1; },
  pop(ctx){
    popped = true; cork = { x: NECK.x, y: NECK.y, vx: rnd(-120, 120), vy: -900, r: 0 };
    ctx.noise(0, .18, .5, 400); ctx.tone(900, 0, .08, 'square', .1);
    fx.pop(NECK.x, NECK.y - 40, t('sekt.pop'), '#ffd36e', 46); fx.burst(NECK.x, NECK.y, 40, ['#fff8d0', '#ffe68a', '#ffffff'], 380, 300, 6); fx.shake(6);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(running && !over) time += dt;
    shakeA = Math.max(0, shakeA - dt*2.2); if(!popped) pressure = Math.max(0, pressure - dt*.06);
    for(const b of bubbles){ b.y -= b.v*dt; b.x += Math.sin(tt*9 + b.y)*.4; } bubbles = bubbles.filter(b => b.y > NECK.y + 20);
    if(cork){ cork.vy += 1600*dt; cork.x += cork.vx*dt; cork.y += cork.vy*dt; cork.r += dt*14; if(cork.y > 1000) cork = null; }
    if(popped && Math.random() < dt*6) fx.burst(NECK.x + rnd(-4, 4), NECK.y + 4, 1, ['rgba(255,255,255,.7)'], 30, -40, 5);
    if(pour >= 0 && !over){
      fill[pour] += dt*.45; foam[pour] = Math.min(1, foam[pour] + dt*2.5);
      if(Math.random() < dt*20) ctx.noise(0, .04, .02, 3000);
      if(fill[pour] > 1.12){ const G = GL[pour]; fx.pop(G.x, G.top - 30, t('sekt.over'), '#ff8fa3', 28); fx.burst(G.x, G.top, 14, ['#fff3b0', '#ffe68a'], 140, 400, 5);
        ctx.tone(200, 0, .2, 'sawtooth', .05); fill[pour] = .55; pour = -1; }
    }
    GL.forEach((G, i) => { if(i !== pour) foam[i] = Math.max(0, foam[i] - dt*.6);
      if(i !== pour && fill[i] >= LINE && fill[i] <= 1.12 && !G.done){ G.done = true; fx.pop(G.x, G.top - 30, t('sekt.full'), '#ffd36e', 30); fx.sparkle(G.x, G.top + 10, 12); ctx.tone(1047 + i*130, 0, .25, 'triangle', .1); } });
    if(!over && GL.every(G => G.done)) this.finish(ctx);
  },
  finish(ctx){
    over = true; pour = -1; const secs = Math.round(time*10)/10, b = best('sekt', secs, false);
    fx.burst(300, 500, 60, ['#ffd36e', '#ff6fd8', '#8fd3ff', '#ffffff'], 420, 380, 9);
    setTimeout(() => fin.start(ctx, greeting('sekt'), [t('sekt.score', { s: secs }) + (b.isNew ? '  ★' : ''), t('sekt.best', { s: b.best })], MEL.fanfare), 500);
  },
  draw(g, ctx){
    const dt = 1/60;
    // Sekt in den gedruckten Gläsern (halbtransparent, mit Perlen und Schaumkrone)
    GL.forEach((G, i) => {
      if(fill[i] <= 0) return;
      g.save(); const yT = glassPath(g, G, fill[i]); g.clip();
      const gr = g.createLinearGradient(0, yT, 0, G.bot); gr.addColorStop(0, 'rgba(255,236,150,.78)'); gr.addColorStop(1, 'rgba(240,190,70,.82)');
      g.fillStyle = gr; g.fillRect(G.x - 40, yT - 2, 80, G.bot - yT + 4);
      g.fillStyle = 'rgba(255,255,255,.7)'; for(let k = 0; k < 6; k++){ const by = G.bot - ((tt*40 + k*23) % (G.bot - yT)); g.beginPath(); g.arc(G.x - 8 + (k*7 % 16), by, 1.6, 0, 7); g.fill(); }
      g.restore();
      if(foam[i] > 0){ g.fillStyle = `rgba(255,252,235,${.85*foam[i]})`; g.beginPath(); g.ellipse(G.x, yT, 22 + 6*foam[i], 5 + 3*foam[i], 0, 0, 7); g.fill(); }
      // Strahl aus der Flasche
      if(i === pour){ g.strokeStyle = 'rgba(255,230,140,.85)'; g.lineWidth = 5; g.beginPath(); g.moveTo(NECK.x, NECK.y + 10); g.quadraticCurveTo((NECK.x + G.x)/2, NECK.y - 60, G.x, yT); g.stroke(); }
    });
    // Füllmarkierung (dezente Goldlinie), solange nicht voll
    if(popped && !over) GL.forEach((G, i) => { if(G.done) return; const h = G.bot - G.top, y = G.bot - h*LINE, w = G.wb + (G.wt - G.wb)*LINE;
      g.save(); g.strokeStyle = `rgba(255,215,110,${.55 + .35*Math.sin(tt*4)})`; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(G.x - w/2 - 4, y); g.lineTo(G.x + w/2 + 4, y); g.stroke(); g.restore(); });
    // Flasche wackeln lassen (Platz mit Original-Hintergrund füllen, freigestellte Flasche drehen)
    if(shakeA > .02 || (popped && pour >= 0)){
      if(PLATZ.complete) g.drawImage(PLATZ, BOT.px, BOT.py, BOT.pw, BOT.ph);
      const rot = pour >= 0 ? (GL[pour].x < BOT.cx ? -.35 : .35) : Math.sin(tt*40)*.12*shakeA;
      drawBottle(g, BOT.cx, BOT.cy + (pour >= 0 ? -20 : 0), rot);
    }
    for(const b of bubbles){ g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); }
    if(popped && !cork) {}
    if(cork){ g.save(); g.translate(cork.x, cork.y); g.rotate(cork.r); g.fillStyle = '#d9b26a'; g.fillRect(-8, -10, 16, 20); g.fillStyle = '#f2d48a'; g.fillRect(-8, -10, 16, 5); g.restore(); }
    // Druckanzeige an der Flasche
    if(!popped && pressure > 0){ g.save(); g.fillStyle = 'rgba(20,10,40,.55)'; g.beginPath(); g.roundRect(BOT.cx + 74, 420, 16, 200, 8); g.fill();
      const gr = g.createLinearGradient(0, 620, 0, 420); gr.addColorStop(0, '#ffd36e'); gr.addColorStop(1, '#ff4fa8'); g.fillStyle = gr; g.beginPath(); g.roundRect(BOT.cx + 76, 618 - 196*pressure, 12, 196*pressure, 6); g.fill(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🥂 ' + GL.filter(G => G.done).length + '/4', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !popped && pressure < .05) hint(g, t('sekt.hint'), tt, 700, 9);
    if(!fin.on && popped && !GL.some(G => G.done) && pour < 0) hint(g, t('sekt.hint2'), 1, 700, 9);
    fin.draw(g, dt, 'rgba(25,15,50,', .25);
  }
};
startCard(scene);
window.__az = { GL, BOT, get popped(){ return popped; }, fill: () => fill, get time(){ return time; } };
