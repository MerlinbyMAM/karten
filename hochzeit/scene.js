// Hochzeit: Zwei goldene Ringe liegen links und rechts. Ziehe einen Ring
// zum anderen -> sie verschmelzen funkelnd, Hochzeitsglocken läuten,
// weiße Tauben fliegen auf, Blütenregen, Namen + Datum (?namen=, ?datum=).
import { startCard, bigText, rnd } from '../core/card.js';

const P = new URLSearchParams(location.search);
const NAMEN = P.get('namen') || 'Alles Liebe zur Hochzeit!';
const DATUM = P.get('datum');
const CY = 560;

let rings, held, joined, jT, doves, petals, sparks;

function ringDraw(g, x, y, r, rot){
  g.save(); g.translate(x, y); g.rotate(rot);
  g.lineWidth = r*.32; const gr = g.createLinearGradient(-r, -r, r, r);
  gr.addColorStop(0, '#fff3b0'); gr.addColorStop(.4, '#d4a017'); gr.addColorStop(.7, '#fce38a'); gr.addColorStop(1, '#a67c00');
  g.strokeStyle = gr; g.beginPath(); g.ellipse(0, 0, r, r*.82, 0, 0, 7); g.stroke();
  g.fillStyle = '#fff'; g.globalAlpha = .7; g.beginPath(); g.arc(-r*.55, -r*.55, r*.08, 0, 7); g.fill(); g.restore();
}

