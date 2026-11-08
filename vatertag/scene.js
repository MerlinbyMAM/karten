// Vatertag: Grillmeister. Sechs Würstchen brutzeln auf dem Rost.
// Tippen, wenn die Unterseite goldbraun ist = wenden; ist die zweite Seite goldbraun, nochmal tippen = auf den Teller.
// Zu früh = „Noch roh!“, zu spät = verkohlt (Punktabzug). 45 Sekunden, dann Finale mit Gruß an Papa.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, rnd, MEL } from '../core/kit.js';

let GX = 300, GY = 468;                                   // Mitte des Grillrosts – nach Motiv eingestellt
const TIME = 45, COLS = 3, ROWS = 2, SW = 120, SH = 34, DX = 150, DY = 92;
let slots, fx, fin, time, pts, tt, over, served, heat, plate;

const slotPos = i => ({ x: GX + ((i % COLS) - 1)*DX, y: GY + (Math.floor(i/COLS) - .5)*DY });
const fresh = () => ({ side: 0, cook: [0, 0], rate: rnd(.17, .25), wait: rnd(.2, 1.2), sizzle: 0, gone: 0 });

// Farbe nach Garstufe: roh rosa → goldbraun → dunkel → verkohlt
function cookCol(c){
  const st = [[0, [236, 160, 150]], [.55, [214, 132, 92]], [.85, [176, 92, 44]], [1.05, [120, 58, 30]], [1.25, [40, 26, 22]]];
  let a = st[0], b = st[st.length - 1];
  for(let i = 0; i < st.length - 1; i++) if(c >= st[i][0] && c <= st[i + 1][0]){ a = st[i]; b = st[i + 1]; break; }
  if(c > st[st.length - 1][0]) a = b;
  const k = a === b ? 0 : (c - a[0])/(b[0] - a[0]);
  return `rgb(${a[1].map((v, j) => Math.round(v + (b[1][j] - v)*k)).join(',')})`;
}

function drawGrate(g){
  const w = DX*COLS + 30, h = DY*ROWS + 40;
  g.save();
  // Glut darunter
  const gl = g.createRadialGradient(GX, GY, 20, GX, GY, w*.6);
  gl.addColorStop(0, `rgba(255,${120 + Math.sin(tt*3)*20},40,${.55 + heat*.2})`); gl.addColorStop(1, 'rgba(120,30,10,0)');
  g.fillStyle = gl; g.beginPath(); g.ellipse(GX, GY, w*.62, h*.62, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(25,18,16,.82)'; g.beginPath(); g.roundRect(GX - w/2, GY - h/2, w, h, 22); g.fill();
  for(let i = 0; i < 26; i++){ const x = GX - w/2 + 20 + (i*37 % (w - 40)), y = GY - h/2 + 18 + (i*53 % (h - 36));
    g.fillStyle = `rgba(255,${90 + (i*29 % 80)},30,${.35 + .3*Math.sin(tt*2 + i)})`; g.beginPath(); g.arc(x, y, 5 + i % 4, 0, 7); g.fill(); }
  g.strokeStyle = '#8d8a86'; g.lineWidth = 4; g.lineCap = 'round';
  for(let x = GX - w/2 + 16; x <= GX + w/2 - 16; x += 22){ g.beginPath(); g.moveTo(x, GY - h/2 + 10); g.lineTo(x, GY + h/2 - 10); g.stroke(); }
  g.strokeStyle = '#b9b5ae'; g.lineWidth = 6; g.beginPath(); g.roundRect(GX - w/2 + 6, GY - h/2 + 6, w - 12, h - 12, 18); g.stroke();
  g.restore();
}

function drawSausage(g, s, p){
  if(s.gone || s.wait > 0) return;
  const c = s.cook[s.side], up = s.cook[1 - s.side];
  g.save(); g.translate(p.x, p.y + Math.sin(tt*20 + p.x)*(s.sizzle > 0 ? 1.5 : 0));
  if(s.flip > 0){ g.scale(1, Math.abs(Math.cos(s.flip*Math.PI)) * .8 + .2); g.translate(0, -Math.sin(s.flip*Math.PI)*40); }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(4, 10, SW/2, SH/2.4, 0, 0, 7); g.fill();
  // sichtbar ist die Oberseite; ihre Bräune = schon gegrillte Seite, plus Randglühen der Unterseite
  const gr = g.createLinearGradient(0, -SH/2, 0, SH/2);
  gr.addColorStop(0, cookCol(Math.max(up, c*.7))); gr.addColorStop(.6, cookCol(Math.max(up, c*.85))); gr.addColorStop(1, cookCol(Math.max(up, c)));
  g.fillStyle = gr; g.beginPath(); g.roundRect(-SW/2, -SH/2, SW, SH, SH/2); g.fill();
  if(Math.max(up, c) > .45){ g.strokeStyle = 'rgba(40,20,10,.55)'; g.lineWidth = 4; for(const dx of [-30, 0, 30]){ g.beginPath(); g.moveTo(dx - 8, -SH/2 + 6); g.lineTo(dx + 8, SH/2 - 6); g.stroke(); } }
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(-SW/2 + 14, -SH/2 + 5, SW - 40, 6, 3); g.fill();
  g.restore();
  // Garanzeige: Ring füllt sich, golden = jetzt tippen
  const gold = c >= .75 && c <= 1.08;
  g.save(); g.lineWidth = 7; g.lineCap = 'round';
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(p.x + SW/2 + 4, p.y - SH/2 - 4, 13, 0, 7); g.stroke();
  g.strokeStyle = c > 1.08 ? '#ff4b2b' : gold ? '#ffd34d' : '#f4efe6';
  g.beginPath(); g.arc(p.x + SW/2 + 4, p.y - SH/2 - 4, 13, -Math.PI/2, -Math.PI/2 + Math.min(1, c/1.08)*Math.PI*2); g.stroke();
  if(gold){ g.globalAlpha = .5 + .5*Math.sin(tt*12); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(p.x + SW/2 + 4, p.y - SH/2 - 4, 6, 0, 7); g.fill(); }
  g.restore();
}

function drawPlate(g){
  const x = GX, y = GY + DY*ROWS/2 + 100;
  g.save(); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + 4, y + 8, 92, 24, 0, 0, 7); g.fill();
  g.fillStyle = '#fbf7ef'; g.beginPath(); g.ellipse(x, y, 92, 24, 0, 0, 7); g.fill();
  g.strokeStyle = '#d9cfbd'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 70, 17, 0, 0, 7); g.stroke();
  const n = Math.min(served, 9);
  for(let i = 0; i < n; i++){ const px = x - 52 + (i % 5)*26, py = y - 6 - Math.floor(i/5)*12;
    g.fillStyle = '#9a5228'; g.beginPath(); g.roundRect(px - 9, py - 26, 18, 52, 9); g.fill(); }
  g.restore();
  plate = { x, y };
}

