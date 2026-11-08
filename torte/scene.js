// Geburtstagstorte: Die ganze Torte dreht sich (Etagen, Zuckerguss, Perlen, Macarons, Kerzen).
// Auf jeder Etage brennen Kerzen. Antippen oder Wischen pustet sie aus – und dreht die Torte schneller.
// Einzelne Kerzen gehen wieder an. Alle aus vor Ablauf der Zeit -> Konfetti + Happy Birthday.
import { startCard, confetti, drawConfetti, bigText, rnd } from '../core/card.js';

const name = new URLSearchParams(location.search).get('name');
const GAME = 35;                                   // Sekunden
const CX = 300, E = .26;                           // Tortenachse, Ellipsen-Verhältnis (Blickwinkel)
const PINK = '#f4b8c3', MINT = '#bfe4d1', GOLD = '#d8b257', CREAM = '#fff4e2';
// Etagen von unten nach oben: Oberkante-Mitte cy, Radius rx, Höhe h, Körper-/Gussfarbe
const TIERS = [
  { cy: 523, rx: 172, h: 87, body: PINK, top: MINT, drips: 30 },
  { cy: 431, rx: 142, h: 92, body: MINT, top: PINK, drips: 26 },
  { cy: 332, rx: 116, h: 99, body: PINK, top: MINT, drips: 22 },
];
const PLATE = { cy: 625, rx: 206 };
const CANDLE_COLS = [['#f7a9bd', '#fff'], ['#9fd9bf', '#fff'], ['#fff1d6', '#e8b85c'], ['#f6d27a', '#fff']];

// feste Zufallsmuster (Perlen, Tropfenlängen), damit sie sich mitdrehen
const seeded = (n => () => (n = (n*16807) % 2147483647) / 2147483647)(7);
for(const T of TIERS){
  T.len = Array.from({length: T.drips}, () => 12 + seeded()*30);
  T.dots = Array.from({length: 70}, () => ({ a: seeded()*6.283, f: .2 + seeded()*.75, r: .9 + seeded()*1.3 }));
}

let items, smoke, conf, state, endT, rot, spin, timeLeft, relightT, lastX, started;

function buildItems(){
  const it = [];
  const ring = (lvl, cy, r, n, kind, off=0) => { for(let k=0;k<n;k++) it.push({ lvl, cy, r, a: k/n*6.283 + off, kind, on: true, ph: rnd(0, 6), col: k % 4, alt: k % 2 }); };
  // Teller (Etage 0): Deko rund um die unterste Etage
  ring(0, PLATE.cy - 8, 188, 22, 'deco');
  // unterste Etage: Kerzen und Deko auf dem Rand
  ring(1, TIERS[0].cy, 157, 18, 'candle');
  ring(1, TIERS[0].cy, 157, 18, 'rose', .175);
  // mittlere Etage
  ring(2, TIERS[1].cy, 129, 14, 'candle', .1);
  ring(2, TIERS[1].cy, 129, 14, 'rose', .32);
  // oberste Etage: Kerzenkranz + Macarons am Rand
  ring(3, TIERS[2].cy, 74, 12, 'candle');
  ring(3, TIERS[2].cy, 101, 12, 'deco', .26);
  return it;
}
const candles = () => items.filter(i => i.kind === 'candle');

function place(i){
  const a = i.a + rot, s = Math.sin(a), c = Math.cos(a), k = 1 + .07*c;
  return { x: CX + i.r*s, y: i.cy + i.r*E*c, c, k };
}