const scene = {
  title: 'Alles Liebe zur Hochzeit', subtitle: 'Führe die beiden Ringe zusammen.', emoji: '💍',
  accent: '#f1e3c6', button: '#9c6644', bg: '#4a3b30',
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    rings = [{ x: 150, y: CY, r: 48, rot: -.3 }, { x: 450, y: CY, r: 48, rot: .3 }];
    held = null; joined = false; jT = 0; doves = []; petals = []; sparks = [];
  },
  onTap(x, y, ctx){
    if(joined){ for(let i=0;i<14;i++){ const a = rnd(0, 6.28); sparks.push({ x, y, vx: Math.cos(a)*rnd(40, 160), vy: Math.sin(a)*rnd(40, 160), life: 1 }); } ctx.tone(rnd(1500, 2400), 0, .6, 'sine', .04); return; }
    held = rings.find(r => Math.hypot(r.x - x, r.y - y) < r.r*1.8) || null;
    if(held) ctx.tone(1318, 0, .25, 'sine', .05);
  },
  onDrag(x, y, ctx){
    if(!held || joined) return;
    held.x = x; held.y = y;
    const [a, b] = rings;
    if(Math.hypot(a.x - b.x, a.y - b.y) < 70) this.join(ctx);
  },
  onRelease(ctx){
    if(!held || joined){ held = null; return; }
    held = null;
    // ohne Ziehen: Ringe gleiten nach kurzem Tippen von selbst zueinander
  },
  join(ctx){
    joined = true; jT = ctx.t; held = null;
    for(let i=0;i<40;i++){ const a = rnd(0, 6.28), v = rnd(60, 260); sparks.push({ x: 300, y: CY, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: rnd(.8, 1.6) }); }
    // Glocken
    [0, .45, .9, 1.35].forEach((t, i) => { const f = [784, 659, 523, 659][i]; ctx.tone(f, t, 2.2, 'sine', .09); ctx.tone(f*2.76, t, 1.2, 'sine', .03); ctx.tone(f*5.4, t, .6, 'sine', .015); });
    // Hochzeitsmarsch (Mendelssohn, gemeinfrei) – Anfangsfanfare
    ctx.melody([['C5',.33],['C5',.33],['C5',.33],['C5',1],[null,1],['C5',.33],['C5',.33],['C5',.33],['C5',1],[null,1],['C5',.33],['C5',.33],['C5',.33],['C5',1],['C5',.33],['C5',.33],['C5',.33],['C5',1],
                ['C5',1],['F5',1.5],['F5',.5],['A5',1.5],['A5',.5],['C6',2],['B5',1],['A5',1],['G5',1],['F5',3]], 100, 'triangle', .1, 2.2);
    for(let i=0;i<5;i++) doves.push({ x: 300 + rnd(-40, 40), y: CY, vx: rnd(-160, 160), vy: rnd(-200, -120), ph: rnd(0, 6), s: rnd(.8, 1.2) });
    for(let i=0;i<70;i++) petals.push({ x: rnd(0, 600), y: rnd(-600, -10), vy: rnd(50, 100), r: rnd(0, 6), vr: rnd(-2, 2), s: rnd(8, 13), c: Math.random() < .5 ? '#ffffff' : '#f8c8d0' });
    setTimeout(() => ctx.showAgain(true), 6000);
  },
  update(dt, ctx){
    const [a, b] = rings;
    if(joined){
      const k = Math.min(1, (ctx.t - jT)*3);
      a.x += (285 - a.x)*k*.3; a.y += (CY - a.y)*k*.3; b.x += (315 - b.x)*k*.3; b.y += (CY - b.y)*k*.3;
      a.rot += (-.5 - a.rot)*.1; b.rot += (.5 - b.rot)*.1;
    } else if(!held){
      // leichtes Schweben
      a.y += Math.sin(ctx.t*2)*.2; b.y += Math.sin(ctx.t*2 + 1)*.2;
      if(ctx.t > 12){ a.x += (300 - a.x)*dt*.8; b.x += (300 - b.x)*dt*.8; if(Math.abs(a.x - b.x) < 70) this.join(ctx); }  // Hilfe nach 12 s
    }
    for(const d of doves){ d.x += d.vx*dt; d.y += d.vy*dt; d.vy += 10*dt; }
    for(const p of petals){ p.y += p.vy*dt; p.x += Math.sin(ctx.t + p.r)*20*dt; p.r += p.vr*dt; if(p.y > 920){ p.y = -20; p.x = rnd(0, 600); } }
    for(const s of sparks){ s.x += s.vx*dt; s.y += s.vy*dt; s.vx *= .97; s.vy *= .97; s.life -= dt; }
    sparks = sparks.filter(s => s.life > 0);
  },
  draw(g, ctx){
    if(joined){
      const gl = Math.min(1, (ctx.t - jT));
      const gr = g.createRadialGradient(300, CY, 10, 300, CY, 220); gr.addColorStop(0, `rgba(255,236,170,${.5*gl})`); gr.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = gr; g.fillRect(60, CY - 220, 480, 440);
    }
    for(const r of rings) ringDraw(g, r.x, r.y, r.r, r.rot);
    g.globalCompositeOperation = 'lighter';
    for(const s of sparks){ g.globalAlpha = Math.max(0, s.life); g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    for(const d of doves){
      const w = Math.sin(ctx.t*10 + d.ph);
      g.save(); g.translate(d.x, d.y); g.scale(d.vx < 0 ? -d.s : d.s, d.s); g.fillStyle = '#fff'; g.strokeStyle = 'rgba(120,120,140,.5)'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(0, 0, 22, 10, 0, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(20, -6, 7, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#f4a261'; g.beginPath(); g.moveTo(26, -6); g.lineTo(33, -4); g.lineTo(26, -3); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-4, -4); g.quadraticCurveTo(-10, -30*w - 6, -26, -28*w - 4); g.quadraticCurveTo(-14, -6, -4, -4); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-20, 0); g.lineTo(-36, -6); g.lineTo(-34, 6); g.fill(); g.restore();
    }
    for(const p of petals){ g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, p.s*.6, p.s, 0, 0, 7); g.fill(); g.restore(); }
    if(!joined && ctx.t > .5){ g.globalAlpha = .6 + .4*Math.sin(ctx.t*3); bigText(g, 'Ringe zusammenführen', 300, CY + 110, 34, '#fff', 'rgba(110,80,60,.85)'); g.globalAlpha = 1; }
    if(joined && ctx.t - jT > 1.5){
      g.globalAlpha = Math.min(1, ctx.t - jT - 1.5);
      bigText(g, NAMEN, 300, CY + 120, NAMEN.length > 18 ? 38 : 50, '#fff8e7', 'rgba(110,80,60,.9)');
      if(DATUM) bigText(g, DATUM, 300, CY + 180, 32, '#fff8e7', 'rgba(110,80,60,.9)');
      g.globalAlpha = 1;
    }
  }
};
startCard(scene);
