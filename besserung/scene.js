// Gute Besserung: Der gedruckte Teddy ist krank. Tee, Honig, Wärmflasche und Tulpen sind auf die Karte gedruckt –
// festhalten und zum Teddy ziehen. Jede Gabe senkt das Fieber, der Teddy bekommt rosige Wangen, die Sache kehrt
// mit Häkchen an ihren Platz zurück. Sind alle vier gebracht, ist der Teddy gesund.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

const ITEMS = [
  { n: 'tee', x: 4, y: 694, w: 142, h: 124, cx: 81.2, cy: 752.5 },
  { n: 'honig', x: 148, y: 680, w: 138, h: 166, cx: 211.7, cy: 767.8 },
  { n: 'flasche', x: 286, y: 708, w: 174, h: 160, cx: 379.3, cy: 792.4 },
  { n: 'vase', x: 452, y: 556, w: 144, h: 270, cx: 522.2, cy: 688.5 } ];
const TEDDY = { x: 298, y: 400, r: 150 }, FACE = { x: 292, y: 372 };
const IMG = ITEMS.map(i => { const a = new Image(); a.src = i.n + '.png'; return a; });

let S, drag, fx, fin, tt, time, over, heal, glow;
const fever = () => (39.6 - heal*2.8).toFixed(1).replace('.', ',');

function drawItem(g, i, x, y, sc = 1, rot = 0, al = 1){
  const it = ITEMS[i]; if(!IMG[i].complete) return;
  g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(IMG[i], it.x - it.cx, it.y - it.cy, it.w, it.h); g.restore();
}

