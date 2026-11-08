// Geburtstagstorte: Die Torte dreht sich, auf jeder Etage brennen Kerzen.
// Antippen oder Wischen pustet Kerzen aus – und dreht die Torte schneller.
// Einzelne Kerzen gehen wieder an. Alle aus vor Ablauf der Zeit -> Konfetti + Happy Birthday.
import { startCard, confetti, drawConfetti, bigText, rnd } from '../core/card.js';

const name = new URLSearchParams(location.search).get('name');
const GAME = 30;                                  // Sekunden
// Kerzenringe (Kartenkoordinaten 600x900): Mitte, Radius, Ellipsenhöhe, Anzahl,
// hide = Radius der darüberliegenden Etage (dahinter verdeckt), Kerzenhöhe
const RINGS = [
  { cx: 300, cy: 338, rx: 84,  ry: 15, n: 10, hide: 0,   h: 46 },   // oben
  { cx: 300, cy: 427, rx: 129, ry: 21, n: 16, hide: 118, h: 40 },   // 2. Etage
  { cx: 300, cy: 523, rx: 156, ry: 25, n: 20, hide: 144, h: 40 },   // 3. Etage
];
const COLS = ['#f7b6c8', '#bfe6d3', '#fff3dc', '#f9d27a'];

let candles, smoke, conf, state, endT, rot, spin, timeLeft, relightT, lastX, started;

function pos(c){
  const R = RINGS[c.ring], a = c.a + rot;
  const sx = Math.sin(a), z = Math.cos(a);
  const s = 1 + .1*z;                             // Perspektive
  const x = R.cx + R.rx*sx, y = R.cy + R.ry*z;
  const vis = R.hide === 0 || z > -.05 || Math.abs(R.rx*sx) > R.hide;
  return { x, y, z, s, vis, h: R.h*s, top: y - R.h*s };
}

