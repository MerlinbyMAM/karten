// Geburtstag für Mama: Über der Vase sitzen neun Knospen. Mit dem Finger führst du eine goldene Gießkanne –
// wo Wasser hinfällt, wachsen die Knospen und gehen zu Rosen, Tulpen und Margeriten auf, Schmetterlinge fliegen los.
// Blüht der ganze Strauß, steigt ein Herz aus Blütenblättern auf: „Happy Birthday, Mama!“ (oder ?name=).
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, greeting, hint, shade, rnd, MEL, bigText } from '../core/kit.js';

const RIM = { x: 318, y: 592 };                         // Vasenöffnung auf dem Kartenbild (600 × 900) – nach Motiv eingestellt
const TIME = 35;
const SPOTS = [[-92, -150], [0, -195], [92, -150], [-140, -60], [-48, -95], [48, -95], [140, -60], [-70, -10], [70, -10]];
const KINDS = ['rose', 'tulip', 'rose', 'daisy', 'rose', 'tulip', 'daisy', 'tulip', 'rose'];
const COLS = ['#f28bb0', '#f7a8a0', '#e85d8a', '#fbe3a0', '#f5b7c8', '#ff9e7a', '#fff3f0', '#f6c0d0', '#e8789e'];
let buds, can, drops, flies, petals, fx, fin, time, done, tt, bloomed, heart;

function bloomPetals(g, b, s){
  const c = COLS[b.i], k = b.kind;
  g.save(); g.translate(b.x, b.y); g.scale(s, s);
  if(k === 'daisy'){
    for(let i=0;i<14;i++){ g.save(); g.rotate(i/14*Math.PI*2 + b.rot); g.fillStyle = i % 2 ? '#ffffff' : '#fff7ee'; g.beginPath(); g.ellipse(0, -20, 7, 19, 0, 0, 7); g.fill(); g.restore(); }
    g.fillStyle = '#f2b731'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.fillStyle = 'rgba(160,90,10,.4)'; g.beginPath(); g.arc(2, 2, 6, 0, 7); g.fill();
  } else if(k === 'tulip'){
    g.fillStyle = shade(c, -25); g.beginPath(); g.ellipse(-12, -6, 13, 26, -.25, 0, 7); g.ellipse(12, -6, 13, 26, .25, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, -34, 0, 20); gr.addColorStop(0, shade(c, 30)); gr.addColorStop(1, shade(c, -30));
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, -8, 14, 30, 0, 0, 7); g.fill();
  } else {
    for(let r=0;r<3;r++){ const n = 6 - r, rad = 26 - r*8; for(let i=0;i<n;i++){ g.save(); g.rotate(i/n*Math.PI*2 + r*.5 + b.rot); const gr = g.createRadialGradient(0, -rad*.6, 1, 0, -rad*.6, rad); gr.addColorStop(0, shade(c, 40 - r*10)); gr.addColorStop(1, shade(c, -20 - r*15)); g.fillStyle = gr; g.beginPath(); g.ellipse(0, -rad*.55, rad*.62, rad*.72, 0, 0, 7); g.fill(); g.restore(); } }
    g.fillStyle = shade(c, -45); g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill();
  }
  g.restore();
}
function drawBud(g, b){
  // Stiel von der Vase
  g.strokeStyle = '#5f8b4c'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(RIM.x + (b.x - RIM.x)*.15, RIM.y + 6); g.quadraticCurveTo(RIM.x + (b.x - RIM.x)*.7, (RIM.y + b.y)/2 + 30, b.x, b.y + 14); g.stroke();
  g.fillStyle = '#7fae64'; g.beginPath(); g.ellipse((RIM.x + b.x)/2 + 10, (RIM.y + b.y)/2 + 20, 14, 6, b.x < RIM.x ? .6 : -.6, 0, 7); g.fill();
  if(b.open > 0){ const s = Math.min(1, b.open)*(1 + Math.sin(tt*2 + b.i)*.02); bloomPetals(g, b, .35 + .65*s); return; }
  // Knospe, wächst mit dem Wasser
  const gs = .7 + b.grow*.5;
  g.save(); g.translate(b.x, b.y); g.scale(gs, gs);
  g.fillStyle = '#6f9e57'; g.beginPath(); g.moveTo(-10, 6); g.quadraticCurveTo(0, 20, 10, 6); g.lineTo(0, 16); g.fill();
  const gr = g.createLinearGradient(0, -22, 0, 10); gr.addColorStop(0, shade(COLS[b.i], 20)); gr.addColorStop(1, shade(COLS[b.i], -40));
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -6, 9 + b.grow*3, 15 + b.grow*4, 0, 0, 7); g.fill();
  g.restore();
  if(b.grow > 0 && b.grow < 1){ g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 4; g.beginPath(); g.arc(b.x, b.y - 4, 26, -Math.PI/2, -Math.PI/2 + b.grow*Math.PI*2); g.stroke(); }
}
function drawCan(g){
  g.save(); g.translate(can.x, can.y); g.rotate(can.tilt);
  const gr = g.createLinearGradient(-30, 0, 30, 0); gr.addColorStop(0, '#b8892c'); gr.addColorStop(.5, '#f7dc8a'); gr.addColorStop(1, '#a87a22');
  g.fillStyle = gr; g.beginPath(); g.roundRect(-26, -20, 52, 40, 10); g.fill();
  g.strokeStyle = '#a87a22'; g.lineWidth = 5; g.beginPath(); g.arc(0, -22, 16, Math.PI, 0); g.stroke();
  g.fillStyle = '#d9b25a'; g.beginPath(); g.moveTo(-24, 6); g.lineTo(-58, -14); g.lineTo(-62, -8); g.lineTo(-24, 14); g.fill();
  g.beginPath(); g.ellipse(-62, -12, 6, 9, .5, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-18, -14, 8, 26);
  g.restore();
}
function spoutPos(){ const a = can.tilt; return [can.x + Math.cos(a)*-62 - Math.sin(a)*-12, can.y + Math.sin(a)*-62 + Math.cos(a)*-12]; }

