// Feuerwerk: Antippen des Himmels startet eine Rakete von der Skyline, die am
// Tipp-Punkt explodiert. Verschiedene Formen (Kugel, Ring, Herz, Weide).
// Nach 8 Raketen: großes Finale + Text (?text=, Standard "Zeit zu feiern!").
import { startCard, t, bigText, rnd } from '../core/card.js';

const QP = new URLSearchParams(location.search), QN = QP.get('name');
const MSG = QP.get('text') || (QN ? t('feuerwerk.msgN', {name: QN}) : t('feuerwerk.msg'));
const COLS = ['#ffd166','#ef476f','#06d6a0','#118ab2','#f78c6b','#c77dff','#ffffff'];
let rockets, parts, count, finale, finT, msgT;

function boom(x, y, ctx, kind){
  const c1 = COLS[Math.floor(rnd(0, COLS.length))], c2 = COLS[Math.floor(rnd(0, COLS.length))];
  const n = 70;
  for(let i=0;i<n;i++){
    const a = i/n*Math.PI*2; let v = rnd(110, 170), vx, vy;
    if(kind === 1){ v = 150; }
    if(kind === 2){ const t = a; vx = 16*Math.pow(Math.sin(t),3)*8; vy = -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t))*8; }
    parts.push({ x, y, vx: vx ?? Math.cos(a)*v, vy: vy ?? Math.sin(a)*v, life: kind === 3 ? 2.4 : 1.6, max: kind === 3 ? 2.4 : 1.6, c: i%2 ? c1 : c2, g: kind === 3 ? 90 : 45, drag: kind === 3 ? .5 : .35 });
  }
  ctx.noise(0, .5, .35, 80); ctx.noise(.02, .9, .08, 3000);
  for(let k=0;k<6;k++) ctx.noise(.3 + k*.09 + rnd(0, .05), .04, .06, 4000);  // Knistern
}

const scene = {
  title: t('feuerwerk.title'), subtitle: t('feuerwerk.sub'), emoji: '🎆',
  accent: '#ffd166', button: '#3a0ca3', bg: '#0b132b',
  init(ctx){ this.restart(ctx); },
  restart(ctx){ rockets = []; parts = []; count = 0; finale = false; finT = 0; msgT = -1; },
  launch(x, y, ctx){
    rockets.push({ x: x + rnd(-40, 40), y: 760, tx: x, ty: Math.min(y, 640), t: 0, dur: .9, kind: count%4 });
    ctx.noise(0, .8, .07, 1200);  // Pfeifen/Zischen
    ctx.tone(900, 0, .8, 'sine', .02);
  },
  onTap(x, y, ctx){
    if(finale && ctx.t - finT < 4) return;
    count++; this.launch(x, y, ctx);
    if(count === 8 && !finale){
      finale = true; finT = ctx.t;
      for(let i=0;i<10;i++) setTimeout(() => this.launch(rnd(80, 520), rnd(150, 450), ctx), 600 + i*280);
      setTimeout(() => { msgT = ctx.t; ctx.melody([['C5',1],['E5',1],['G5',1],['C6',3],['G5',1],['C6',4]], 140, 'triangle', .1); }, 4000);
      setTimeout(() => ctx.showAgain(true), 6500);
    }
  },
  update(dt, ctx){
    for(const r of rockets){
      r.t += dt; const k = Math.min(1, r.t/r.dur);
      r.x0 ??= r.x; r.cx = r.x0 + (r.tx - r.x0)*k; r.cy = r.y + (r.ty - r.y)*(1 - Math.pow(1-k, 2));
      parts.push({ x: r.cx, y: r.cy, vx: rnd(-10, 10), vy: rnd(20, 50), life: .4, max: .4, c: '#ffd9a0', g: 20, drag: .5, small: 1 });
      if(k >= 1){ r.dead = 1; boom(r.tx, r.ty, ctx, r.kind); }
    }
    rockets = rockets.filter(r => !r.dead);
    for(const p of parts){ p.vx *= Math.pow(p.drag, dt); p.vy = p.vy*Math.pow(p.drag, dt) + p.g*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; }
    parts = parts.filter(p => p.life > 0);
  },
  draw(g, ctx){
    g.globalCompositeOperation = 'lighter';
    for(const p of parts){
      const a = Math.max(0, p.life/p.max);
      g.fillStyle = p.c; g.globalAlpha = a*(p.small ? .7 : 1);
      g.beginPath(); g.arc(p.x, p.y, p.small ? 2 : 3*a + 1, 0, 7); g.fill();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if(count === 0 && ctx.t < 6){ g.globalAlpha = .6 + .4*Math.sin(ctx.t*4); bigText(g, t('feuerwerk.hint'), 300, 440, 42, '#fff', 'rgba(10,20,60,.85)'); g.globalAlpha = 1; }
    else if(!finale){ bigText(g, `${count} / 8`, 540, 600, 30, '#ffd166', 'rgba(10,20,60,.85)'); }
    if(msgT >= 0){ const a = Math.min(1, (ctx.t - msgT)/.8); g.globalAlpha = a; bigText(g, MSG, 300, 420, MSG.length > 14 ? 46 : 60, '#ffd166', 'rgba(10,20,60,.9)'); g.globalAlpha = 1; }
  }
};
startCard(scene);
