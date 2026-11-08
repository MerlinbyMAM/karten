// Hochzeit – Ringwurf: Eine Sektflasche wandert durch die Mitte der Karte. Mit einem Wisch nach oben
// (oder Tippen auf die Zielstelle) fliegt ein goldener Ring Richtung Flaschenhals. Trifft er, rutscht er
// den Hals hinunter und klirrt. 10 Ringe; die Flasche wird mit jedem Treffer flinker.
// Danach: Glocken, Tauben, Blütenregen, Namen + Datum (?namen= / ?name=, ?datum=).
import { startCard, t, bigText, rnd } from '../core/card.js';

const P = new URLSearchParams(location.search);
const NAMEN = P.get('namen') || P.get('name') || t('hochzeit.msg');
const DATUM = P.get('datum');
const RINGS = 10, START = { x: 300, y: 820 };
const NECK_TOP = 352, NECK_BOT = 432, BASE_Y = 612;
// Flasche wird um BS verkleinert gezeichnet; NT/NB = sichtbarer Hals (für Treffer und Stapel)
const BS = .68, NT = BASE_Y - (BASE_Y - NECK_TOP)*BS, NB = BASE_Y - (BASE_Y - NECK_BOT)*BS;
const RING = 38;                                      // Ringradius auf dem Hals (vorher 26)

let bottle, flying, stacked, left, hits, popups, doves, petals, sparks, done, doneT, aim, ready, tt;

function ringPath(g, x, y, r, sq, part){            // part: 0 ganz, 1 hintere Hälfte, 2 vordere Hälfte
  const gr = g.createLinearGradient(x - r, y - r, x + r, y + r);
  gr.addColorStop(0, '#fff3b0'); gr.addColorStop(.4, '#d4a017'); gr.addColorStop(.7, '#fce38a'); gr.addColorStop(1, '#a67c00');
  g.strokeStyle = gr; g.lineWidth = Math.max(3, r*.3); g.lineCap = 'round';
  g.beginPath();
  if(part === 1) g.ellipse(x, y, r, r*sq, 0, Math.PI, Math.PI*2);
  else if(part === 2) g.ellipse(x, y, r, r*sq, 0, 0, Math.PI);
  else g.ellipse(x, y, r, r*sq, 0, 0, Math.PI*2);
  g.stroke();
  if(part !== 1){ g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(x - r*.5, y + r*sq*.6, Math.max(1.5, r*.07), 0, 7); g.fill(); }
}
function drawBottle(g, x){
  g.save(); g.translate(x, BASE_Y); g.scale(BS, BS); g.translate(0, -BASE_Y);
  g.fillStyle = 'rgba(80,60,40,.25)'; g.beginPath(); g.ellipse(0, BASE_Y + 4, 46, 9, 0, 0, 7); g.fill();
  const gl = g.createLinearGradient(-36, 0, 36, 0);
  gl.addColorStop(0, '#0d3b24'); gl.addColorStop(.35, '#1f6b45'); gl.addColorStop(.55, '#2f8a5c'); gl.addColorStop(1, '#0b2e1c');
  g.fillStyle = gl; g.beginPath();
  g.moveTo(-11, NECK_BOT - 70); g.lineTo(-11, NECK_BOT); g.bezierCurveTo(-12, NECK_BOT + 30, -36, NECK_BOT + 34, -36, NECK_BOT + 70);
  g.lineTo(-36, BASE_Y - 8); g.quadraticCurveTo(-36, BASE_Y, -28, BASE_Y); g.lineTo(28, BASE_Y); g.quadraticCurveTo(36, BASE_Y, 36, BASE_Y - 8);
  g.lineTo(36, NECK_BOT + 70); g.bezierCurveTo(36, NECK_BOT + 34, 12, NECK_BOT + 30, 11, NECK_BOT); g.lineTo(11, NECK_BOT - 70); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(-25, NECK_BOT + 60, 6, 100);
  // Etikett
  g.fillStyle = '#f7ecd2'; g.fillRect(-32, NECK_BOT + 92, 64, 50); g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.strokeRect(-29, NECK_BOT + 95, 58, 44);
  g.fillStyle = '#b8862e'; g.font = 'bold 22px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', 0, NECK_BOT + 117);
  // Goldfolie am Hals
  const gf = g.createLinearGradient(-13, 0, 13, 0); gf.addColorStop(0, '#9c7a1c'); gf.addColorStop(.5, '#f6dc7a'); gf.addColorStop(1, '#8a6a12');
  g.fillStyle = gf; g.beginPath(); g.moveTo(-12, NECK_TOP + 40); g.lineTo(-12, NECK_TOP + 2); g.quadraticCurveTo(0, NECK_TOP - 8, 12, NECK_TOP + 2); g.lineTo(12, NECK_TOP + 40); g.closePath(); g.fill();
  g.restore();
}

