// Weltraum-Mission: Ein kleines Raumschiff fliegt unten über die Karte.
// Wischen/Antippen steuert es nach links/rechts, es schießt automatisch.
// Meteoriten abschießen (+1), Sterne einsammeln (+3), 25 s pro Runde.
import { startCard, bigText, rnd, confetti, drawConfetti } from '../core/card.js';

const P = new URLSearchParams(location.search);
const NAME = P.get('name');
const TIME = 25;
let ship, shots, rocks, stars, booms, score, tLeft, over, fireT, spawnT, conf, best = 0;

const scene = {
  title: 'Ab ins All!', subtitle: 'Steuere das Raumschiff mit dem Finger, schieß Meteoriten ab und sammle Sterne!', emoji: '🚀',
  accent: '#9bf6ff', button: '#7209b7', bg: '#10002b',
  init(ctx){ this.restart(ctx); },
  restart(ctx){ ship = { x: 300, tx: 300 }; shots = []; rocks = []; stars = []; booms = []; score = 0; tLeft = TIME; over = false; fireT = 0; spawnT = 0; conf = null; },
  onTap(x, y, ctx){ if(!over) ship.tx = x; },
  onDrag(x, y, ctx){ if(!over) ship.tx = x; },
  update(dt, ctx){
    if(over) return;
    tLeft -= dt;
    if(tLeft <= 0){
      over = true; tLeft = 0; best = Math.max(best, score); rocks = []; stars = []; shots = []; booms = [];
      conf = confetti(110, ['#9bf6ff','#ffd60a','#c77dff','#ffffff']);
      ctx.melody([['C5',.5],['E5',.5],['G5',.5],['C6',1],['G5',.5],['C6',2]], 150, 'square', .07);
      setTimeout(() => ctx.showAgain(true), 2500);
      return;
    }
    ship.x += (ship.tx - ship.x)*Math.min(1, dt*8);
    ship.x = Math.max(40, Math.min(560, ship.x));
    fireT -= dt;
    if(fireT <= 0){ fireT = .28; shots.push({ x: ship.x, y: 770 }); ctx.tone(1200, 0, .06, 'square', .025); }
    spawnT -= dt;
    const diff = 1 + (TIME - tLeft)/TIME;
    if(spawnT <= 0){
      spawnT = rnd(.45, .8)/diff;
      if(Math.random() < .25) stars.push({ x: rnd(40, 560), y: 120, vy: rnd(110, 160) });
      else rocks.push({ x: rnd(40, 560), y: 110, vy: rnd(90, 150)*diff, r: rnd(20, 34), rot: rnd(0, 6), vr: rnd(-2, 2), hp: 1 });
    }
    for(const s of shots) s.y -= 620*dt;
    for(const r of rocks){ r.y += r.vy*dt; r.rot += r.vr*dt; }
    for(const s of stars){ s.y += s.vy*dt; }
    for(const s of shots) for(const r of rocks){
      if(!r.dead && !s.dead && Math.hypot(s.x - r.x, s.y - r.y) < r.r + 6){
        r.dead = s.dead = 1; score += 1;
        for(let i=0;i<14;i++){ const a = rnd(0, 6.28), v = rnd(40, 160); booms.push({ x: r.x, y: r.y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: .6, c: '#ffb703' }); }
        ctx.noise(0, .2, .18, 300);
      }
    }
    for(const s of stars){
      if(!s.dead && Math.abs(s.x - ship.x) < 40 && Math.abs(s.y - 780) < 40){
        s.dead = 1; score += 3;
        ctx.tone(1318, 0, .1, 'sine', .07); ctx.tone(1760, .08, .18, 'sine', .07);
        for(let i=0;i<10;i++){ const a = rnd(0, 6.28); booms.push({ x: s.x, y: s.y, vx: Math.cos(a)*120, vy: Math.sin(a)*120, life: .5, c: '#ffd60a' }); }
      }
    }
    for(const r of rocks){
      if(!r.dead && Math.abs(r.x - ship.x) < r.r + 22 && Math.abs(r.y - 785) < r.r + 22){
        r.dead = 1; score = Math.max(0, score - 2);
        ctx.noise(0, .4, .3, 120);
        for(let i=0;i<18;i++){ const a = rnd(0, 6.28), v = rnd(60, 200); booms.push({ x: ship.x, y: 785, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: .7, c: '#ef233c' }); }
      }
    }
    for(const b of booms){ b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt; }
    shots = shots.filter(s => !s.dead && s.y > 100);
    rocks = rocks.filter(r => !r.dead && r.y < 900);
    stars = stars.filter(s => !s.dead && s.y < 900);
    booms = booms.filter(b => b.life > 0);
  },
  draw(g, ctx, dt){
    // HUD
    g.fillStyle = 'rgba(16,0,43,.7)'; g.fillRect(0, 0, 600, 64);
    g.font = 'bold 34px system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillStyle = '#9bf6ff'; g.textAlign = 'left'; g.fillText(`★ ${score}`, 24, 34);
    g.fillStyle = tLeft < 5 ? '#ff6b6b' : '#fff'; g.textAlign = 'right'; g.fillText(`${Math.ceil(tLeft)} s`, 576, 34);
    for(const s of shots){ g.fillStyle = '#9bf6ff'; g.fillRect(s.x - 3, s.y - 14, 6, 18); }
    for(const r of rocks){
      g.save(); g.translate(r.x, r.y); g.rotate(r.rot);
      g.fillStyle = '#7f5539'; g.beginPath();
      for(let i=0;i<9;i++){ const a = i/9*6.283, rr = r.r*(.8 + .2*Math.sin(i*2.3)); g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); }
      g.closePath(); g.fill(); g.fillStyle = '#5e3b23'; g.beginPath(); g.arc(-r.r*.25, -r.r*.2, r.r*.22, 0, 7); g.fill(); g.restore();
    }
    g.textAlign = 'center';
    for(const s of stars){ g.font = '42px serif'; g.fillStyle = '#ffd60a'; g.fillText('★', s.x, s.y); }
    for(const b of booms){ g.globalAlpha = Math.max(0, b.life*1.6); g.fillStyle = b.c; g.beginPath(); g.arc(b.x, b.y, 4, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    // Raumschiff
    if(!over){
      const x = ship.x, y = 785;
      g.fillStyle = `rgba(255,${150 + 80*Math.random()},0,.9)`; g.beginPath(); g.moveTo(x - 10, y + 22); g.lineTo(x, y + 44 + rnd(0, 12)); g.lineTo(x + 10, y + 22); g.fill();
      g.fillStyle = '#e63946'; g.beginPath(); g.moveTo(x - 28, y + 24); g.lineTo(x - 14, y); g.lineTo(x + 14, y); g.lineTo(x + 28, y + 24); g.fill();
      g.fillStyle = '#f1faee'; g.beginPath(); g.moveTo(x, y - 34); g.quadraticCurveTo(x + 18, y - 8, x + 14, y + 22); g.lineTo(x - 14, y + 22); g.quadraticCurveTo(x - 18, y - 8, x, y - 34); g.fill();
      g.fillStyle = '#48cae4'; g.beginPath(); g.arc(x, y - 4, 7, 0, 7); g.fill();
    }
    if(!over && ctx.t < 4){ g.globalAlpha = Math.min(1, 4 - ctx.t); bigText(g, 'Finger bewegen = steuern', 300, 450, 36, '#fff', 'rgba(16,0,43,.85)'); g.globalAlpha = 1; }
    if(over){
      if(conf) drawConfetti(g, conf, 1/60);
      const rank = score >= 40 ? 'Kommandant!' : score >= 20 ? 'Super-Pilot!' : 'Gut gemacht!';
      bigText(g, rank, 300, 360, 62, '#ffd60a', 'rgba(16,0,43,.9)');
      bigText(g, `${score} Punkte`, 300, 450, 48, '#9bf6ff', 'rgba(16,0,43,.9)');
      if(NAME) bigText(g, `Alles Gute, ${NAME}!`, 300, 540, 44, '#fff', 'rgba(16,0,43,.9)');
    }
  }
};
startCard(scene);
