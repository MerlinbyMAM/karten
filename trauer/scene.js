// Trauer / Anteilnahme: Sieben kleine Schwimmkerzen treiben still auf dem Wasser.
// Antippen zündet eine Kerze an; aus ihr löst sich eine Laterne, steigt langsam auf und wird zu einem Stern.
// Keine Punkte, kein Zeitdruck. Sind alle Lichter oben, erscheint ruhig der Gruß.
import { startCard, t } from '../core/card.js';
import { makeFx, greeting, hint, rnd, bigText } from '../core/kit.js';

let WATER = 668;                                          // Wasserlinie auf dem Kartenbild – nach Motiv eingestellt
const N = 7, NOTES = [392, 440, 523.3, 587.3, 659.3, 784, 880];
let candles, lanterns, stars, fx, tt, done, finT, lit;

function drawCandle(g, c){
  const x = c.x + Math.sin(tt*.6 + c.ph)*8, y = WATER + c.dy + Math.sin(tt*1.3 + c.ph)*2.5;
  c.cx = x; c.cy = y;
  g.save(); g.translate(x, y);
  // Spiegelung im Wasser
  if(c.on){ const r = g.createRadialGradient(0, 18, 2, 0, 18, 70); r.addColorStop(0, `rgba(255,200,110,${.35*c.on})`); r.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = r; g.beginPath(); g.ellipse(0, 18, 70, 22, 0, 0, 7); g.fill(); }
  // Blütenschale
  g.fillStyle = 'rgba(255,255,255,.92)';
  for(let i = 0; i < 6; i++){ const a = Math.PI + i/5*Math.PI; g.save(); g.rotate(a - Math.PI*1.5); g.beginPath(); g.ellipse(0, -14, 8, 17, 0, 0, 7); g.restore(); g.fill(); }
  g.fillStyle = '#f4e8d6'; g.beginPath(); g.ellipse(0, 2, 26, 9, 0, 0, 7); g.fill();
  g.fillStyle = '#fffaf0'; g.fillRect(-9, -16, 18, 17); g.fillStyle = '#e9dcc6'; g.beginPath(); g.ellipse(0, -16, 9, 3, 0, 0, 7); g.fill();
  g.strokeStyle = '#3a2a20'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -18); g.lineTo(0, -23); g.stroke();
  if(c.on){
    const f = c.on*(1 + Math.sin(tt*9 + c.ph)*.08);
    const gl = g.createRadialGradient(0, -30, 1, 0, -30, 46*f); gl.addColorStop(0, 'rgba(255,220,140,.75)'); gl.addColorStop(1, 'rgba(255,190,90,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(0, -30, 46*f, 0, 7); g.fill();
    g.fillStyle = '#ffd77a'; g.beginPath(); g.moveTo(0, -24 - 22*f); g.quadraticCurveTo(7*f, -30, 0, -22); g.quadraticCurveTo(-7*f, -30, 0, -24 - 22*f); g.fill();
    g.fillStyle = '#fff6da'; g.beginPath(); g.ellipse(0, -28, 2.5*f, 5*f, 0, 0, 7); g.fill();
  } else if(!done){
    g.globalAlpha = .35 + .3*Math.sin(tt*2.2 + c.ph); g.strokeStyle = '#fff3d0'; g.lineWidth = 2; g.beginPath(); g.arc(0, -10, 34, 0, 7); g.stroke();
  }
  g.restore();
}

function drawLantern(g, l){
  g.save(); g.translate(l.x + Math.sin(l.t*.9 + l.ph)*14, l.y); g.rotate(Math.sin(l.t*.7 + l.ph)*.06);
  const s = l.s, a = l.fade;
  g.globalAlpha = a;
  const gl = g.createRadialGradient(0, 0, 2, 0, 0, 60*s); gl.addColorStop(0, 'rgba(255,190,100,.55)'); gl.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 60*s, 0, 7); g.fill();
  const body = g.createLinearGradient(0, -26*s, 0, 26*s); body.addColorStop(0, '#ffe7b0'); body.addColorStop(1, '#ff9d4a');
  g.fillStyle = body; g.beginPath(); g.moveTo(-16*s, -24*s); g.lineTo(16*s, -24*s); g.quadraticCurveTo(22*s, 0, 13*s, 24*s); g.lineTo(-13*s, 24*s); g.quadraticCurveTo(-22*s, 0, -16*s, -24*s); g.fill();
  g.fillStyle = '#fff4cf'; g.beginPath(); g.ellipse(0, 18*s, 6*s, 4*s, 0, 0, 7); g.fill();
  g.restore();
}

