// Baukasten für die Lebendigen Karten: gemeinsame Bausteine aller Spiele.
// Partikel, schwebende Texte, Anzeige-Leiste, Bestwert pro Karte, Finale mit Name und Konfetti,
// fertige Melodien. Jede Szene nutzt nur, was sie braucht – die Kartenlogik bleibt in core/card.js.
import { t, confetti, drawConfetti, bigText, rnd } from './card.js';

/* ---------- Gruß aus ?name= / ?text= ---------- */
export function greeting(card){
  const q = new URLSearchParams(location.search), n = (q.get('name') || '').trim();
  return q.get('text') || (n ? t(card + '.msgN', { name: n }) : t(card + '.msg'));
}
export const nameParam = () => (new URLSearchParams(location.search).get('name') || '').trim();

/* ---------- Partikel und schwebende Texte ---------- */
export function makeFx(){
  let parts = [], pops = [], shake = 0;
  return {
    burst(x, y, n = 14, cols = ['#ffd34d', '#ff7aa8', '#7ad3ff', '#9cf27a', '#fff'], speed = 240, grav = 420, size = 7){
      for(let i=0;i<n;i++){ const a = rnd(0, 6.283), s = rnd(speed*.3, speed); parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - speed*.2, g: grav, c: cols[i % cols.length], s: rnd(size*.6, size*1.3), life: rnd(.5, 1), rot: rnd(0, 6) }); }
    },
    sparkle(x, y, n = 10){ for(let i=0;i<n;i++){ const a = rnd(0, 6.283), s = rnd(40, 160); parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, g: 0, c: '#fff6c2', s: rnd(2, 4), life: rnd(.4, .8), star: 1 }); } },
    pop(x, y, txt, col = '#fff', size = 36){ pops.push({ x, y, txt, col, size, life: 1.1 }); },
    shake(a = 8){ shake = Math.max(shake, a); },
    update(dt){
      for(const p of parts){ p.x += p.vx*dt; p.y += p.vy*dt; p.vy += p.g*dt; p.life -= dt; p.rot += dt*6; }
      parts = parts.filter(p => p.life > 0);
      for(const p of pops){ p.y -= 60*dt; p.life -= dt; }
      pops = pops.filter(p => p.life > 0);
      shake = Math.max(0, shake - dt*30);
    },
    // vor dem Zeichnen der Szene aufrufen; gibt zurück, ob verschoben wurde (danach g.restore())
    applyShake(g){ g.save(); if(shake > 0) g.translate(rnd(-shake, shake), rnd(-shake, shake)); },
    draw(g){
      for(const p of parts){
        g.globalAlpha = Math.max(0, Math.min(1, p.life*1.6)); g.fillStyle = p.c;
        if(p.star){ g.beginPath(); g.arc(p.x, p.y, p.s, 0, 7); g.fill(); }
        else { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.s/2, -p.s/2, p.s, p.s*.6); g.restore(); }
      }
      g.globalAlpha = 1;
      for(const p of pops){ g.globalAlpha = Math.max(0, Math.min(1, p.life*1.5)); bigText(g, p.txt, p.x, p.y, p.size, p.col, 'rgba(40,20,60,.85)'); }
      g.globalAlpha = 1;
    },
    clear(){ parts = []; pops = []; shake = 0; }
  };
}

/* ---------- Anzeige-Leiste (zwei oder drei Felder) ---------- */
export function hud(g, items, y = 150){
  const w = 560/items.length;
  g.save(); g.textBaseline = 'middle'; g.font = 'bold 28px Georgia';
  items.forEach((txt, i) => {
    const x = 20 + i*w;
    g.fillStyle = 'rgba(20,10,40,.45)'; g.beginPath(); g.roundRect(x + 4, y, w - 8, 50, 16); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(txt, x + w/2, y + 26, w - 20);
  });
  g.restore();
}

/* ---------- Bestwert dieser Karte auf diesem Handy ---------- */
export function best(card, score, higherIsBetter = true){
  const k = 'lk_best_' + card; let b = null;
  try{ b = JSON.parse(localStorage.getItem(k)); }catch(e){}
  const better = b === null || (higherIsBetter ? score > b : score < b);
  if(better) try{ localStorage.setItem(k, JSON.stringify(score)); }catch(e){}
  return { best: better ? score : b, isNew: better && b !== null };
}

export function peekBest(card){ try{ return JSON.parse(localStorage.getItem('lk_best_' + card)); }catch(e){ return null; } }

