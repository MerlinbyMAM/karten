// Willkommen Baby: Wolken bedecken den Himmel. Wolken wegwischen/antippen
// -> darunter erscheinen Name, Datum, Gewicht/Größe (Parameter). Danach
// steigen Ballons auf, Sterne funkeln, Brahms-Wiegenlied (gemeinfrei).
import { startCard, t, bigText, rnd } from '../core/card.js';

const P = new URLSearchParams(location.search);
const NAME = P.get('name') || t('baby.hello');
const INFO = [P.get('datum'), [P.get('gewicht'), P.get('groesse')].filter(Boolean).join(' · ')].filter(Boolean);

let clouds, done, t0, balloons, sparks;
const AREA = { x: 60, y: 168, w: 480, h: 220 };

const scene = {
  title: t('baby.title'), subtitle: t('baby.sub'), emoji: '🍼',
  accent: '#fbe7c6', button: '#7aa5a0', bg: '#3d5a80',
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    clouds = [];
    for(let i=0;i<14;i++) clouds.push({ x: AREA.x + 40 + (i%5)*100 + rnd(-20, 20), y: AREA.y + 35 + Math.floor(i/5)*72 + rnd(-10, 10), r: rnd(62, 82), vx: 0, vy: 0, gone: 0 });
    done = false; t0 = 0; balloons = []; sparks = [];
  },
  push(x, y, ctx, strong){
    for(const c of clouds){
      if(c.gone) continue;
      const d = Math.hypot(c.x - x, c.y - y);
      if(d < c.r + 30){
        const a = Math.atan2(c.y - y, c.x - x), f = strong ? 520 : 260;
        c.vx += Math.cos(a)*f; c.vy += Math.sin(a)*f*.5; c.gone = 1;
        ctx.noise(0, .35, .05, 600);
        ctx.tone(rnd(900, 1300), 0, .5, 'sine', .035);
      }
    }
    const left = clouds.filter(c => !c.gone).length;
    if(!done && left <= 2){
      done = true; t0 = ctx.t;
      for(const c of clouds) if(!c.gone){ c.gone = 1; c.vx = (c.x < 300 ? -1 : 1)*300; }
      // Brahms: Wiegenlied (gemeinfrei)
      ctx.melody([['E5',1],['E5',1],['G5',3],['E5',1],['E5',1],['G5',3],['E5',1],['G5',1],['C6',2],['B5',2],['A5',2],['A5',2],['G5',2],
                  ['D5',1],['E5',1],['F5',2],['D5',2],['D5',1],['E5',1],['F5',3],['D5',1],['F5',1],['B5',1],['A5',1],['G5',2],['B5',2],['C6',4]], 150, 'sine', .11, .2);
      const cols = ['#f7c8d0','#bde0c7','#fde2a7','#c7d7f5','#e3c6f0'];
      for(let i=0;i<12;i++) balloons.push({ x: rnd(40, 560), y: rnd(920, 1300), vy: rnd(-70, -40), c: cols[i%5], ph: rnd(0, 6) });
      setTimeout(() => ctx.showAgain(true), 7000);
    }
  },
  onTap(x, y, ctx){ this.push(x, y, ctx, true); },
  onDrag(x, y, ctx){ this.push(x, y, ctx, false); },
  update(dt, ctx){
    for(const c of clouds){ if(c.gone){ c.x += c.vx*dt; c.y += c.vy*dt; c.vx *= Math.pow(.6, dt); c.vy *= Math.pow(.6, dt); c.gone = Math.min(2, c.gone + dt*.6); } }
    for(const b of balloons){ b.y += b.vy*dt; b.x += Math.sin(ctx.t + b.ph)*12*dt; }
    if(done && Math.random() < .3) sparks.push({ x: rnd(80, 520), y: rnd(150, 420), life: 1 });
    for(const s of sparks) s.life -= dt; sparks = sparks.filter(s => s.life > 0);
  },
  draw(g, ctx){
    // Text unter den Wolken (immer gezeichnet, Wolken liegen drüber)
    const a = done ? Math.min(1, (ctx.t - t0)/1.2) : .0;
    g.fillStyle = `rgba(255,252,245,${.55 + .3*a})`;
    g.beginPath(); g.roundRect ? g.roundRect(AREA.x, AREA.y, AREA.w, AREA.h, 40) : g.rect(AREA.x, AREA.y, AREA.w, AREA.h); g.fill();
    bigText(g, NAME, 300, AREA.y + 70, NAME.length > 12 ? 50 : 64, '#c98b6b', 'rgba(255,255,255,.95)');
    INFO.forEach((l, i) => bigText(g, l, 300, AREA.y + 138 + i*46, 32, '#6b8f8a', 'rgba(255,255,255,.95)'));
    if(!INFO.length) bigText(g, t('baby.welcome'), 300, AREA.y + 145, 36, '#6b8f8a', 'rgba(255,255,255,.95)');
    for(const s of sparks){ g.fillStyle = `rgba(255,215,120,${s.life})`; g.font = `${18 + 10*s.life}px serif`; g.textAlign = 'center'; g.fillText('✦', s.x, s.y); }
    // Wolken
    for(const c of clouds){
      const al = c.gone ? Math.max(0, 1 - (c.gone - 1)) : 1; if(al <= 0) continue;
      g.fillStyle = `rgba(255,255,255,${.97*al})`;
      for(const [dx, dy, k] of [[0,0,1],[-.6,.15,.7],[.6,.15,.7],[-.25,-.35,.65],[.3,-.3,.6]]){ g.beginPath(); g.arc(c.x + dx*c.r, c.y + dy*c.r, c.r*k*.75, 0, 7); g.fill(); }
    }
    for(const b of balloons){
      g.strokeStyle = 'rgba(120,120,120,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(b.x, b.y + 38); g.quadraticCurveTo(b.x + 8, b.y + 70, b.x, b.y + 100); g.stroke();
      g.fillStyle = b.c; g.beginPath(); g.ellipse(b.x, b.y, 28, 36, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(b.x - 9, b.y - 12, 6, 10, -.4, 0, 7); g.fill();
    }
    if(!done && ctx.t < 5){ g.globalAlpha = Math.min(1, 5 - ctx.t); bigText(g, t('baby.hint'), 300, 440, 38, '#fff', 'rgba(70,110,130,.85)'); g.globalAlpha = 1; }
  }
};
startCard(scene);
