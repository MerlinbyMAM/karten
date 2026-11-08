// Luftballons: Ballons steigen aus der Karte auf – antippen zum Platzen lassen.
// In einem steckt die Botschaft. 20 Sekunden, Punkte, am Ende Konfetti.
import { startCard, confetti, drawConfetti, bigText, rnd } from '../core/card.js';

const COLORS = ['#e8433f', '#f6c431', '#3b8fe0', '#43b85a', '#ef6fa7', '#9a6ff0', '#ff8a3d'];
const GAME = 20;
const msg = new URLSearchParams(location.search).get('text') || 'Alles Gute!';
let balloons, pops, conf, score, time, state, spawn, endT;

function balloon(){
  const c = COLORS[Math.floor(Math.random()*COLORS.length)];
  return { x: rnd(70, 530), y: 960, r: rnd(34, 46), c, vy: rnd(70, 120), sw: rnd(0, 6), gold: Math.random() < .12 };
}
function drawBalloon(g, b, t){
  const x = b.x + Math.sin(t*1.6 + b.sw)*10, y = b.y;
  g.strokeStyle = 'rgba(80,80,80,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + b.r*1.15);
  g.bezierCurveTo(x - 8, y + b.r*1.6, x + 8, y + b.r*2, x, y + b.r*2.6); g.stroke();
  const gr = g.createRadialGradient(x - b.r*.35, y - b.r*.45, b.r*.1, x, y, b.r*1.2);
  const col = b.gold ? '#f3c34b' : b.c;
  gr.addColorStop(0, '#fff'); gr.addColorStop(.18, col); gr.addColorStop(1, shade(col, -45));
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, b.r, b.r*1.15, 0, 0, 7); g.fill();
  g.fillStyle = shade(col, -30); g.beginPath(); g.moveTo(x - 5, y + b.r*1.13); g.lineTo(x + 5, y + b.r*1.13); g.lineTo(x, y + b.r*1.25); g.fill();
  if(b.gold){ g.fillStyle = '#fff'; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', x, y); }
  b.dx = x;
}
function shade(hex, p){ const n = parseInt(hex.slice(1), 16); let r = (n>>16)+p, gg = ((n>>8)&255)+p, b = (n&255)+p; r=Math.max(0,Math.min(255,r)); gg=Math.max(0,Math.min(255,gg)); b=Math.max(0,Math.min(255,b)); return `rgb(${r},${gg},${b})`; }

const scene = {
  title: 'Hurra!', subtitle: 'Lass die Luftballons platzen – goldene zählen dreifach!', emoji: '🎈',
  accent: '#ffd34d', button: '#3b8fe0', bg: '#2d5f8f',
  init(ctx){ this.restart(ctx); },
  restart(ctx){ balloons = []; pops = []; conf = []; score = 0; time = GAME; state = 'play'; spawn = 0; endT = 0; },
  onTap(x, y, ctx){
    if(state !== 'play') return;
    for(let i = balloons.length - 1; i >= 0; i--){
      const b = balloons[i];
      if(Math.hypot(x - (b.dx ?? b.x), (y - b.y)/1.15) < b.r + 10){
        balloons.splice(i, 1);
        const pts = b.gold ? 3 : 1; score += pts;
        for(let k=0;k<14;k++){ const a = rnd(0, 6.28), s = rnd(80, 260); pops.push({x: b.dx ?? b.x, y: b.y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, c: b.gold ? '#f3c34b' : b.c, life: .6}); }
        pops.push({x: b.dx ?? b.x, y: b.y - 20, vx: 0, vy: -60, txt: '+' + pts, life: .9});
        ctx.noise(0, .12, .5, 1800); ctx.tone(b.gold ? 1320 : rnd(500, 800), .02, .12, 'square', .05);
        if(b.gold){ ctx.tone(1568, .08, .15); ctx.tone(2093, .16, .2); }
        return;
      }
    }
  },
  update(dt, ctx){
    for(const p of pops){ p.x += p.vx*dt; p.y += p.vy*dt; if(!p.txt) p.vy += 400*dt; p.life -= dt; }
    pops = pops.filter(p => p.life > 0);
    if(state === 'play'){
      time -= dt; spawn -= dt;
      if(spawn <= 0){ spawn = rnd(.35, .7) * (time > 8 ? 1 : .7); balloons.push(balloon()); }
      for(const b of balloons) b.y -= b.vy*dt;
      balloons = balloons.filter(b => b.y > -120);
      if(time <= 0){
        state = 'end'; time = 0; conf = confetti(150);
        ctx.melody([['C5',.5],['E5',.5],['G5',.5],['C6',1],['G5',.5],['C6',1.5]], 140, 'triangle', .14);
        setTimeout(() => ctx.showAgain(true), 1800);
      }
    } else endT += dt;
  },
  draw(g, ctx){
    for(const b of balloons) drawBalloon(g, b, ctx.t);
    for(const p of pops){
      if(p.txt){ g.globalAlpha = Math.max(0, p.life); bigText(g, p.txt, p.x, p.y, 34, '#fff', 'rgba(30,60,120,.85)'); g.globalAlpha = 1; }
      else { g.fillStyle = p.c; g.globalAlpha = Math.max(0, p.life*1.6); g.fillRect(p.x - 4, p.y - 4, 8, 8); g.globalAlpha = 1; }
    }
    // Anzeige
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect(20, 150, 560, 54, 16); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 30px Georgia'; g.textBaseline = 'middle';
    g.textAlign = 'left'; g.fillText('🎈 ' + score, 40, 178);
    g.textAlign = 'right'; g.fillText('⏱ ' + Math.ceil(time) + ' s', 560, 178);
    if(state === 'play' && ctx.t < 3){ g.globalAlpha = Math.min(1, 3 - ctx.t); bigText(g, 'Tipp die Ballons an!', 300, 470, 46, '#fff', 'rgba(30,60,120,.85)'); g.globalAlpha = 1; }
    if(state === 'end'){
      g.fillStyle = `rgba(20,40,80,${Math.min(.45, endT*.4)})`; g.fillRect(0, 0, 600, 900);
      drawConfetti(g, conf, 1/60);
      const s = 1 + Math.sin(ctx.t*4)*.04;
      g.save(); g.translate(300, 420); g.scale(s, s); bigText(g, msg, 0, 0, msg.length > 14 ? 50 : 64, '#fff', 'rgba(30,60,120,.85)'); g.restore();
      bigText(g, score + ' Ballons – super!', 300, 520, 38, '#ffd34d', 'rgba(30,60,120,.85)');
    }
  }
};
startCard(scene);
