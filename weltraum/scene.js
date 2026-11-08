// Weltraum-Mission: Das Raumschiff fliegt unten über die Karte und schießt automatisch.
// Finger bewegen = steuern. Meteoriten abschießen, Sterne einsammeln: jeder Stern macht die
// Waffe stärker (bis Stufe 5). Ein Meteor-Treffer kostet ein Leben – nach drei: Game Over.
import { startCard, t as tr, bigText, rnd, confetti, drawConfetti } from '../core/card.js';

const P = new URLSearchParams(location.search);
const NAME = P.get('name');
const LIVES = 3, SHIP_Y = 785;
let ship, shots, rocks, stars, booms, score, lives, level, over, fireT, spawnT, conf, best = 0, t, inv, wreck, flash;

const WEAPON = [                                         // Stufe: [Feuerpause, Schusswinkel]
  null,
  [.30, [0]],
  [.26, [-.06, .06]],
  [.24, [-.16, 0, .16]],
  [.18, [-.16, 0, .16]],
  [.16, [-.3, -.14, 0, .14, .3]],
];

function boom(x, y, n, cols, sp = 160){ for(let i=0;i<n;i++){ const a = rnd(0, 6.28), v = rnd(40, sp); booms.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: rnd(.4, .9), c: cols[i % cols.length], r: rnd(2, 5) }); } }

