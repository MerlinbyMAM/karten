// Liebesbrief: Antippen des Siegels -> Siegel bricht, Umschlag öffnet sich,
// Brief gleitet heraus mit persönlicher Nachricht (?text=, ?von=), Rosenblätter regnen.
// Herzen tippen = kleine Herz-Explosion.
import { startCard, bigText, wrapText, fitLines, rnd } from '../core/card.js';
import { ENV } from './data.js';   // Umschlag-Box {x,y,w,h} in 600x900-Koordinaten

const P = new URLSearchParams(location.search);
const TEXT = P.get('text') || 'Du bist das Schönste, was mir je passiert ist. Ich liebe dich!';
const VON = P.get('von') || '';

let phase, t0, petals, hearts, crack;

const scene = {
  title: 'Für dich, mein Schatz', subtitle: 'Tippe auf das Siegel und öffne den Brief.', emoji: '💌',
  accent: '#ffd1dc', button: '#a4161a', bg: '#3a0d14',
  init(ctx){ this.restart(ctx); },
  restart(ctx){ phase = 'closed'; t0 = 0; petals = []; hearts = []; crack = 0; },
  onTap(x, y, ctx){
    const sx = ENV.x + ENV.w/2, sy = ENV.y + ENV.h*.55;
    if(phase === 'closed'){
      if(Math.hypot(x - sx, y - sy) < Math.max(70, ENV.w*.25)){
        phase = 'open'; t0 = ctx.t;
        ctx.noise(0, .08, .25, 1500); ctx.noise(.06, .12, .15, 3000);   // Siegel bricht
        ctx.tone(330, .05, .5, 'sine', .05);
        ctx.melody([['E5',1],['G5',1],['C6',2],['B5',1],['G5',1],['A5',2],['E5',1],['F5',1],['G5',3]], 90, 'sine', .09, .5);
        for(let i=0;i<60;i++) petals.push({ x: rnd(0, 600), y: rnd(-500, -20), vx: rnd(-20, 20), vy: rnd(50, 110), r: rnd(0, 6), vr: rnd(-2, 2), s: rnd(10, 18) });
        setTimeout(() => ctx.showAgain(true), 5500);
      } else { crack = 1; ctx.tone(500, 0, .15, 'sine', .04); }
      return;
    }
    for(let i=0;i<10;i++){ const a = rnd(0, 6.28), v = rnd(60, 200); hearts.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 80, life: 1.2, s: rnd(14, 26) }); }
    ctx.tone(rnd(700, 1000), 0, .2, 'sine', .05);
  },
  update(dt, ctx){
    for(const p of petals){ p.x += (p.vx + Math.sin(ctx.t + p.r)*20)*dt; p.y += p.vy*dt; p.r += p.vr*dt; if(p.y > 920){ p.y = -20; p.x = rnd(0, 600); } }
    for(const h of hearts){ h.x += h.vx*dt; h.y += h.vy*dt; h.vy += 200*dt; h.life -= dt; }
    hearts = hearts.filter(h => h.life > 0);
    crack = Math.max(0, crack - dt*2);
  },
  draw(g, ctx){
    const sx = ENV.x + ENV.w/2, sy = ENV.y + ENV.h*.55;
    if(phase === 'closed'){
      const pulse = 1 + .08*Math.sin(ctx.t*4);
      g.strokeStyle = `rgba(255,220,120,${.5 + .4*Math.sin(ctx.t*4)})`; g.lineWidth = 4;
      g.beginPath(); g.arc(sx, sy, 48*pulse, 0, 7); g.stroke();
      bigText(g, 'Tipp aufs Siegel', 300, 700 + crack*4*Math.sin(ctx.t*60), 38, '#fff', 'rgba(90,10,20,.85)');
    } else {
      const k = Math.min(1, (ctx.t - t0)/1.6), e = 1 - Math.pow(1 - k, 3);
      // dunkle Bühne
      g.fillStyle = `rgba(40,5,12,${.45*e})`; g.fillRect(0, 0, 600, 900);
      // Brief gleitet aus dem Umschlag nach oben und wird groß
      const w = 300 + 200*e, h = 200 + 400*e, cx = 300, cy = sy*(1-e) + 430*e;
      g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30;
      g.fillStyle = '#fbf3e4'; g.fillRect(cx - w/2, cy - h/2, w, h); g.restore();
      g.strokeStyle = '#d4a373'; g.lineWidth = 3; g.strokeRect(cx - w/2 + 12, cy - h/2 + 12, w - 24, h - 24);
      if(k > .7){
        g.globalAlpha = Math.min(1, (k - .7)/.3);
        g.fillStyle = '#a4161a'; g.font = 'italic 700 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('Mein Schatz,', cx, cy - h/2 + 70);
        g.font = 'italic 30px Georgia, serif'; g.fillStyle = '#5a1a1a';
        const shown = TEXT.slice(0, Math.floor((ctx.t - t0 - 1.2)*22));
        // Nachricht mittig zwischen Anrede und Herz setzen
        const n = fitLines(g, TEXT, w - 80).length, top = cy - h/2 + 115, bot = cy + h/2 - (VON ? 135 : 95);
        wrapText(g, shown, cx, top + Math.max(0, (bot - top - n*42)/2) + 21, w - 80, 42);
        if(shown.length >= TEXT.length){
          g.font = '44px serif'; g.fillText('❤', cx, cy + h/2 - (VON ? 100 : 60));
          if(VON){ g.font = 'italic 30px Georgia, serif'; g.fillText('– ' + VON, cx, cy + h/2 - 50); }
        }
        g.globalAlpha = 1;
      }
    }
    for(const p of petals){ g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = '#c9184a'; g.beginPath(); g.ellipse(0, 0, p.s*.6, p.s, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-2, -3, p.s*.2, p.s*.5, 0, 0, 7); g.fill(); g.restore(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for(const h of hearts){ g.globalAlpha = Math.max(0, h.life); g.font = `${h.s}px serif`; g.fillStyle = '#ff4d6d'; g.fillText('❤', h.x, h.y); }
    g.globalAlpha = 1;
  }
};
startCard(scene);