function drawStar(g, s){
  const tw = .6 + .4*Math.sin(tt*2 + s.ph);
  g.save(); g.globalAlpha = s.a*tw;
  const gl = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, 16); gl.addColorStop(0, 'rgba(255,248,220,.95)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(s.x, s.y, 16, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,250,230,.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(s.x - 9, s.y); g.lineTo(s.x + 9, s.y); g.moveTo(s.x, s.y - 9); g.lineTo(s.x, s.y + 9); g.stroke();
  g.restore();
}

const scene = {
  title: t('trauer.title'), subtitle: t('trauer.sub'), emoji: '🕯️',
  accent: '#f3dfb0', button: '#6d6a9c', bg: '#272846',
  init(ctx){ fx = makeFx(); this.restart(ctx); },
  restart(ctx){
    candles = Array.from({ length: N }, (_, i) => ({ x: 120 + i*60, dy: (i % 2 ? 48 : 0) + rnd(-4, 4), ph: rnd(0, 6), on: 0, lit: false }));
    lanterns = []; stars = []; tt = 0; done = false; finT = 0; lit = 0; fx.clear();
    ctx.showAgain && ctx.showAgain(false);
  },
  onTap(x, y, ctx){
    if(done) return;
    let bi = -1, bd = 1e9;
    candles.forEach((c, i) => { if(c.lit) return; const d = Math.hypot(x - (c.cx ?? c.x), y - (c.cy ?? WATER)); if(d < bd){ bd = d; bi = i; } });
    if(bi < 0 || bd > 90) return;
    const c = candles[bi]; c.lit = true; lit++;
    ctx.tone(NOTES[(lit - 1) % NOTES.length], 0, 1.8, 'sine', .07); ctx.tone(NOTES[(lit - 1) % NOTES.length]*1.5, .05, 1.4, 'sine', .025);
    fx.sparkle(c.cx, c.cy - 26, 6);
    setTimeout(() => lanterns.push({ x: c.cx, y: c.cy - 40, t: 0, ph: rnd(0, 6), s: 1, fade: 1,
      tx: 110 + (lit*137 % 380), ty: 200 + (lit*61 % 190) }), 900);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    for(const c of candles) if(c.lit) c.on = Math.min(1, c.on + dt*1.5);
    for(const l of lanterns){
      l.t += dt; l.y -= dt*(42 + Math.min(30, l.t*6)); l.x += (l.tx - l.x)*dt*.15; l.s = Math.max(.35, 1 - l.t*.08);
      if(l.y < l.ty){ l.fade -= dt*.7; if(l.fade <= 0 && !l.st){ l.st = 1; stars.push({ x: l.x + Math.sin(l.t*.9 + l.ph)*14, y: l.y, ph: rnd(0, 6), a: 0 }); ctx.tone(1318.5, 0, .9, 'sine', .03); } }
    }
    lanterns = lanterns.filter(l => l.fade > 0);
    for(const s of stars) s.a = Math.min(1, s.a + dt*.8);
    if(!done && stars.length === N){ done = true; finT = 0;
      ctx.melody([['E5', 1], ['G5', 1], ['C6', 2], ['B5', 1], ['G5', 1], ['E5', 2], ['D5', 1], ['E5', 3]], 72, 'sine', .08);
      setTimeout(() => ctx.showAgain(true), 4000); }
    if(done) finT += dt;
  },
  draw(g, ctx){
    if(done){ g.fillStyle = `rgba(20,20,45,${Math.min(.38, finT*.15)})`; g.fillRect(0, 0, 600, 900); }
    for(const s of stars) drawStar(g, s);
    for(const l of lanterns) drawLantern(g, l);
    for(const c of candles) drawCandle(g, c);
    fx.draw(g);
    if(!done && lit === 0) hint(g, t('trauer.hint'), tt, WATER - 120, 6);
    if(done && finT > 1.2){
      const a = Math.min(1, (finT - 1.2)*.6);
      g.save(); g.globalAlpha = a;
      const msg = greeting('trauer');
      bigText(g, msg, 300, 440, msg.length > 22 ? 40 : 48, '#fff8e8', 'rgba(30,25,60,.85)');
      bigText(g, t('trauer.line'), 300, 505, 28, '#f3dfb0', 'rgba(30,25,60,.85)');
      g.restore();
    }
  }
};
startCard(scene);
window.__tr = { candles: () => candles, get stars(){ return stars.length; } };
