// Glücksrad: Auf die leere Scheibe der Karte wird ein buntes Rad gezeichnet.
// Wischen oder Tippen dreht es (Wischstärke = Schwung). Es tickt, bremst ab,
// der Zeiger oben zeigt den Gewinn (?preise=Kino|Pizza|... bis 8 Stück).
import { startCard, bigText, rnd, confetti, drawConfetti } from '../core/card.js';
import { WHEEL } from './data.js';   // {x,y,r} Mittelpunkt/Radius der leeren Scheibe in 600x900

const P = new URLSearchParams(location.search);
const PRIZES = (P.get('preise') || 'Kinoabend|Frühstück ans Bett|Wellness-Tag|Pizza-Abend|Ausflug|Ein Wunsch frei|Eis essen|Überraschung').split('|').slice(0, 8);
const COLS = ['#e63946','#f4a261','#2a9d8f','#e9c46a','#457b9d','#f28482','#8ab17d','#b56576'];

let ang, vel, spinning, lastSeg, result, conf, dragA, dragT, spins;

function segAt(a){
  const n = PRIZES.length, step = Math.PI*2/n;
  let rel = (-Math.PI/2 - a) % (Math.PI*2); if(rel < 0) rel += Math.PI*2;   // Zeiger oben
  return Math.floor(rel/step) % n;
}

const scene = {
  title: 'Dreh am Glück!', subtitle: 'Wisch über das Rad und gib ihm Schwung – was gewinnst du?', emoji: '🎡',
  accent: '#ffd166', button: '#c1121f', bg: '#6a040f',
  init(ctx){ ang = 0; spins = 0; this.restart(ctx); },
  restart(ctx){ vel = 0; spinning = false; result = null; conf = null; lastSeg = segAt(ang); dragA = null; },
  onTap(x, y, ctx){
    if(spinning) return;
    dragA = Math.atan2(y - WHEEL.y, x - WHEEL.x); dragT = ctx.t;
    if(result){ result = null; conf = null; ctx.showAgain(false); }
  },
  onDrag(x, y, ctx){
    if(spinning || dragA === null) return;
    const a = Math.atan2(y - WHEEL.y, x - WHEEL.x);
    let d = a - dragA; if(d > Math.PI) d -= 2*Math.PI; if(d < -Math.PI) d += 2*Math.PI;
    ang += d; const dt = Math.max(.016, ctx.t - dragT);
    vel = vel*.5 + (d/dt)*.5; dragA = a; dragT = ctx.t;
  },
  onRelease(ctx){
    if(spinning || dragA === null) return;
    dragA = null;
    if(Math.abs(vel) < 3) vel = (vel >= 0 ? 1 : -1)*rnd(9, 14);   // Tippen = automatischer Schwung
    vel = Math.max(-22, Math.min(22, vel));
    spinning = true; spins++;
    ctx.noise(0, .3, .08, 800);
  },
  update(dt, ctx){
    if(!spinning) return;
    ang += vel*dt;
    vel *= Math.pow(.55, dt); vel -= Math.sign(vel)*Math.min(Math.abs(vel), .35*dt);
    const s = segAt(ang);
    if(s !== lastSeg){ lastSeg = s; ctx.tone(1800, 0, .03, 'square', .04); ctx.noise(0, .02, .08, 3000); }
    if(Math.abs(vel) < .05){
      spinning = false; vel = 0; result = PRIZES[s]; conf = confetti(120);
      ctx.melody([['C5',.5],['E5',.5],['G5',.5],['C6',1.5],['A5',.5],['C6',2]], 150, 'square', .08);
      setTimeout(() => ctx.showAgain(true), 1500);
    }
  },
  draw(g, ctx){
    const n = PRIZES.length, step = Math.PI*2/n, R = WHEEL.r;
    g.save(); g.translate(WHEEL.x, WHEEL.y);
    for(let i=0;i<n;i++){
      const a0 = ang + i*step;
      g.fillStyle = COLS[i%COLS.length]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a0, a0 + step); g.closePath(); g.fill();
      g.strokeStyle = '#fff6'; g.lineWidth = 2; g.stroke();
      g.save(); g.rotate(a0 + step/2); g.fillStyle = '#fff'; g.textAlign = 'right'; g.textBaseline = 'middle';
      const label = PRIZES[i]; let fs = Math.round(R*.13); g.font = `bold ${fs}px system-ui, sans-serif`;
      while(g.measureText(label).width > R*.68 && fs > 10){ fs--; g.font = `bold ${fs}px system-ui, sans-serif`; }
      g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeText(label, R - 14, 0); g.fillText(label, R - 14, 0); g.restore();
    }
    g.fillStyle = '#ffd166'; g.beginPath(); g.arc(0, 0, R*.14, 0, 7); g.fill();
    g.fillStyle = '#c1121f'; g.beginPath(); g.arc(0, 0, R*.08, 0, 7); g.fill();
    g.restore();
    // Zeiger
    g.fillStyle = '#c1121f'; g.strokeStyle = '#fff'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(WHEEL.x - 18, WHEEL.y - R - 18); g.lineTo(WHEEL.x + 18, WHEEL.y - R - 18); g.lineTo(WHEEL.x, WHEEL.y - R + 16); g.closePath(); g.fill(); g.stroke();
    if(!spins && !spinning && ctx.t > .5){ g.globalAlpha = .6 + .4*Math.sin(ctx.t*4); bigText(g, '👆 Wisch zum Drehen!', 300, WHEEL.y + R + 60, 36, '#fff', 'rgba(106,4,15,.85)'); g.globalAlpha = 1; }
    if(result){
      if(conf) drawConfetti(g, conf, 1/60);
      g.fillStyle = 'rgba(255,248,230,.94)'; g.fillRect(40, WHEEL.y - 70, 520, 140);
      g.strokeStyle = '#c1121f'; g.lineWidth = 5; g.strokeRect(46, WHEEL.y - 64, 508, 128);
      bigText(g, 'Gewonnen:', 300, WHEEL.y - 30, 34, '#c1121f', 'rgba(255,255,255,.9)');
      bigText(g, result, 300, WHEEL.y + 26, result.length > 16 ? 36 : 48, '#370617', 'rgba(255,255,255,.9)');
    }
  }
};
startCard(scene);