function blowOut(c, p, ctx){
  c.on = false;
  for(let i=0;i<8;i++) smoke.push({ x: p.x + rnd(-3, 3), y: p.top - 6, vx: rnd(-12, 12), vy: rnd(-55, -30), r: rnd(3, 6), a: .55 });
  ctx.noise(0, .25, .18, 1200);
  ctx.tone(rnd(500, 750), .03, .12, 'sine', .05);
  if(candles.every(k => !k.on)) win(ctx);
}
function win(ctx){
  state = 'win'; endT = 0; conf = confetti(170);
  // Happy Birthday (gemeinfrei)
  ctx.melody([['G4',.75],['G4',.25],['A4',1],['G4',1],['C5',1],['B4',2],['G4',.75],['G4',.25],['A4',1],['G4',1],['D5',1],['C5',2],['G4',.75],['G4',.25],['G5',1],['E5',1],['C5',1],['B4',1],['A4',2],['F5',.75],['F5',.25],['E5',1],['C5',1],['D5',1],['C5',2.5]], 180, 'triangle', .14, .4);
  setTimeout(() => ctx.showAgain(true), 2500);
}
function hitAt(x, y, r, ctx){
  let best = null, bd = r;
  for(const c of candles){
    if(!c.on) continue; const p = pos(c); if(!p.vis) continue;
    const d = Math.hypot(x - p.x, (y - (p.top - 8))*.8);
    if(d < bd){ bd = d; best = [c, p]; }
  }
  if(best) blowOut(best[0], best[1], ctx);
  return !!best;
}
function drawCandle(g, c, p, t){
  const w = 9*p.s;
  g.save();
  if(!p.vis) g.globalAlpha = 0;
  // Kerze
  g.fillStyle = COLS[c.col]; g.fillRect(p.x - w/2, p.top, w, p.h);
  g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(p.x - w/2 + 1, p.top, w*.3, p.h);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(p.x + w*.2, p.top, w*.3, p.h);
  g.fillStyle = '#d4a63c';
  for(let k=0;k<4;k++){ const yy = p.top + 6 + k*p.h/4.2; g.beginPath(); g.arc(p.x + (k%2 ? 1.5 : -1.5), yy, 1.3, 0, 7); g.fill(); }
  // Docht
  g.strokeStyle = '#4a3a30'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(p.x, p.top); g.lineTo(p.x, p.top - 5); g.stroke();
  if(c.on){
    const tt = t*9 + c.ph, fl = 1 + Math.sin(tt)*.08 + Math.sin(tt*2.3)*.05;
    const h = 24*p.s*fl, fw = 11*p.s, fy = p.top - 3;
    const gl = g.createRadialGradient(p.x, fy - h*.4, 1, p.x, fy - h*.4, h*1.4);
    gl.addColorStop(0, 'rgba(255,220,140,.5)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(p.x, fy - h*.4, h*1.4, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, fy - h, 0, fy);
    gr.addColorStop(0, 'rgba(255,250,220,.95)'); gr.addColorStop(.55, 'rgba(255,190,60,.95)'); gr.addColorStop(1, 'rgba(255,120,30,.9)');
    g.fillStyle = gr; g.beginPath();
    g.moveTo(p.x + Math.sin(tt*1.3)*fw*.25, fy - h);
    g.quadraticCurveTo(p.x + fw*.55, fy - h*.35, p.x, fy);
    g.quadraticCurveTo(p.x - fw*.55, fy - h*.35, p.x + Math.sin(tt*1.3)*fw*.25, fy - h);
    g.fill();
  }
  g.restore();
}

const scene = {
  title: 'Happy Birthday!', subtitle: 'Puste alle Kerzen aus, bevor die Zeit abläuft – aber Vorsicht, die Torte dreht sich!', emoji: '🎂',
  accent: '#f3c98b', button: '#d9718f', bg: '#5a3a44',
  images: { leer: 'leer.png' },                    // Kartenbild ohne die gemalten Kerzen
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    candles = [];
    RINGS.forEach((R, i) => { for(let k=0;k<R.n;k++) candles.push({ ring: i, a: k/R.n*Math.PI*2 + (i ? .3*i : 0), on: true, ph: rnd(0, 6), col: (k + i) % COLS.length }); });
    smoke = []; conf = []; state = 'play'; endT = 0; rot = 0; spin = .45; timeLeft = GAME; relightT = 2.5; lastX = null; started = false;
    ctx.tone(660, 0, .15); ctx.tone(880, .1, .2);
  },
  onTap(x, y, ctx){
    if(state !== 'play') return;
    started = true; lastX = x;
    hitAt(x, y, 38, ctx);
    spin += (spin >= 0 ? 1 : -1) * .35;            // jedes Antippen dreht schneller
  },
  onDrag(x, y, ctx){
    if(state !== 'play') return;
    hitAt(x, y, 30, ctx);
    if(lastX !== null) spin += (x - lastX) * .012;  // Wischen schubst die Torte an
    lastX = x;
  },
  onRelease(){ lastX = null; },
  update(dt, ctx){
    for(const s of smoke){ s.x += s.vx*dt; s.y += s.vy*dt; s.r += 10*dt; s.a -= .35*dt; }
    smoke = smoke.filter(s => s.a > 0);
    // Drehung: Schwung klingt langsam auf die Grundgeschwindigkeit ab
    const base = spin >= 0 ? .45 : -.45;
    spin = base + (spin - base)*Math.pow(.55, dt);
    spin = Math.max(-6, Math.min(6, spin));
    rot += spin*dt;
    if(state === 'play' && ctx.t > 1.2){
      timeLeft -= dt;
      relightT -= dt;
      if(relightT <= 0){
        const off = candles.filter(c => !c.on);
        if(off.length){ const c = off[Math.floor(Math.random()*off.length)]; c.on = true; ctx.tone(1200, 0, .08, 'sine', .03); }
        relightT = rnd(.7, 1.5) * (timeLeft < 10 ? .7 : 1);
      }
      if(timeLeft <= 0){
        timeLeft = 0; state = 'lost'; endT = 0;
        ctx.melody([['E5',.5],['D5',.5],['C5',1],['G4',1.5]], 120, 'triangle', .12);
        setTimeout(() => ctx.showAgain(true), 1500);
      }
    }
    if(state !== 'play') endT += dt;
  },
  draw(g, ctx){
    if(ctx.img.leer) g.drawImage(ctx.img.leer, 205, 215, 190, 120);
    const list = candles.map(c => [c, pos(c)]).sort((a, b) => a[1].z - b[1].z || a[0].ring - b[0].ring);
    for(const [c, p] of list) drawCandle(g, c, p, ctx.t);
    for(const s of smoke){ g.fillStyle = `rgba(230,230,235,${s.a})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
    // Anzeige
    const lit = candles.filter(c => c.on).length;
    g.fillStyle = 'rgba(90,40,60,.6)';
    g.beginPath(); g.roundRect(40, 760, 150, 50, 16); g.fill();
    g.beginPath(); g.roundRect(410, 760, 150, 50, 16); g.fill();
    g.fillStyle = timeLeft < 10 && state === 'play' && Math.sin(ctx.t*10) > 0 ? '#ffd27a' : '#fff';
    g.font = 'bold 28px Georgia'; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.fillText('⏱ ' + Math.ceil(timeLeft) + ' s', 485, 786);
    g.fillStyle = '#fff'; g.fillText('🕯 ' + lit, 115, 786);
    if(state === 'play' && !started && ctx.t < 7){
      g.save(); g.globalAlpha = Math.min(1, ctx.t*1.5);
      bigText(g, 'Tippe oder wische die Kerzen aus!', 300, 712, 32, '#fff', 'rgba(150,60,90,.85)'); g.restore();
    }
    if(state === 'win'){
      g.fillStyle = `rgba(40,20,30,${Math.min(.35, endT*.3)})`; g.fillRect(0, 0, 600, 900);
      drawConfetti(g, conf, 1/60);
      const s = 1 + Math.sin(ctx.t*4)*.03;
      g.save(); g.translate(300, 470); g.scale(s, s);
      bigText(g, name ? 'Alles Gute,' : 'Alles Gute', 0, -40, 66);
      bigText(g, name ? name + '!' : 'zum Geburtstag!', 0, 40, name ? 72 : 52);
      g.restore();
    }
    if(state === 'lost'){
      g.fillStyle = `rgba(40,20,30,${Math.min(.45, endT*.4)})`; g.fillRect(0, 0, 600, 900);
      bigText(g, 'Puh, zu viele Kerzen!', 300, 420, 52);
      bigText(g, 'Noch ' + lit + ' brennen – nochmal?', 300, 490, 36, '#f3c98b');
    }
  }
};
startCard(scene);