const scene = {
  title: tr('weltraum.title'), subtitle: tr('weltraum.sub'), emoji: '🚀',
  accent: '#9bf6ff', button: '#7209b7', bg: '#10002b',
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    ship = { x: 300, tx: 300 }; shots = []; rocks = []; stars = []; booms = [];
    score = 0; lives = LIVES; level = 1; over = false; fireT = 0; spawnT = 1; conf = null; t = 0; inv = 0; wreck = 0; flash = 0;
  },
  onTap(x, y, ctx){ if(!over) ship.tx = x; },
  onDrag(x, y, ctx){ if(!over) ship.tx = x; },
  update(dt, ctx){
    for(const b of booms){ b.x += b.vx*dt; b.y += b.vy*dt; b.vx *= .98; b.vy *= .98; b.life -= dt; }
    booms = booms.filter(b => b.life > 0);
    flash = Math.max(0, flash - dt);
    if(over) return;
    t += dt; inv = Math.max(0, inv - dt);
    if(wreck > 0){                                       // Raumschiff zerstört: kurz warten, dann neues
      wreck -= dt;
      if(wreck <= 0){
        if(lives <= 0){
          over = true; best = Math.max(best, score); shots = [];
          conf = confetti(110, ['#9bf6ff','#ffd60a','#c77dff','#ffffff']);
          ctx.melody([['G4',.5],['E4',.5],['C4',1],['C5',.5],['E5',.5],['G5',1.5]], 140, 'square', .07);
          setTimeout(() => ctx.showAgain(true), 2200);
          return;
        }
        ship.x = ship.tx = 300; inv = 2.2; ctx.tone(660, 0, .12, 'square', .05); ctx.tone(990, .12, .15, 'square', .05);
      }
    } else {
      ship.x += (ship.tx - ship.x)*Math.min(1, dt*8);
      ship.x = Math.max(40, Math.min(560, ship.x));
      fireT -= dt;
      if(fireT <= 0){
        const [pause, angs] = WEAPON[level]; fireT = pause;
        for(const a of angs) shots.push({ x: ship.x + a*60, y: SHIP_Y - 30, vx: Math.sin(a)*620, vy: -Math.cos(a)*620, big: level >= 4 });
        ctx.tone(1100 + level*80, 0, .05, 'square', .02);
      }
    }
    // Gegner: es wird mit der Zeit immer voller und schneller
    const diff = 1 + t/30;
    spawnT -= dt;
    if(spawnT <= 0){
      spawnT = rnd(.4, .75)/diff;
      if(Math.random() < .17) stars.push({ x: rnd(40, 560), y: 90, vy: rnd(120, 170), ph: rnd(0, 6) });
      else { const r = rnd(20, 40); rocks.push({ x: rnd(40, 560), y: 90, vx: rnd(-25, 25), vy: rnd(100, 160)*diff, r, rot: rnd(0, 6), vr: rnd(-2, 2), hp: r > 32 ? 3 : r > 26 ? 2 : 1, hit: 0, shape: Array.from({length: 10}, () => rnd(.75, 1.05)) }); }
    }
    for(const s of shots){ s.x += s.vx*dt; s.y += s.vy*dt; }
    for(const r of rocks){ r.x += r.vx*dt; r.y += r.vy*dt; r.rot += r.vr*dt; r.hit = Math.max(0, r.hit - dt); }
    for(const s of stars){ s.y += s.vy*dt; }
    for(const s of shots) for(const r of rocks){
      if(r.dead || s.dead || Math.hypot(s.x - r.x, s.y - r.y) > r.r + (s.big ? 9 : 6)) continue;
      s.dead = 1; r.hp -= s.big ? 2 : 1; r.hit = .1;
      if(r.hp <= 0){
        r.dead = 1; score += r.r > 32 ? 3 : r.r > 26 ? 2 : 1;
        boom(r.x, r.y, 18, ['#ffba08', '#f48c06', '#ffffff', '#e85d04']);
        ctx.noise(0, .2, .16, 300);
      } else ctx.tone(300, 0, .04, 'square', .03);
    }
    if(wreck <= 0){
      for(const s of stars){
        if(!s.dead && Math.abs(s.x - ship.x) < 42 && Math.abs(s.y - SHIP_Y) < 44){
          s.dead = 1; score += 3; flash = .35;
          if(level < 5){ level++; ctx.tone(880, 0, .1, 'sine', .08); ctx.tone(1318, .08, .1, 'sine', .08); ctx.tone(1760, .16, .25, 'sine', .08); }
          else { ctx.tone(1318, 0, .1, 'sine', .07); ctx.tone(1760, .08, .18, 'sine', .07); }
          boom(s.x, s.y, 12, ['#ffd60a', '#fff3b0']);
        }
      }
      if(inv <= 0) for(const r of rocks){
        if(!r.dead && Math.abs(r.x - ship.x) < r.r + 20 && Math.abs(r.y - SHIP_Y) < r.r + 22){
          r.dead = 1; lives--; wreck = 1.4; level = Math.max(1, level - 1); shots = [];
          boom(ship.x, SHIP_Y, 40, ['#ef233c', '#ffba08', '#ffffff', '#f1faee'], 260);
          ctx.noise(0, .7, .35, 90); ctx.tone(220, .05, .5, 'sawtooth', .05); ctx.tone(110, .2, .6, 'sawtooth', .05);
          break;
        }
      }
    }
    shots = shots.filter(s => !s.dead && s.y > 70 && s.x > -20 && s.x < 620);
    rocks = rocks.filter(r => !r.dead && r.y < 920);
    stars = stars.filter(s => !s.dead && s.y < 920);
  },
  draw(g, ctx){
    // HUD
    g.fillStyle = 'rgba(16,0,43,.75)'; g.fillRect(0, 0, 600, 64);
    g.font = 'bold 32px system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillStyle = '#9bf6ff'; g.textAlign = 'left'; g.fillText(`★ ${score}`, 20, 34);
    g.textAlign = 'center'; g.fillStyle = flash > 0 ? '#ffd60a' : '#c77dff'; g.font = 'bold 24px system-ui, sans-serif';
    g.fillText(tr('weltraum.weapon') + ' ' + '▮'.repeat(level) + '▯'.repeat(5 - level), 300, 34);
    g.textAlign = 'right'; g.font = '30px serif'; g.fillStyle = '#ef233c';
    g.fillText('❤'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, LIVES - lives)), 580, 34);
    // Schüsse
    for(const s of shots){
      g.fillStyle = s.big ? '#ffd60a' : '#9bf6ff'; g.shadowColor = g.fillStyle; g.shadowBlur = 10;
      g.beginPath(); g.ellipse(s.x, s.y, s.big ? 5 : 3.5, s.big ? 13 : 10, Math.atan2(s.vx, -s.vy), 0, 7); g.fill();
    }
    g.shadowBlur = 0;
    // Meteoriten: glühendes Gestein mit hellem Rand – gut sichtbar auf dem dunklen Himmel
    for(const r of rocks){
      g.save(); g.translate(r.x, r.y);
      const tail = g.createLinearGradient(0, -r.r*3, 0, 0);       // Feuerschweif
      tail.addColorStop(0, 'rgba(255,120,0,0)'); tail.addColorStop(1, 'rgba(255,150,30,.55)');
      g.fillStyle = tail; g.beginPath(); g.moveTo(-r.r*.7, 0); g.lineTo(0, -r.r*3.2); g.lineTo(r.r*.7, 0); g.fill();
      g.rotate(r.rot);
      g.shadowColor = '#ff7b00'; g.shadowBlur = 18;
      const gr = g.createRadialGradient(-r.r*.3, -r.r*.3, r.r*.1, 0, 0, r.r*1.1);
      gr.addColorStop(0, r.hit ? '#ffffff' : '#ffd166'); gr.addColorStop(.45, '#f77f00'); gr.addColorStop(1, '#9d0208');
      g.fillStyle = gr; g.beginPath();
      r.shape.forEach((k, i) => { const a = i/10*6.283; g.lineTo(Math.cos(a)*r.r*k, Math.sin(a)*r.r*k); });
      g.closePath(); g.fill(); g.shadowBlur = 0;
      g.strokeStyle = '#ffe8a3'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = 'rgba(90,10,0,.55)';
      g.beginPath(); g.arc(-r.r*.25, -r.r*.15, r.r*.2, 0, 7); g.fill();
      g.beginPath(); g.arc(r.r*.3, r.r*.25, r.r*.14, 0, 7); g.fill();
      g.restore();
    }
    // Sterne (Waffen-Upgrade)
    g.textAlign = 'center';
    for(const s of stars){
      const k = 1 + .12*Math.sin(ctx.t*8 + s.ph);
      g.shadowColor = '#ffd60a'; g.shadowBlur = 20; g.font = `${Math.round(46*k)}px serif`; g.fillStyle = '#ffd60a'; g.fillText('★', s.x, s.y);
    }
    g.shadowBlur = 0;
    for(const b of booms){ g.globalAlpha = Math.max(0, Math.min(1, b.life*1.6)); g.fillStyle = b.c; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    // Raumschiff (blinkt nach einem Neustart)
    if(!over && wreck <= 0 && !(inv > 0 && Math.floor(ctx.t*10) % 2)){
      const x = ship.x, y = SHIP_Y;
      g.fillStyle = `rgba(255,${150 + 80*Math.random()},0,.9)`; g.beginPath(); g.moveTo(x - 10, y + 22); g.lineTo(x, y + 44 + rnd(0, 12)); g.lineTo(x + 10, y + 22); g.fill();
      g.fillStyle = '#e63946'; g.beginPath(); g.moveTo(x - 28, y + 24); g.lineTo(x - 14, y); g.lineTo(x + 14, y); g.lineTo(x + 28, y + 24); g.fill();
      if(level >= 3){ g.fillStyle = '#ffd60a'; g.fillRect(x - 30, y + 8, 6, 16); g.fillRect(x + 24, y + 8, 6, 16); }
      g.fillStyle = '#f1faee'; g.beginPath(); g.moveTo(x, y - 34); g.quadraticCurveTo(x + 18, y - 8, x + 14, y + 22); g.lineTo(x - 14, y + 22); g.quadraticCurveTo(x - 18, y - 8, x, y - 34); g.fill();
      g.fillStyle = '#48cae4'; g.beginPath(); g.arc(x, y - 4, 7, 0, 7); g.fill();
      if(flash > 0){ g.strokeStyle = `rgba(255,214,10,${flash*2})`; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 50 - flash*40, 0, 7); g.stroke(); }
    }
    if(!over && ctx.t < 4){ g.globalAlpha = Math.min(1, 4 - ctx.t); bigText(g, tr('weltraum.hint'), 300, 450, 36, '#fff', 'rgba(16,0,43,.85)'); g.globalAlpha = 1; }
    if(!over && wreck > 0 && lives > 0) bigText(g, lives === 1 ? tr('weltraum.last') : tr('weltraum.lives', {n: lives}), 300, 470, 44, '#ff6b6b', 'rgba(16,0,43,.9)');
    if(over){
      g.fillStyle = 'rgba(16,0,43,.55)'; g.fillRect(0, 64, 600, 836);
      if(conf) drawConfetti(g, conf, 1/60);
      bigText(g, 'GAME OVER', 300, 300, 70, '#ef233c', 'rgba(16,0,43,.95)');
      const rank = score >= 80 ? tr('weltraum.r1') : score >= 40 ? tr('weltraum.r2') : tr('weltraum.r3');
      bigText(g, rank, 300, 390, 54, '#ffd60a', 'rgba(16,0,43,.9)');
      bigText(g, tr('weltraum.pts', {n: score}) + (best > score ? ' · ' + tr('weltraum.rec', {n: best}) : ''), 300, 470, 40, '#9bf6ff', 'rgba(16,0,43,.9)');
      if(NAME) bigText(g, tr('weltraum.bday', {name: NAME}), 300, 560, 44, '#fff', 'rgba(16,0,43,.9)');
    }
  }
};
startCard(scene);
