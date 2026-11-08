// Für Mama: Die gedruckten Blüten im Beet sind durstig – matt und leicht gesenkt.
// Die gedruckte Gießkanne löst sich beim Berühren vom Rasen und folgt dem Finger; aus ihrer Tülle fallen Tropfen.
// Jede gegossene Blüte bekommt ihre Farbe zurück, richtet sich auf und funkelt. Ziel: alle Blüten so schnell wie möglich.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, rnd, MEL, drawPiece } from '../core/kit.js';

// Vermessen auf dem Kartenbild (600 × 900)
const BLOOMS = [{ x: 70, y: 465, r: 52 }, { x: 188, y: 410, r: 62 }, { x: 330, y: 410, r: 72 }, { x: 210, y: 555, r: 78 },
                { x: 350, y: 550, r: 55 }, { x: 450, y: 535, r: 62 }, { x: 540, y: 492, r: 52 }];
const CAN = { x: 130, y: 757, w: 240, h: 185, shape: 'round', r: 26 };
const SPOUT = { x: 238, y: 712 };                              // Tüllen-Spitze (Kartenkoordinaten, Kanne an ihrem Platz)
const HOLE_DX = -240, TIME = 35;

let B, can, drops, fx, fin, tt, time, over, held;
// Freigestellte Kanne (aus dem Druckbild, 2× Auflösung) + Wiesenflicken in Kannenform für den leeren Platz
const SPR = new Image(); SPR.src = 'kanne.png';
const SX = 8, SY = 660, SW = 247, SH = 195, PATCH_DY = -30;
const PATCH = new Image(); PATCH.src = 'kanne_platz.png';   // Wiese in Kannenform (aus dem Originalbild, ohne QR)
const BP = BLOOMS.map(b => ({ x: b.x, y: b.y, w: b.r*2, h: b.r*2, shape: 'ellipse' }));