/* ---------- Zeichnen ---------- */
function shadeGrad(g, x0, x1, col){
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, 'rgba(110,60,60,.28)'); gr.addColorStop(.18, 'rgba(110,60,60,.06)');
  gr.addColorStop(.42, 'rgba(255,255,255,.18)'); gr.addColorStop(.7, 'rgba(110,60,60,.04)'); gr.addColorStop(1, 'rgba(110,60,60,.32)');
  return gr;
}
function bodyPath(g, T){
  const ry = T.rx*E;
  g.beginPath(); g.moveTo(CX - T.rx, T.cy); g.lineTo(CX - T.rx, T.cy + T.h);
  g.ellipse(CX, T.cy + T.h, T.rx, ry, 0, Math.PI, 0, true);
  g.lineTo(CX + T.rx, T.cy); g.ellipse(CX, T.cy, T.rx, ry, 0, 0, Math.PI, false); g.closePath();
}
function drawTier(g, T){
  const ry = T.rx*E;
  // Schatten auf der Fläche darunter
  g.save(); g.shadowColor = 'rgba(110,50,60,.45)'; g.shadowBlur = 14; g.fillStyle = 'rgba(150,90,95,.35)';
  g.beginPath(); g.ellipse(CX, T.cy + T.h + 3, T.rx*1.02, ry*1.05, 0, 0, 6.283); g.fill(); g.restore();
  g.save(); bodyPath(g, T); g.fillStyle = T.body; g.fill(); g.clip();
  // Goldperlen auf der Seite (drehen sich mit)
  g.fillStyle = GOLD;
  for(const d of T.dots){ const a = d.a + rot, c = Math.cos(a); if(c < .08) continue;
    g.globalAlpha = .55 + .45*c; g.beginPath(); g.arc(CX + T.rx*Math.sin(a), T.cy + ry*c + d.f*T.h, d.r*(.6 + .4*c), 0, 7); g.fill(); }
  g.globalAlpha = 1;
  // Zuckerguss-Kragen + Tropfen
  g.fillStyle = T.top;
  g.beginPath(); g.ellipse(CX, T.cy, T.rx, ry, 0, 0, Math.PI, false); g.ellipse(CX, T.cy + 10, T.rx, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
  for(let k=0;k<T.drips;k++){
    const a = k/T.drips*6.283 + rot, s = Math.sin(a), c = Math.cos(a); if(c <= 0) continue;
    const x = CX + T.rx*s, y = T.cy + ry*c + 6, w = 13*Math.pow(c, .6) + 2, L = T.len[k];
    g.beginPath(); g.moveTo(x - w/2, y); g.lineTo(x - w/2, y + L); g.arc(x, y + L, w/2, Math.PI, 0, true); g.lineTo(x + w/2, y); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - w*.3, y + 2, w*.18, L*.8); g.fillStyle = T.top;
  }
  // Rundung/Licht
  g.fillStyle = shadeGrad(g, CX - T.rx, CX + T.rx); g.fillRect(CX - T.rx, T.cy - ry, T.rx*2, T.h + 2*ry + 4);
  g.restore();
  g.save(); bodyPath(g, T); g.strokeStyle = 'rgba(160,95,100,.35)'; g.lineWidth = 1.5; g.stroke(); g.restore();
  // Oberseite
  const tg = g.createLinearGradient(0, T.cy - ry, 0, T.cy + ry);
  tg.addColorStop(0, T.top); tg.addColorStop(1, 'rgba(255,255,255,.0)');
  g.fillStyle = T.top; g.beginPath(); g.ellipse(CX, T.cy, T.rx, ry, 0, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(CX - T.rx*.15, T.cy - ry*.2, T.rx*.7, ry*.55, 0, 0, 6.283); g.fill();
}
function drawPlate(g){
  const ry = PLATE.rx*E;
  g.fillStyle = '#efe7e0'; g.beginPath(); g.ellipse(CX, PLATE.cy + 12, PLATE.rx, ry, 0, 0, 6.283); g.fill();
  const gr = g.createLinearGradient(CX - PLATE.rx, 0, CX + PLATE.rx, 0);
  gr.addColorStop(0, '#e9dfd8'); gr.addColorStop(.45, '#fffdfb'); gr.addColorStop(1, '#e4d9d2');
  g.fillStyle = gr; g.beginPath(); g.ellipse(CX, PLATE.cy, PLATE.rx, ry, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(180,160,150,.35)'; g.lineWidth = 2; g.stroke();
}
function drawRose(g, p, col){
  const r = 11*p.k;
  g.fillStyle = col; g.beginPath(); g.ellipse(p.x, p.y - r*.55, r, r*.8, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.6;
  for(let k=0;k<3;k++){ g.beginPath(); g.arc(p.x, p.y - r*.6, r*(.75 - k*.22), 3.6 + k + rot, 5.6 + k + rot); g.stroke(); }
  g.fillStyle = GOLD; g.beginPath(); g.arc(p.x, p.y - r*1.2, 2.2*p.k, 0, 7); g.fill();
}
function drawMacaron(g, p, col){
  const w = 19*p.k, h = 8*p.k, y = p.y - h*2.1;
  g.fillStyle = 'rgba(120,60,70,.25)'; g.beginPath(); g.ellipse(p.x, p.y, w*1.05, h*.7, 0, 0, 6.283); g.fill();
  g.fillStyle = col; g.beginPath(); g.ellipse(p.x, y + h*1.3, w, h, 0, 0, 6.283); g.fill();
  g.fillStyle = CREAM; g.fillRect(p.x - w*.92, y - h*.15, w*1.84, h*.9);
  g.fillStyle = col; g.beginPath(); g.ellipse(p.x, y - h*.3, w, h*1.05, 0, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(p.x - w*.3, y - h*.6, w*.4, h*.35, 0, 0, 6.283); g.fill();
}
function candleTop(i, p){ return p.y - 60*p.k; }
function drawCandle(g, i, p, t){
  const w = 13*p.k, h = 60*p.k, top = p.y - h, [c1, c2] = CANDLE_COLS[i.col];
  g.save();
  g.beginPath(); g.rect(p.x - w/2, top, w, h); g.clip();
  g.fillStyle = c1; g.fillRect(p.x - w/2, top, w, h);
  g.strokeStyle = c2; g.lineWidth = 3*p.k;                                     // Spiralstreifen
  for(let yy = top - w; yy < p.y + w; yy += 11*p.k){ g.beginPath(); g.moveTo(p.x - w/2, yy + w*.8); g.lineTo(p.x + w/2, yy); g.stroke(); }
  const sg = g.createLinearGradient(p.x - w/2, 0, p.x + w/2, 0);
  sg.addColorStop(0, 'rgba(0,0,0,.18)'); sg.addColorStop(.35, 'rgba(255,255,255,.35)'); sg.addColorStop(1, 'rgba(0,0,0,.25)');
  g.fillStyle = sg; g.fillRect(p.x - w/2, top, w, h);
  g.restore();
  g.strokeStyle = '#3e3029'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, top); g.lineTo(p.x, top - 7*p.k); g.stroke();
  if(i.on){
    const tt = t*9 + i.ph, fl = 1 + Math.sin(tt)*.09 + Math.sin(tt*2.3)*.05;
    const fh = 32*p.k*fl, fw = 15*p.k, fy = top - 5*p.k;
    const gl = g.createRadialGradient(p.x, fy - fh*.4, 1, p.x, fy - fh*.4, fh*1.2);
    gl.addColorStop(0, 'rgba(255,220,140,.4)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(p.x, fy - fh*.4, fh*1.2, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, fy - fh, 0, fy);
    gr.addColorStop(0, 'rgba(255,250,220,.97)'); gr.addColorStop(.55, 'rgba(255,190,60,.97)'); gr.addColorStop(1, 'rgba(255,110,30,.92)');
    g.fillStyle = gr; g.beginPath();
    g.moveTo(p.x + Math.sin(tt*1.3)*fw*.25, fy - fh);
    g.quadraticCurveTo(p.x + fw*.55, fy - fh*.35, p.x, fy);
    g.quadraticCurveTo(p.x - fw*.55, fy - fh*.35, p.x + Math.sin(tt*1.3)*fw*.25, fy - fh);
    g.fill();
  }
}
function drawItem(g, i, p, t){
  if(i.kind === 'candle') return drawCandle(g, i, p, t);
  if(i.kind === 'rose') return drawRose(g, p, i.lvl % 2 ? '#f8d3da' : '#d4eee1');
  return i.alt ? drawMacaron(g, p, i.col % 2 ? '#f4b3c2' : '#a9dcc4') : drawRose(g, p, '#f8d3da');
}

/* ---------- Spiel ---------- */
function blowOut(i, p, ctx){
  i.on = false;
  const top = candleTop(i, p);
  for(let k=0;k<9;k++) smoke.push({ x: p.x + rnd(-3, 3), y: top - 8, vx: rnd(-12, 12), vy: rnd(-60, -30), r: rnd(3, 7), a: .55 });
  ctx.noise(0, .25, .18, 1200); ctx.tone(rnd(500, 750), .03, .12, 'sine', .05);
  if(candles().every(k => !k.on)) win(ctx);
}
function win(ctx){
  state = 'win'; endT = 0; conf = confetti(170);
  // Happy Birthday (gemeinfrei)
  ctx.melody([['G4',.75],['G4',.25],['A4',1],['G4',1],['C5',1],['B4',2],['G4',.75],['G4',.25],['A4',1],['G4',1],['D5',1],['C5',2],['G4',.75],['G4',.25],['G5',1],['E5',1],['C5',1],['B4',1],['A4',2],['F5',.75],['F5',.25],['E5',1],['C5',1],['D5',1],['C5',2.5]], 180, 'triangle', .14, .4);
  setTimeout(() => ctx.showAgain(true), 2500);
}
function visible(i, p){                       // hinter der oberen Etage verdeckt?
  if(p.c > -.05 || i.lvl === 3) return true;
  const up = TIERS[i.lvl];                       // Etage über diesem Ring
  return !up || Math.abs(p.x - CX) > up.rx;
}
function hitAt(x, y, r, ctx){
  let best = null, bd = r;
  for(const i of items){
    if(i.kind !== 'candle' || !i.on) continue; const p = place(i); if(!visible(i, p)) continue;
    const d = Math.hypot(x - p.x, (y - (candleTop(i, p) - 10))*.75);
    if(d < bd){ bd = d; best = [i, p]; }
  }
  if(best) blowOut(best[0], best[1], ctx);
}

const scene = {
  title: 'Happy Birthday!', subtitle: 'Puste alle Kerzen aus, bevor die Zeit abläuft – aber Vorsicht, die Torte dreht sich!', emoji: '🎂',
  accent: '#f3c98b', button: '#d9718f', bg: '#5a3a44',
  images: { leer: 'leer.png' },                    // Hintergrund über der Torte ohne die gemalten Kerzen
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    items = buildItems(); smoke = []; conf = []; state = 'play'; endT = 0;
    rot = 0; spin = .45; timeLeft = GAME; relightT = 2.5; lastX = null; started = false;
    ctx.tone(660, 0, .15); ctx.tone(880, .1, .2);
  },
  onTap(x, y, ctx){
    if(state !== 'play') return;
    started = true; lastX = x;
    hitAt(x, y, 40, ctx);
    spin += (spin >= 0 ? 1 : -1) * .35;            // jedes Antippen dreht schneller
  },
  onDrag(x, y, ctx){
    if(state !== 'play') return;
    hitAt(x, y, 32, ctx);
    if(lastX !== null) spin += (x - lastX) * .012;  // Wischen schubst die Torte an
    lastX = x;
  },
  onRelease(){ lastX = null; },
  update(dt, ctx){
    for(const s of smoke){ s.x += s.vx*dt; s.y += s.vy*dt; s.r += 10*dt; s.a -= .35*dt; }
    smoke = smoke.filter(s => s.a > 0);
    const base = spin >= 0 ? .45 : -.45;
    spin = base + (spin - base)*Math.pow(.55, dt);
    spin = Math.max(-6, Math.min(6, spin));
    rot += spin*dt;
    if(state === 'play' && ctx.t > 1.2){
      timeLeft -= dt; relightT -= dt;
      if(relightT <= 0){
        const off = candles().filter(c => !c.on);
        if(off.length){ off[Math.floor(Math.random()*off.length)].on = true; ctx.tone(1200, 0, .08, 'sine', .03); }
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
    const P = items.map(i => [i, place(i)]);
    const back = lvl => P.filter(([i, p]) => i.lvl === lvl && p.c < 0).sort((a, b) => a[1].y - b[1].y);
    // von hinten/unten nach vorn/oben aufbauen
    drawPlate(g);
    for(const [i, p] of back(0)) drawItem(g, i, p, ctx.t);
    TIERS.forEach((T, n) => { drawTier(g, T); for(const [i, p] of back(n + 1)) if(visible(i, p)) drawItem(g, i, p, ctx.t); });
    for(const [i, p] of P.filter(([i, p]) => p.c >= 0).sort((a, b) => a[1].y - b[1].y)) drawItem(g, i, p, ctx.t);
    for(const s of smoke){ g.fillStyle = `rgba(230,230,235,${s.a})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
    // Anzeige
    const lit = candles().filter(c => c.on).length;
    g.fillStyle = 'rgba(90,40,60,.6)';
    g.beginPath(); g.roundRect(40, 760, 150, 50, 16); g.fill();
    g.beginPath(); g.roundRect(410, 760, 150, 50, 16); g.fill();
    g.font = 'bold 28px Georgia'; g.textBaseline = 'middle'; g.textAlign = 'center';
    g.fillStyle = timeLeft < 10 && state === 'play' && Math.sin(ctx.t*10) > 0 ? '#ffd27a' : '#fff';
    g.fillText('⏱ ' + Math.ceil(timeLeft) + ' s', 485, 786);
    g.fillStyle = '#fff'; g.fillText('🕯 ' + lit, 115, 786);
    if(state === 'play' && !started && ctx.t < 7){
      g.save(); g.globalAlpha = Math.min(1, ctx.t*1.5);
      bigText(g, 'Tippe oder wische die Kerzen aus!', 300, 235, 32, '#fff', 'rgba(150,60,90,.85)'); g.restore();
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
