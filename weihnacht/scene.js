// Weihnachtsdorf: Es schneit über der Karte. Antippen/Wischen = Schneegestöber,
// Sterne funkeln am Himmel; "Schütteln" (Wischen) lässt es stärker schneien.
// Nach dem 5. Antippen leuchtet der Baum auf, Sternschnuppe + Jingle Bells.
import { startCard, bigText, rnd } from '../core/card.js';

const msg = new URLSearchParams(location.search).get('text');
let flakes, stars, shooting, taps, glow, wind, finished;

function flake(top){ return { x: rnd(0, 600), y: top ? rnd(-900, 0) : rnd(0, 900), r: rnd(1.2, 4), vy: rnd(25, 60), ph: rnd(0, 6) }; }

const scene = {
  title: 'Frohe Weihnachten', subtitle: 'Tippe auf die Karte – und lass es schneien!', emoji: '❄️',
  accent: '#f6d77a', button: '#2c5f8a', bg: '#1d3557',
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    flakes = Array.from({length: 160}, () => flake(false));
    stars = Array.from({length: 26}, () => ({ x: rnd(20, 580), y: rnd(150, 420), p: rnd(0, 6), s: rnd(1.5, 3.2) }));
    shooting = []; taps = 0; glow = 0; wind = 0; finished = false;
  },
  onTap(x, y, ctx){
    taps++;
    wind = (x < 300 ? 1 : -1) * rnd(90, 160);
    for(let i=0;i<40;i++) flakes.push({ x: x + rnd(-80, 80), y: y + rnd(-80, 80), r: rnd(1.5, 4.5), vy: rnd(-60, 30), ph: rnd(0, 6), burst: 1 });
    ctx.tone(rnd(1400, 2200), 0, .35, 'sine', .05);  // Glöckchen
    ctx.tone(rnd(2600, 3200), .05, .25, 'sine', .03);
    if(taps === 5 && !finished){
      finished = true; glow = 0.01;
      shooting.push({ x: 560, y: 160, vx: -420, vy: 150, life: 1.6 });
      // Jingle Bells (Refrain, gemeinfrei)
      ctx.melody([['E5',1],['E5',1],['E5',2],['E5',1],['E5',1],['E5',2],['E5',1],['G5',1],['C5',1.5],['D5',.5],['E5',4],
                  ['F5',1],['F5',1],['F5',1.5],['F5',.5],['F5',1],['E5',1],['E5',1],['E5',.5],['E5',.5],['E5',1],['D5',1],['D5',1],['E5',1],['D5',2],['G5',2]], 200, 'triangle', .12, .3);
      for(let k=0;k<5;k++) ctx.tone(2093 + k*120, 3 + k*.12, .4, 'sine', .04);
      setTimeout(() => ctx.showAgain(true), 4000);
    }
  },
  onDrag(x, y, ctx){ wind += (Math.random() - .5) * 60; if(Math.random() < .15) this.onTapSoft(x, y); },
  onTapSoft(x, y){ for(let i=0;i<6;i++) flakes.push({ x: x + rnd(-30, 30), y: y + rnd(-30, 30), r: rnd(1.5, 4), vy: rnd(-40, 20), ph: rnd(0, 6), burst: 1 }); },
  update(dt, ctx){
    wind *= Math.pow(.25, dt);
    for(const f of flakes){
      f.vy += (f.burst ? 60 : 0) * dt; if(f.vy > 70) f.vy = 70;
      f.y += f.vy*dt; f.x += (Math.sin(ctx.t*1.3 + f.ph)*14 + wind*.6)*dt;
      if(f.x < -10) f.x = 610; if(f.x > 610) f.x = -10;
      if(f.y > 910){ if(f.burst){ f.dead = 1; } else { f.y = -10; f.x = rnd(0, 600); } }
    }
    flakes = flakes.filter(f => !f.dead);
    for(const s of shooting){ s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt; }
    shooting = shooting.filter(s => s.life > 0);
    if(glow) glow = Math.min(1, glow + dt*.6);
  },
  draw(g, ctx){
    for(const s of stars){ const a = .35 + .65*Math.max(0, Math.sin(ctx.t*2 + s.p)); g.fillStyle = `rgba(255,248,220,${a})`; g.beginPath(); g.arc(s.x, s.y, s.s*a, 0, 7); g.fill(); }
    for(const s of shooting){ const gr = g.createLinearGradient(s.x, s.y, s.x + 140, s.y - 50); gr.addColorStop(0, 'rgba(255,255,230,.95)'); gr.addColorStop(1, 'rgba(255,255,230,0)'); g.strokeStyle = gr; g.lineWidth = 3; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + 140, s.y - 50); g.stroke(); }
    if(glow){
      const gr = g.createRadialGradient(300, 600, 10, 300, 600, 260);
      gr.addColorStop(0, `rgba(255,220,120,${.35*glow})`); gr.addColorStop(1, 'rgba(255,220,120,0)');
      g.fillStyle = gr; g.fillRect(0, 300, 600, 600);
      for(let i=0;i<14;i++){ const a = i/14*6.28 + ctx.t*.6, rr = 120 + 30*Math.sin(ctx.t*2 + i); g.fillStyle = `rgba(255,240,180,${.7*glow*(.5+.5*Math.sin(ctx.t*5+i))})`; g.beginPath(); g.arc(300 + Math.cos(a)*rr*.6, 600 + Math.sin(a)*rr*.35, 3, 0, 7); g.fill(); }
    }
    for(const f of flakes){ g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.fill(); }
    if(ctx.t < 4 && !finished){ g.globalAlpha = Math.min(1, 4 - ctx.t); bigText(g, 'Tipp auf die Karte!', 300, 780, 40, '#fff', 'rgba(20,40,80,.85)'); g.globalAlpha = 1; }
    if(finished && glow > .3){
      g.globalAlpha = Math.min(1, (glow - .3)*2);
      bigText(g, msg || 'Ein frohes Fest!', 300, 790, msg && msg.length > 16 ? 40 : 54, '#fff7d6', 'rgba(20,40,80,.9)');
      g.globalAlpha = 1;
    }
  }
};
startCard(scene);