const scene = {
  title: t('mama.title'), subtitle: t('mama.sub'), emoji: '🌷',
  accent: '#ffc3d3', button: '#c2557a', bg: '#4a2a3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){
    B = BLOOMS.map(() => ({ w: 0, pop: 0, done: false }));
    can = { x: CAN.x, y: CAN.y, rot: 0, lift: 0, home: true };
    drops = []; tt = 0; time = 0; over = false; held = null; fx.clear(); fin.stop();
  },
  onTap(x, y){ if(over) return; held = { dx: CAN.x - x, dy: CAN.y - y }; held.dx = Math.max(-CAN.w/2, Math.min(CAN.w/2, held.dx)) * .4; held.dy = Math.max(-CAN.h/2, Math.min(CAN.h/2, held.dy)) * .4;
    can.x = x + held.dx; can.y = y + held.dy - 40; can.home = false; },
  onDrag(x, y){ if(held && !over){ const nx = x + held.dx, ny = y + held.dy - 40; can.vx = nx - can.x; can.x = nx; can.y = ny; } },
  onRelease(){ held = null; },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(!over && !can.home) time += dt;
    // Kanne kippen, solange gehalten; sonst zurück an ihren Platz
    const tRot = held ? .7 : 0; can.rot += (tRot - can.rot)*Math.min(1, dt*8);
    if(!held && !can.home){ can.x += (CAN.x - can.x)*Math.min(1, dt*6); can.y += (CAN.y - can.y)*Math.min(1, dt*6); if(Math.hypot(can.x - CAN.x, can.y - CAN.y) < 2 && Math.abs(can.rot) < .02){ can.x = CAN.x; can.y = CAN.y; can.home = true; } }
    // Tropfen aus der Tülle
    if(held && !over){
      const c = Math.cos(can.rot), s = Math.sin(can.rot), ox = SPOUT.x - CAN.x, oy = SPOUT.y - CAN.y;
      const sx = can.x + ox*c - oy*s, sy = can.y + ox*s + oy*c;
      if(Math.random() < dt*40){ drops.push({ x: sx + rnd(-6, 6), y: sy, vx: rnd(-30, -5), vy: rnd(20, 80), life: 1.4 }); }
      if(Math.random() < dt*6) ctx.noise(0, .05, .015, 3500);
    }
    for(const d of drops){ d.vy += 900*dt; d.x += d.vx*dt; d.y += d.vy*dt; d.life -= dt;
      BLOOMS.forEach((b, i) => { if(d.life > 0 && Math.hypot(d.x - b.x, d.y - b.y) < b.r*.85){ d.life = 0; const s = B[i];
        if(!s.done){ s.w = Math.min(1, s.w + .045); if(s.w >= 1){ s.done = true; s.pop = 1; fx.sparkle(b.x, b.y, 16); fx.pop(b.x, b.y - b.r - 10, '♥', '#ff8fb1', 40);
          ctx.tone(660 + B.filter(q => q.done).length*90, 0, .3, 'triangle', .09); } } } });
    }
    drops = drops.filter(d => d.life > 0 && d.y < 920);
    for(const s of B) s.pop = Math.max(0, s.pop - dt*2);
    if(!over && B.every(s => s.done)) this.finish(ctx, true);
    if(!over && time >= TIME) this.finish(ctx, false);
  },
  finish(ctx, all){
    over = true; held = null;
    const secs = Math.round(time*10)/10, n = B.filter(s => s.done).length;
    let sub;
    if(all){ const b = best('mama', secs, false); sub = [t('mama.done', { s: secs }) + (b.isNew ? '  ★' : ''), t('mama.best', { s: b.best })]; }
    else sub = [t('mama.some', { n, m: BLOOMS.length })];
    fx.burst(300, 450, 40, ['#ffb3c8', '#ffd34d', '#ffffff', '#ff7aa8'], 340, 300, 9);
    fin.start(ctx, greeting('mama'), sub, MEL.soft);
  },
  draw(g, ctx){
    const dt = 1/60;
    // durstige Blüten: matt + gesenkt (Druckbild bleibt sichtbar, wird nur getönt)
    BLOOMS.forEach((b, i) => {
      const s = B[i], p = BP[i], k = 1 - s.w;
      if(s.done && s.pop > 0){ drawPiece(g, p, b.x, b.y, 0, 1 + Math.sin(s.pop*Math.PI)*.12); return; }
      if(s.done || k <= 0) return;
      g.save(); g.beginPath(); g.arc(b.x, b.y, b.r*1.05, 0, 7); g.clip();
      const rg = g.createRadialGradient(b.x, b.y, b.r*.2, b.x, b.y, b.r*1.15);
      g.globalCompositeOperation = 'saturation';
      rg.addColorStop(0, `rgba(128,128,128,${.8*k})`); rg.addColorStop(.7, `rgba(128,128,128,${.7*k})`); rg.addColorStop(1, 'rgba(128,128,128,0)');
      g.fillStyle = rg; g.fillRect(b.x - b.r*1.2, b.y - b.r*1.2, b.r*2.4, b.r*2.4);
      g.globalCompositeOperation = 'source-over';
      const rd = g.createRadialGradient(b.x, b.y, b.r*.2, b.x, b.y, b.r*1.15);
      rd.addColorStop(0, `rgba(95,85,60,${.16*k})`); rd.addColorStop(1, 'rgba(95,85,60,0)');
      g.fillStyle = rd; g.fillRect(b.x - b.r*1.2, b.y - b.r*1.2, b.r*2.4, b.r*2.4);
      g.restore();
    });
    // Gießkanne: leerer Platz = Wiesenflicken in Kannenform, Kanne selbst freigestellt
    if(!can.home){
      if(PATCH.complete) g.drawImage(PATCH, SX, SY, SW, SH);
      g.save(); g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(can.x, can.y + 140, 90, 12, 0, 0, 7); g.fill(); g.restore();
      if(SPR.complete){ g.save(); g.translate(can.x, can.y); g.rotate(can.rot); g.scale(1.05, 1.05); g.drawImage(SPR, SX - CAN.x, SY - CAN.y, SW, SH); g.restore(); }
    }
    g.fillStyle = 'rgba(120,190,255,.85)';
    for(const d of drops){ g.beginPath(); g.ellipse(d.x, d.y, 3, 5.5, Math.atan2(d.vy, d.vx) - Math.PI/2, 0, 7); g.fill(); }
    fx.draw(g);
    if(!fin.on) hud(g, ['🌷 ' + B.filter(s => s.done).length + '/' + BLOOMS.length, '⏱ ' + time.toFixed(1) + ' s', '🏆 ' + (peekBest('mama') ?? '–')], HUD_Y);
    if(!fin.on && can.home && time === 0) hint(g, t('mama.hint'), tt, HINT_Y, 6);
    fin.draw(g, dt, 'rgba(74,42,58,', .22);
  }
};
const HUD_Y = 268, HINT_Y = 655;
startCard(scene);
window.__mm = { BLOOMS, CAN, SPOUT, B: () => B, get time(){ return time; } };