const scene = {
  title: t('besserung.title'), subtitle: t('besserung.sub'), emoji: '🧸',
  accent: '#cfe3c8', button: '#6f9a6a', bg: '#3f5a4a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = ITEMS.map(() => ({ st: 'home', x: 0, y: 0, t: 0, done: false })); drag = null; tt = 0; time = 0; over = false; heal = 0; glow = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    let bi = -1, bd = 1e9;
    ITEMS.forEach((it, i) => { if(S[i].st !== 'home' || S[i].done) return; const d = Math.hypot(x - it.cx, y - it.cy); if(d < bd){ bd = d; bi = i; } });
    if(bi < 0 || bd > 80) return;
    const it = ITEMS[bi]; drag = { i: bi, ox: it.cx - x, oy: it.cy - y }; S[bi].st = 'drag'; S[bi].x = it.cx; S[bi].y = it.cy;
    ctx.tone(600, 0, .07, 'triangle', .07);
  },
  onDrag(x, y){ if(drag){ const s = S[drag.i]; s.x = x + drag.ox; s.y = y + drag.oy - 30; } },
  onRelease(ctx){
    if(!drag) return; const s = S[drag.i];
    if(Math.hypot(s.x - TEDDY.x, s.y - TEDDY.y) < TEDDY.r){ s.st = 'give'; s.t = 0; } else { s.st = 'back'; s.t = 0; s.fx = s.x; s.fy = s.y; }
    drag = null;
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); glow = Math.max(0, glow - dt*.6);
    if(!over && S.some(s => s.st !== 'home' || s.done)) time += dt;
    S.forEach((s, i) => {
      s.t += dt; const it = ITEMS[i];
      if(s.st === 'give' && s.t >= .6){
        s.done = true; s.st = 'back'; s.t = 0; s.fx = FACE.x; s.fy = FACE.y; heal = S.filter(q => q.done).length/ITEMS.length; glow = 1;
        fx.pop(FACE.x, FACE.y - 90, t('besserung.thanks'), '#ff6f91', 36); fx.burst(FACE.x, FACE.y, 18, ['#ff8fa3', '#ffd34d', '#ffffff', '#9fd18f'], 220, 200, 7);
        ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5]], 260, 'triangle', .09);
        if(S.every(q => q.done)) setTimeout(() => this.finish(ctx), 700);
      }
      if(s.st === 'back' && s.t >= .5){ s.st = 'home'; if(s.done){ fx.sparkle(it.cx, it.cy, 8); } }
    });
  },
  finish(ctx){
    if(over) return; over = true;
    const secs = Math.round(time*10)/10, b = best('besserung', secs, false);
    fin.start(ctx, greeting('besserung'), [t('besserung.score', { s: secs }) + (b.isNew ? '  ★' : ''), t('besserung.best', { s: b.best })], MEL.soft);
  },
  draw(g, ctx){
    const dt = 1/60;
    // Teddy: rosige Wangen + Wärme, je gesünder er wird
    if(heal > 0 || glow > 0){
      for(const dx of [-42, 42]){ const r = g.createRadialGradient(FACE.x + dx, FACE.y + 18, 2, FACE.x + dx, FACE.y + 18, 22);
        r.addColorStop(0, `rgba(255,120,140,${.55*heal})`); r.addColorStop(1, 'rgba(255,120,140,0)'); g.fillStyle = r; g.beginPath(); g.arc(FACE.x + dx, FACE.y + 18, 22, 0, 7); g.fill(); }
      if(glow > 0){ const r = g.createRadialGradient(FACE.x, FACE.y, 10, FACE.x, FACE.y, 160); r.addColorStop(0, `rgba(255,240,180,${.45*glow})`); r.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = r; g.beginPath(); g.arc(FACE.x, FACE.y, 160, 0, 7); g.fill(); }
    }
    // Plätze: beim Ziehen blass, erledigte mit Häkchen
    S.forEach((s, i) => { const it = ITEMS[i];
      if(s.st !== 'home'){ const R = Math.max(it.w, it.h)*.6, rg = g.createRadialGradient(it.cx, it.cy, R*.3, it.cx, it.cy, R);
        g.save(); g.globalCompositeOperation = 'saturation'; rg.addColorStop(0, 'rgba(128,128,128,.75)'); rg.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = rg; g.fillRect(it.cx - R, it.cy - R, 2*R, 2*R); g.restore();
        const r2 = g.createRadialGradient(it.cx, it.cy, R*.2, it.cx, it.cy, R); r2.addColorStop(0, 'rgba(250,244,228,.38)'); r2.addColorStop(1, 'rgba(250,244,228,0)'); g.fillStyle = r2; g.fillRect(it.cx - R, it.cy - R, 2*R, 2*R); }
      if(s.done && s.st === 'home'){ g.save(); g.fillStyle = '#6f9a6a'; g.beginPath(); g.arc(it.cx + it.w*.32, it.y + 14, 15, 0, 7); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(it.cx + it.w*.32 - 7, it.y + 14); g.lineTo(it.cx + it.w*.32 - 2, it.y + 20); g.lineTo(it.cx + it.w*.32 + 8, it.y + 8); g.stroke(); g.restore(); }
    });
    // Einladung: nicht gebrachte Sachen pulsieren leicht
    if(!over && !drag) S.forEach((s, i) => { if(s.st === 'home' && !s.done){ const it = ITEMS[i], k = .5 + .5*Math.sin(tt*3 + i);
      g.save(); g.strokeStyle = `rgba(255,255,255,${.35 + .35*k})`; g.lineWidth = 3; g.setLineDash([8, 7]); g.beginPath(); g.ellipse(it.cx, it.cy, it.w*.55 + 4*k, it.h*.55 + 4*k, 0, 0, 7); g.stroke(); g.restore(); } });
    S.forEach((s, i) => {
      const it = ITEMS[i];
      if(s.st === 'drag') drawItem(g, i, s.x, s.y, 1.08, Math.sin(tt*6)*.04);
      else if(s.st === 'give'){ const u = Math.min(1, s.t/.6); drawItem(g, i, s.x + (FACE.x - s.x)*u, s.y + (FACE.y - s.y)*u, 1.08 - .7*u, 0, 1 - u*.6); }
      else if(s.st === 'back'){ const u = Math.min(1, s.t/.5), e = u*u*(3 - 2*u); drawItem(g, i, s.fx + (it.cx - s.fx)*e, s.fy + (it.cy - s.fy)*e - Math.sin(u*Math.PI)*60, .6 + .4*e); }
    });
    fx.draw(g);
    if(!fin.on) hud2(g, '🌡 ' + fever() + '°', '⏱ ' + time.toFixed(1) + ' s', 262);
    if(!fin.on && !S.some(s => s.done) && !drag) hint(g, t('besserung.hint'), tt, 650, 7);
    fin.draw(g, dt, 'rgba(40,60,45,', .2);
  }
};
startCard(scene);
window.__gb = { ITEMS, TEDDY, S: () => S, get time(){ return time; } };