const scene = {
  title: t('mama.title'), subtitle: t('mama.sub'), emoji: '💐',
  accent: '#f5c6d4', button: '#c76a8a', bg: '#7d4a5c',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){
    buds = SPOTS.map(([dx, dy], i) => ({ i, x: RIM.x + dx, y: RIM.y + dy - 40, grow: 0, open: 0, kind: KINDS[i], rot: rnd(0, 1) }));
    can = { x: 470, y: 330, tx: 470, ty: 330, tilt: 0, pour: 0 }; drops = []; flies = []; petals = [];
    time = TIME; done = false; tt = 0; bloomed = 0; heart = null; fx.clear(); fin.stop();
  },
  onTap(x, y){ can.tx = x + 50; can.ty = y - 70; can.pour = .35; },
  onDrag(x, y){ can.tx = x + 50; can.ty = y - 70; can.pour = .35; },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(!done){ time -= dt; if(time <= 0){ time = 0; this.finish(ctx, false); } }
    // Gießkanne folgt dem Finger, kippt beim Gießen
    const vx = (can.tx - can.x); can.x += vx*Math.min(1, dt*10); can.y += (can.ty - can.y)*Math.min(1, dt*10);
    can.pour = Math.max(0, can.pour - dt);
    can.tilt += ((can.pour > 0 ? -.55 : 0) - can.tilt)*Math.min(1, dt*8);
    if(can.pour > 0 && !done){
      for(let k=0;k<2;k++){ const [sx, sy] = spoutPos(); drops.push({ x: sx + rnd(-6, 6), y: sy, vx: rnd(-40, -10), vy: rnd(60, 140), life: 1.2 }); }
      if(Math.random() < .08) ctx.noise(0, .12, .03, 3000);
    }
    for(const d of drops){
      d.vy += 900*dt; d.x += d.vx*dt; d.y += d.vy*dt; d.life -= dt;
      for(const b of buds){ if(b.open || Math.hypot(d.x - b.x, d.y - b.y) > 30) continue;
        d.life = 0; b.grow = Math.min(1, b.grow + .0085); b.wet = .4;
        if(b.grow >= 1){ b.open = .01; bloomed++; fx.sparkle(b.x, b.y, 16);
          ctx.tone([523, 587, 659, 698, 784, 880, 988, 1047, 1175][bloomed - 1] || 1175, 0, .5, 'sine', .12);
          flies.push({ x: b.x, y: b.y, vx: rnd(-80, 80), vy: rnd(-120, -60), ph: rnd(0, 6), c: COLS[b.i] });
          if(bloomed === buds.length) this.allBloom(ctx);
        }
      }
    }
    drops = drops.filter(d => d.life > 0 && d.y < 900);
    for(const b of buds){ if(b.open > 0 && b.open < 1) b.open = Math.min(1, b.open + dt*1.6);
      if(!b.open && !done){ b.wet = (b.wet || 0) - dt; if(b.wet < 0) b.grow = Math.max(0, b.grow - dt*.06); } }   // ohne Wasser welkt die Knospe langsam zurück
    for(const f of flies){ f.ph += dt*14; f.x += f.vx*dt + Math.sin(tt*3 + f.ph)*20*dt; f.y += f.vy*dt; }
    flies = flies.filter(f => f.y > -40);
    for(const p of petals){ p.t += dt; }
  },
  allBloom(ctx){
    done = true; heart = { t: 0 };
    for(let i=0;i<60;i++){ const a = i/60*Math.PI*2; const hx = 16*Math.pow(Math.sin(a), 3), hy = -(13*Math.cos(a) - 5*Math.cos(2*a) - 2*Math.cos(3*a) - Math.cos(4*a));
      petals.push({ x0: RIM.x + rnd(-120, 120), y0: RIM.y - rnd(60, 220), x1: 300 + hx*9, y1: 420 + hy*9, t: -i*.012, c: COLS[i % COLS.length], r: rnd(0, 6) }); }
    setTimeout(() => this.finish(ctx, true), 3400);
  },
  finish(ctx, won){
    if(fin.on) return; done = true;
    const secs = Math.round(TIME - time), b = won ? best('mama', secs, false) : null;
    const sub = won ? [t('mama.done', { s: secs }), t('mama.best', { s: b.best })] : [t('mama.some', { n: bloomed, m: buds.length })];
    fin.start(ctx, greeting('mama'), sub, won ? MEL.birthday : MEL.soft);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(!fin.on) hud(g, ['🌸 ' + bloomed + ' / ' + buds.length, '⏱ ' + Math.ceil(time) + ' s'], 272);
    for(const b of buds) drawBud(g, b);
    g.fillStyle = 'rgba(120,190,255,.85)'; for(const d of drops){ g.beginPath(); g.ellipse(d.x, d.y, 2.5, 4.5, 0, 0, 7); g.fill(); }
    for(const f of flies){ const w = Math.abs(Math.sin(f.ph))*12 + 3; g.fillStyle = f.c; g.beginPath(); g.ellipse(f.x - w/2, f.y, w, 9, 0, 0, 7); g.ellipse(f.x + w/2, f.y, w, 9, 0, 0, 7); g.fill(); g.fillStyle = '#5a3a2a'; g.fillRect(f.x - 1.5, f.y - 7, 3, 14); }
    for(const p of petals){ const k = Math.max(0, Math.min(1, p.t/1.2)), e = k*k*(3 - 2*k); if(p.t < 0) continue;
      g.save(); g.translate(p.x0 + (p.x1 - p.x0)*e, p.y0 + (p.y1 - p.y0)*e); g.rotate(p.r + p.t*2); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, 9, 5, 0, 0, 7); g.fill(); g.restore(); }
    fx.draw(g);
    if(!done) drawCan(g);
    if(!fin.on && bloomed === 0) hint(g, t('mama.hint'), tt, 480, 4.5);
    fin.draw(g, dt, 'rgba(90,40,60,');
  }
};
startCard(scene);