/* ---------- Finale: abdunkeln, Konfetti, Gruß, Ergebnis, „Nochmal“ ---------- */
export function makeFinale(){
  let on = false, tt = 0, conf = [], lines = [];
  return {
    get on(){ return on; },
    start(ctx, msg, sub = [], melody = MEL.fanfare){
      on = true; tt = 0; conf = confetti(160); lines = [msg, ...sub];
      if(melody) ctx.melody(melody, 150, 'triangle', .13);
      setTimeout(() => ctx.showAgain(true), 1600);
    },
    stop(){ on = false; },
    draw(g, dt, col = 'rgba(30,20,60,', maxA = .5){
      if(!on) return; tt += dt;
      g.fillStyle = col + Math.min(maxA, tt*.45) + ')'; g.fillRect(0, 0, 600, 900);
      drawConfetti(g, conf, dt);
      const s = 1 + Math.sin(tt*4)*.035;
      g.save(); g.translate(300, 400); g.scale(s, s);
      bigText(g, lines[0], 0, 0, lines[0].length > 16 ? 50 : 62, '#fff', 'rgba(60,20,70,.9)'); g.restore();
      lines.slice(1).forEach((l, i) => bigText(g, l, 300, 505 + i*52, 36, i ? '#ffffff' : '#ffd34d', 'rgba(60,20,70,.85)'));
    }
  };
}

/* ---------- Melodien (ctx.melody-Format) ---------- */
export const MEL = {
  fanfare: [['C5',.5],['E5',.5],['G5',.5],['C6',1],['G5',.5],['C6',1.5]],
  birthday: [['G4',.75],['G4',.25],['A4',1],['G4',1],['C5',1],['B4',2],['G4',.75],['G4',.25],['A4',1],['G4',1],['D5',1],['C5',2]],
  soft: [['E5',1],['G5',1],['C6',2],['B5',1],['G5',1],['E5',2]],
  oops: [['E4',.25],['C4',.5]]
};

/* ---------- kleine Zeichenhelfer ---------- */
export function shade(hex, p){ const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, v + p)); return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`; }
export function hint(g, text, ctxT, y = 470, until = 3.5){
  if(ctxT > until) return;
  g.globalAlpha = Math.min(1, until - ctxT); bigText(g, text, 300, y, 40, '#fff', 'rgba(40,20,60,.85)'); g.globalAlpha = 1;
}
export { rnd, bigText };

/* ---------- Spielschleier: legt sich beim Spielen weich über das gedruckte Hauptmotiv ---------- */
// a = Deckkraft 0..1 (weich ein-/ausblenden), Bereich y0..y1, rgb = Farbton als "r,g,b"
export function veil(g, a, y0 = 300, y1 = 820, rgb = '20,14,30'){
  if(a <= 0) return;
  const h = y1 - y0, gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(.12, `rgba(${rgb},${.62*a})`);
  gr.addColorStop(.88, `rgba(${rgb},${.62*a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.save(); g.fillStyle = gr; g.fillRect(0, y0, 600, h); g.restore();
}

/* ---------- Druck-Teile: Objekte deckungsgleich aus dem gedruckten Kartenbild ausschneiden und bewegen ---------- */
// piece = { x, y (Mitte), w, h, a (Drehung, rad), shape: 'rect'|'round'|'ellipse'|'capsule', r (Eckradius) }
export const cardImg = new Image(); cardImg.src = 'karte.jpg';
function piecePath(g, p, grow = 0){
  const w = p.w + grow*2, h = p.h + grow*2; g.beginPath();
  if(p.shape === 'ellipse') g.ellipse(0, 0, w/2, h/2, 0, 0, 7);
  else if(p.shape === 'capsule') g.roundRect(-w/2, -h/2, w, h, Math.min(w, h)/2);
  else g.roundRect(-w/2, -h/2, w, h, p.shape === 'round' ? (p.r ?? 14) + grow : (p.r ?? 0));
}
// Teil an Position x,y mit Drehung rot (zusätzlich zur eigenen), Skalierung s, Deckkraft al zeichnen
export function drawPiece(g, p, x = p.x, y = p.y, rot = 0, s = 1, al = 1, sx = s){
  if(!cardImg.complete || !cardImg.naturalWidth) return;
  g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate((p.a || 0) + rot); g.scale(sx, s);
  piecePath(g, p); g.clip(); g.rotate(-(p.a || 0)); g.translate(-p.x, -p.y);
  g.drawImage(cardImg, 0, 0, 600, 900); g.restore();
}
// Loch an der Originalstelle füllen: Bildstück aus der Nachbarschaft (dx,dy versetzt) – z. B. Himmel, Wiese, Wasser
export function fillHole(g, p, dx = 0, dy = 0, grow = 4){
  if(!cardImg.complete || !cardImg.naturalWidth) return;
  g.save(); g.translate(p.x, p.y); g.rotate(p.a || 0); piecePath(g, p, grow); g.clip(); g.rotate(-(p.a || 0)); g.translate(-p.x, -p.y);
  g.drawImage(cardImg, dx, dy, 600, 900); g.restore();
}
// Tönung über ein Teil legen (z. B. „roh“, „verwelkt“, „aus“)
export function tintPiece(g, p, x, y, rot, s, col){
  g.save(); g.translate(x, y); g.rotate((p.a || 0) + rot); g.scale(s, s); piecePath(g, p); g.fillStyle = col; g.fill(); g.restore();
}
export function hitPiece(p, x, y, pad = 8){
  const dx = x - p.x, dy = y - p.y, a = -(p.a || 0), u = dx*Math.cos(a) - dy*Math.sin(a), v = dx*Math.sin(a) + dy*Math.cos(a);
  return Math.abs(u) <= p.w/2 + pad && Math.abs(v) <= p.h/2 + pad;
}