const scene = {
  title: t('vatertag.title'), subtitle: t('vatertag.sub'), emoji: '🌭',
  accent: '#ffcf7a', button: '#c0542b', bg: '#3b2a1e',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ slots = Array.from({ length: COLS*ROWS }, fresh); time = TIME; pts = 0; tt = 0; over = false; served = 0; heat = 0; plate = null; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    let bi = -1, bd = 1e9;
    slots.forEach((s, i) => { if(s.gone || s.wait > 0 || s.flip > 0) return; const p = slotPos(i), d = Math.hypot((x - p.x)/1.6, y - p.y); if(d < bd){ bd = d; bi = i; } });
    if(bi < 0 || bd > 70) return;
    const s = slots[bi], p = slotPos(bi), c = s.cook[s.side];
    if(c < .55){ fx.pop(p.x, p.y - 40, t('vatertag.raw'), '#ffe2d6', 30); ctx.tone(330, 0, .1, 'sine', .07); return; }
    const perfect = c >= .75 && c <= 1.08, gain = perfect ? 2 : 1;
    pts += gain;
    if(s.side === 0){
      s.side = 1; s.flip = .001; ctx.noise(0, .12, .05, 2000); ctx.tone(perfect ? 880 : 660, 0, .1, 'triangle', .09);
      fx.pop(p.x, p.y - 44, perfect ? t('vatertag.perfect') : '+1', perfect ? '#ffd34d' : '#fff', perfect ? 32 : 28);
      if(perfect) fx.sparkle(p.x, p.y, 10);
    } else {
      s.gone = 1; served++; ctx.melody([['C5', .25], ['E5', .25], ['G5', .5]], 300, 'triangle', .1);
      fx.pop(p.x, p.y - 44, perfect ? t('vatertag.served') : '+1', perfect ? '#ffd34d' : '#fff', perfect ? 32 : 28);
      fx.burst(p.x, p.y, 12, ['#ffd34d', '#ff9a3c', '#fff'], 200, 300, 6);
      setTimeout(() => { slots[bi] = fresh(); }, 600);
    }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(!over){ time -= dt; if(time <= 0){ time = 0; this.finish(ctx); } }
    heat = Math.min(1, (TIME - time)/TIME);
    if(over) return;
    slots.forEach((s, i) => {
      if(s.gone) return;
      if(s.wait > 0){ s.wait -= dt; return; }
      if(s.flip > 0){ s.flip += dt*2.6; if(s.flip >= 1) s.flip = 0; return; }
      s.cook[s.side] += dt*s.rate*(1 + heat*.6); s.sizzle = 1;
      if(Math.random() < dt*3*s.cook[s.side]){ const p = slotPos(i); fx.burst(p.x + rnd(-40, 40), p.y - 10, 1, s.cook[s.side] > 1.08 ? ['#555', '#777'] : ['rgba(255,255,255,.7)'], 40, -60, 9); }
      if(s.cook[s.side] > 1.3){
        const p = slotPos(i); s.gone = 1; pts = Math.max(0, pts - 2);
        fx.pop(p.x, p.y - 44, t('vatertag.burnt'), '#ff8a6a', 30); fx.burst(p.x, p.y, 16, ['#333', '#555', '#888'], 120, -40, 12); fx.shake(4);
        ctx.tone(150, 0, .3, 'sawtooth', .06);
        setTimeout(() => { slots[i] = fresh(); }, 900);
      }
    });
  },
  finish(ctx){
    over = true; const b = best('vatertag', pts);
    fin.start(ctx, greeting('vatertag'), [t('vatertag.score', { n: pts }) + (b.isNew ? '  ★' : ''), t('vatertag.best', { n: b.best })], MEL.fanfare);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(!fin.on) hud(g, ['🔥 ' + pts, '⏱ ' + Math.ceil(time) + ' s', '🏆 ' + (peekBest('vatertag') ?? '–')], 262);
    fx.applyShake(g);
    drawGrate(g);
    slots.forEach((s, i) => drawSausage(g, s, slotPos(i)));
    drawPlate(g);
    fx.draw(g); g.restore();
    if(!fin.on && pts === 0 && served === 0) hint(g, t('vatertag.hint'), tt, 345, 5);
    fin.draw(g, dt, 'rgba(50,25,10,');
  }
};
startCard(scene);
window.__vt = { slots: () => slots, pos: slotPos, get pts(){ return pts; } };