const scene = {
  title: t('hochzeit.title'), subtitle: t('hochzeit.sub'), emoji: '💍',
  accent: '#f1e3c6', button: '#9c6644', bg: '#4a3b30',
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    bottle = { x: 300, ph: 0, sp: .6, amp: 55 }; flying = null; stacked = []; left = RINGS; hits = 0;
    popups = []; doves = []; petals = []; sparks = []; done = false; doneT = 0; aim = null; ready = 0; tt = 0;
  },
  throwAt(xt, ctx){
    if(done || flying || left <= 0 || ready > 0) return;
    left--; xt = Math.max(40, Math.min(560, xt));
    flying = { x0: START.x, y0: START.y, xt, u: 0, x: START.x, y: START.y, s: 1, state: 'fly' };
    ctx.noise(0, .18, .07, 2500); ctx.tone(880, 0, .08, 'sine', .03);
  },
  onTap(x, y, ctx){ aim = { x, y, x0: x, y0: y }; },
  onDrag(x, y){ if(aim){ aim.x = x; aim.y = y; } },
  onRelease(ctx){
    if(!aim) return;
    const dx = aim.x - aim.x0, dy = aim.y - aim.y0;
    // Wisch nach oben: Richtung des Wischs bestimmt das Ziel; kurzes Tippen: genau dorthin werfen
    const xt = (dy < -30) ? START.x + dx/Math.max(1, -dy)*(START.y - NT) : aim.x;
    aim = null; this.throwAt(xt, ctx);
  },
  finish(ctx){
    done = true; doneT = tt;
    for(let i=0;i<40;i++){ const a = rnd(0, 6.28), v = rnd(60, 260); sparks.push({ x: 300, y: 400, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: rnd(.8, 1.6) }); }
    [0, .45, .9, 1.35].forEach((d, i) => { const f = [784, 659, 523, 659][i]; ctx.tone(f, d, 2.2, 'sine', .09); ctx.tone(f*2.76, d, 1.2, 'sine', .03); ctx.tone(f*5.4, d, .6, 'sine', .015); });
    // Hochzeitsmarsch (Mendelssohn, gemeinfrei) – Anfangsfanfare
    ctx.melody([['C5',.33],['C5',.33],['C5',.33],['C5',1],[null,1],['C5',.33],['C5',.33],['C5',.33],['C5',1],[null,1],['C5',.33],['C5',.33],['C5',.33],['C5',1],['C5',.33],['C5',.33],['C5',.33],['C5',1],
                ['C5',1],['F5',1.5],['F5',.5],['A5',1.5],['A5',.5],['C6',2],['B5',1],['A5',1],['G5',1],['F5',3]], 100, 'triangle', .1, 2.2);
    for(let i=0;i<5;i++) doves.push({ x: 300 + rnd(-40, 40), y: 400, vx: rnd(-160, 160), vy: rnd(-200, -120), ph: rnd(0, 6), s: rnd(.8, 1.2) });
    for(let i=0;i<70;i++) petals.push({ x: rnd(0, 600), y: rnd(-600, -10), vy: rnd(50, 100), r: rnd(0, 6), vr: rnd(-2, 2), s: rnd(8, 13), c: Math.random() < .5 ? '#ffffff' : '#f8c8d0' });
    setTimeout(() => ctx.showAgain(true), 6000);
  },
  update(dt, ctx){
    tt += dt; ready = Math.max(0, ready - dt);
    if(!done){ bottle.ph += dt*bottle.sp; bottle.x = 300 + Math.sin(bottle.ph)*bottle.amp; }
    window.__bottleX = bottle.x;
    for(const s of stacked) s.x = bottle.x;
    const f = flying;
    if(f){
      if(f.state === 'fly'){
        f.u = Math.min(1, f.u + dt/.65);
        // kleiner Magnet: im letzten Drittel zieht es den Ring bis zu 30 px zur Flasche
        if(f.u > .6){ const d = bottle.x - f.xt; if(Math.abs(d) < 70) f.xt += Math.sign(d)*Math.min(Math.abs(d), 90*dt); }
        const u = f.u; f.x = f.x0 + (f.xt - f.x0)*u; f.y = f.y0 + (NT - 24 - f.y0)*u - 140*Math.sin(Math.PI*u); f.s = 1 - (1 - RING/58)*u;
        if(u >= 1){
          const off = f.xt - bottle.x;
          if(Math.abs(off) < RING - 12){                                     // Treffer
            f.state = 'slide'; f.v = 0; hits++;
            bottle.sp += .12; bottle.amp = Math.min(130, bottle.amp + 8);
            popups.push({ x: bottle.x, y: NT - 60, s: t('hochzeit.hit'), life: 1.2, good: 1 });
            ctx.tone(1568, 0, .5, 'sine', .07); ctx.tone(2093, .08, .6, 'sine', .05);
          } else if(Math.abs(off) < RING + 14){                              // klirrt am Hals ab
            f.state = 'fall'; f.vx = Math.sign(off || 1)*rnd(120, 200); f.vy = -120;
            popups.push({ x: f.x, y: NT - 60, s: t('hochzeit.miss'), life: 1 });
            ctx.tone(2637, 0, .15, 'triangle', .05); ctx.tone(1975, .05, .2, 'triangle', .04);
          } else { f.state = 'fall'; f.vx = (f.xt - f.x0)*.3; f.vy = 40; popups.push({ x: f.x, y: NT - 60, s: t('hochzeit.miss'), life: 1 }); }
        }
      } else if(f.state === 'slide'){
        const target = Math.max(NT + 8, NB - 4 - stacked.length*6);
        f.v += 900*dt; f.y = Math.min(target, f.y + f.v*dt); f.x = bottle.x;
        if(f.y >= target){ stacked.push({ x: bottle.x, y: target }); flying = null; ready = .25; ctx.tone(1318, 0, .25, 'triangle', .05);
          for(let i=0;i<12;i++){ const a = rnd(0, 6.28); sparks.push({ x: bottle.x, y: target, vx: Math.cos(a)*120, vy: Math.sin(a)*80, life: .7 }); } }
      } else {
        f.vy += 900*dt; f.x += f.vx*dt; f.y += f.vy*dt;
        if(f.y > 950){ flying = null; ready = .2; }
      }
      if(!flying && left <= 0 && !done) setTimeout(() => { if(!done) this.finish(ctx); }, 500);
    }
    for(const p of popups){ p.y -= 40*dt; p.life -= dt; }
    popups = popups.filter(p => p.life > 0);
    for(const d of doves){ d.x += d.vx*dt; d.y += d.vy*dt; d.vy += 10*dt; }
    for(const p of petals){ p.y += p.vy*dt; p.x += Math.sin(tt + p.r)*20*dt; p.r += p.vr*dt; if(p.y > 920){ p.y = -20; p.x = rnd(0, 600); } }
    for(const s of sparks){ s.x += s.vx*dt; s.y += s.vy*dt; s.vx *= .97; s.vy *= .97; s.life -= dt; }
    sparks = sparks.filter(s => s.life > 0);
  },
  draw(g, ctx){
    if(done){
      const gl = Math.min(1, tt - doneT);
      const gr = g.createRadialGradient(300, 420, 10, 300, 420, 240); gr.addColorStop(0, `rgba(255,236,170,${.55*gl})`); gr.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = gr; g.fillRect(40, 180, 520, 480);
    }
    // gestapelte Ringe: hintere Hälfte hinter dem Hals, vordere davor
    for(const s of stacked) ringPath(g, s.x, s.y, RING, .3, 1);
    drawBottle(g, bottle.x);
    for(const s of stacked) ringPath(g, s.x, s.y, RING, .3, 2);
    // fliegender Ring
    if(flying){
      const f = flying;
      if(f.state === 'slide'){ ringPath(g, f.x, f.y, RING, .3, 2); }
      else ringPath(g, f.x, f.y, 58*f.s, .3 + .25*(1 - f.s), 0);
    }
    // nächster Ring unten bereit
    if(!done && !flying && left > 0) ringPath(g, START.x, START.y + Math.sin(tt*3)*3, 58, .45, 0);
    g.globalCompositeOperation = 'lighter';
    for(const s of sparks){ g.globalAlpha = Math.max(0, s.life); g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    for(const p of popups){ g.globalAlpha = Math.max(0, Math.min(1, p.life*1.5)); bigText(g, p.s, p.x, p.y, p.good ? 38 : 30, p.good ? '#fff3b0' : '#fff', 'rgba(110,80,60,.9)'); }
    g.globalAlpha = 1;
    // Anzeige
    if(!done){
      g.fillStyle = 'rgba(110,80,60,.6)';
      g.beginPath(); g.roundRect(40, 760, 150, 50, 16); g.fill(); g.beginPath(); g.roundRect(410, 760, 150, 50, 16); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 24px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t('hochzeit.rings', {n: left}), 115, 786); g.fillText(t('hochzeit.hits', {n: hits}), 485, 786);
    }
    if(!done && hits === 0 && left === RINGS && tt > .5){ g.globalAlpha = .6 + .4*Math.sin(tt*3); bigText(g, t('hochzeit.hint'), 300, 345, 28, '#fff', 'rgba(110,80,60,.85)'); g.globalAlpha = 1; }
    // Finale
    for(const d of doves){
      const w = Math.sin(tt*10 + d.ph);
      g.save(); g.translate(d.x, d.y); g.scale(d.vx < 0 ? -d.s : d.s, d.s); g.fillStyle = '#fff'; g.strokeStyle = 'rgba(120,120,140,.5)'; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(0, 0, 22, 10, 0, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.arc(20, -6, 7, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#f4a261'; g.beginPath(); g.moveTo(26, -6); g.lineTo(33, -4); g.lineTo(26, -3); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-4, -4); g.quadraticCurveTo(-10, -30*w - 6, -26, -28*w - 4); g.quadraticCurveTo(-14, -6, -4, -4); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-20, 0); g.lineTo(-36, -6); g.lineTo(-34, 6); g.fill(); g.restore();
    }
    for(const p of petals){ g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, p.s*.6, p.s, 0, 0, 7); g.fill(); g.restore(); }
    if(done && tt - doneT > 1.2){
      g.globalAlpha = Math.min(1, tt - doneT - 1.2);
      bigText(g, NAMEN, 300, 650, 50, '#fff8e7', 'rgba(110,80,60,.9)');
      if(DATUM) bigText(g, DATUM, 300, 712, 32, '#fff8e7', 'rgba(110,80,60,.9)');
      bigText(g, t('hochzeit.result', {n: hits, m: RINGS}), 300, 300, 34, '#fff3b0', 'rgba(110,80,60,.9)');
      g.globalAlpha = 1;
    }
  }
};
startCard(scene);
