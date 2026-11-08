// Von Herzen: Antippen der Knospe -> die Rose erblüht (Video), danach
// schweben Blütenblätter und Schmetterlinge, die persönliche Botschaft
// erscheint (?text=, ?von=). Antippen danach = Blütenblatt-Wirbel.
import { startCard, bigText, wrapText, rnd } from '../core/card.js';

const P = new URLSearchParams(location.search);
const TEXT = P.get('text') || 'Schön, dass es dich gibt.';
const VON = P.get('von');

let phase, t0, petals, flies;
const VIDEO = false;
const BUD = { x: 300, y: 317 };

function drawRose(g, x, y, k, t){
  // k: 0..1 Aufblühen
  if(k <= 0) return;
  const R = 48 + 42*k;
  g.save(); g.translate(x, y);
  const glow = g.createRadialGradient(0, 0, 4, 0, 0, R*2.2); glow.addColorStop(0, `rgba(255,235,200,${.45*k})`); glow.addColorStop(1, 'rgba(255,235,200,0)');
  g.fillStyle = glow; g.beginPath(); g.arc(0, 0, R*2.2, 0, 7); g.fill();
  const rings = [[7, 1.0, 0], [6, .78, .4], [5, .56, .9], [4, .36, 1.4]];
  for(const [n, sc, off] of rings){
    const open = Math.max(0, Math.min(1, k*1.25 - off*.12));
    for(let i=0;i<n;i++){
      const a = i/n*6.283 + off + Math.sin(t*.6)*.03;
      const r = R*sc*(.35 + .65*open);
      g.save(); g.rotate(a); g.translate(0, -r*.45);
      const gr = g.createRadialGradient(0, r*.25, 2, 0, 0, r*.75);
      gr.addColorStop(0, '#c9184a'); gr.addColorStop(.55, '#f08aa5'); gr.addColorStop(1, '#ffd6e0');
      g.fillStyle = gr; g.globalAlpha = .93;
      g.beginPath(); g.ellipse(0, 0, r*.48, r*.62, 0, 0, 7); g.fill();
      g.globalAlpha = .35; g.strokeStyle = '#9d174d'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, r*.48, r*.62, 0, Math.PI*.15, Math.PI*.85); g.stroke();
      g.restore();
    }
  }
  g.globalAlpha = 1; g.fillStyle = '#a4133c'; g.beginPath(); g.arc(0, 0, R*.14, 0, 7); g.fill();
  g.restore();
}

const scene = {
  title: 'Von Herzen', subtitle: 'Tippe auf die Knospe und schau, was passiert.', emoji: '🌹',
  accent: '#f4acb7', button: '#b5838d', bg: '#4a3a3a',
  // Ohne Video: die Rose erblüht als gemalte Animation über der Knospe.
  // Liegt später ein clip.mp4 bei, kann VIDEO auf true gesetzt werden.
  video: VIDEO, firstVideo: 'clip.mp4',
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    phase = 'bud'; t0 = ctx.t; petals = []; flies = [];
    if(ctx.vid){ ctx.vid.pause(); ctx.vid.loop = false; try{ ctx.vid.currentTime = 0; }catch(e){} }
  },
  onLost(ctx){ if(ctx.vid && phase === 'bloom') ctx.vid.pause(); },
  onFound(ctx){ if(ctx.vid && phase === 'bloom' && ctx.vid.paused && !ctx.vid.ended) ctx.playVideo(); },
  onTap(x, y, ctx){
    if(phase === 'bud'){
      phase = 'bloom'; t0 = ctx.t;
      if(VIDEO && ctx.vid){ ctx.vid.currentTime = 0; ctx.playVideo('clip.mp4'); }
      // sanfte Harfen-Arpeggien
      const arp = ['C5','E5','G5','C6','E6','G6','C6','G5'];
      arp.forEach((n, i) => ctx.tone(ctx.noteFreq(n), .1 + i*.12, 1.4, 'sine', .05));
      ctx.melody([[null,4],['E5',2],['G5',1],['C6',3],['B5',1],['A5',1],['G5',4],['F5',2],['A5',1],['G5',3],['E5',1],['D5',1],['C5',4]], 100, 'sine', .08, .3);
      return;
    }
    for(let i=0;i<12;i++) petals.push({ x: x + rnd(-20, 20), y: y + rnd(-20, 20), vx: rnd(-90, 90), vy: rnd(-120, -20), r: rnd(0, 6), vr: rnd(-3, 3), s: rnd(10, 16), life: 4 });
    ctx.tone(rnd(1000, 1500), 0, .6, 'sine', .04);
  },
  update(dt, ctx){
    const el = ctx.t - t0;
    if(phase === 'bloom' && (VIDEO ? (el > 10.5 || (ctx.vid && ctx.vid.ended)) : el > 4.5)){
      phase = 'msg'; t0 = ctx.t;
      for(let i=0;i<5;i++) flies.push({ x: rnd(50, 550), y: rnd(250, 650), ph: rnd(0, 6), sp: rnd(.4, .8) });
      setTimeout(() => ctx.showAgain(true), 3500);
    }
    if(phase !== 'bud' && Math.random() < dt*3) petals.push({ x: rnd(0, 600), y: -20, vx: rnd(-15, 15), vy: rnd(40, 80), r: rnd(0, 6), vr: rnd(-2, 2), s: rnd(9, 14), life: 20 });
    for(const p of petals){ p.vy += 30*dt; if(p.vy > 80) p.vy = 80; p.x += (p.vx + Math.sin(ctx.t*1.5 + p.r)*15)*dt; p.y += p.vy*dt; p.vx *= Math.pow(.5, dt); p.r += p.vr*dt; p.life -= dt; }
    petals = petals.filter(p => p.life > 0 && p.y < 920);
  },
  draw(g, ctx){
    const el = ctx.t - t0;
    if(!VIDEO && phase !== 'bud'){ const k = Math.min(1, (phase === 'msg' ? 9 : el)/4); drawRose(g, BUD.x, BUD.y, 1 - Math.pow(1 - k, 3), ctx.t); }
    if(phase === 'bud'){
      g.strokeStyle = `rgba(255,255,255,${.4 + .4*Math.sin(ctx.t*3)})`; g.lineWidth = 3;
      g.beginPath(); g.arc(BUD.x, BUD.y, 60 + 6*Math.sin(ctx.t*3), 0, 7); g.stroke();
      bigText(g, 'Tipp auf die Knospe', 300, 520, 34, '#fff', 'rgba(120,70,80,.85)');
    }
    for(const p of petals){ g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = 'rgba(232,140,160,.9)'; g.beginPath(); g.ellipse(0, 0, p.s*.6, p.s, 0, 0, 7); g.fill(); g.restore(); }
    for(const f of flies){
      const x = f.x + Math.sin(ctx.t*f.sp + f.ph)*120, y = f.y + Math.sin(ctx.t*f.sp*1.7 + f.ph)*60, w = Math.abs(Math.sin(ctx.t*12 + f.ph));
      g.save(); g.translate(x, y); g.fillStyle = 'rgba(255,190,210,.9)';
      g.beginPath(); g.ellipse(-8*w, 0, 9*w + 1, 12, -.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(8*w, 0, 9*w + 1, 12, .4, 0, 7); g.fill();
      g.fillStyle = '#5e3c45'; g.fillRect(-1.5, -9, 3, 18); g.restore();
    }
    if(phase === 'msg'){
      const a = Math.min(1, el/1.2); g.globalAlpha = a;
      g.fillStyle = 'rgba(255,250,245,.85)'; g.fillRect(50, 440, 500, VON ? 170 : 130);
      g.fillStyle = '#7d4e57'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'italic bold 36px Georgia, serif';
      wrapText(g, TEXT, 300, 485, 460, 44);
      if(VON){ g.font = 'italic 28px Georgia, serif'; g.fillText('– ' + VON, 300, 580); }
      g.globalAlpha = 1;
    }
  }
};
startCard(scene);
