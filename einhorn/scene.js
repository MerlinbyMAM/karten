// Kindergeburtstag (Einhorn): Ein kleines Einhorn galoppiert über die Wiese und zieht einen Regenbogen hinter sich her.
// Tippen = Springen (zweimal tippen = Doppelsprung). Sterne und Cupcakes einsammeln, über Pilze und Pfützen hüpfen.
// 40 Sekunden, dann Finale mit Namen des Geburtstagskinds und der Sternenzahl.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, rnd, MEL } from '../core/kit.js';

let GROUND = 790;                                       // Oberkante der Wiese auf dem Kartenbild – nach Motiv eingestellt
const TIME = 40, PX = 150;
let u, items, trail, fx, fin, time, stars, speed, spawn, tt, over, hitT;

function drawUnicorn(g, x, y, run, squash){
  g.save(); g.translate(x, y); g.scale(1.35, 1.35*squash);
  g.shadowColor = 'rgba(90,40,120,.55)'; g.shadowBlur = 10;
  const leg = Math.sin(run*14)*10;
  g.strokeStyle = '#e9d8f2'; g.lineWidth = 8; g.lineCap = 'round';
  for(const [lx, ph] of [[-18, 0], [-8, 1], [14, 1], [24, 0]]){ const a = ph ? leg : -leg; g.beginPath(); g.moveTo(lx, -14); g.lineTo(lx + a*.4, 6); g.stroke(); }
  g.fillStyle = '#c9a3e0'; for(const lx of [-18, -8, 14, 24]) { g.beginPath(); g.arc(lx + (lx % 2 ? leg : -leg)*.4, 7, 4, 0, 7); g.fill(); }
  // Schweif
  ['#ff8fb1', '#ffd36e', '#8fe3b4', '#8fc8ff', '#c9a3ff'].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, -30 + i*3); g.quadraticCurveTo(-52, -26 + i*4 + Math.sin(run*10 + i)*4, -48, -4 + i*3); g.stroke(); });
  // Körper
  const gr = g.createLinearGradient(0, -48, 0, -8); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#efe4f7');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, -28, 34, 20, 0, 0, 7); g.fill();
  // Hals + Kopf
  g.beginPath(); g.ellipse(26, -50, 11, 18, .5, 0, 7); g.fill();
  g.beginPath(); g.ellipse(40, -64, 17, 13, .25, 0, 7); g.fill();
  g.fillStyle = '#ffc6d9'; g.beginPath(); g.ellipse(52, -60, 6, 5, .2, 0, 7); g.fill();
  g.fillStyle = '#3a2440'; g.beginPath(); g.arc(42, -68, 2.8, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(43, -69, 1, 0, 7); g.fill();
  g.fillStyle = '#ffb3cb'; g.beginPath(); g.arc(46, -62, 3, 0, 7); g.fill();
  // Horn
  const hg = g.createLinearGradient(36, -96, 44, -76); hg.addColorStop(0, '#fff3b0'); hg.addColorStop(1, '#e0a92c');
  g.fillStyle = hg; g.beginPath(); g.moveTo(34, -76); g.lineTo(46, -100); g.lineTo(44, -74); g.fill();
  // Mähne
  ['#ff8fb1', '#ffd36e', '#8fe3b4', '#8fc8ff'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.ellipse(26 - i*5, -72 + i*9, 8, 6, .6, 0, 7); g.fill(); });
  g.restore();
}
function drawStar(g, x, y, r, rot){ g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); for(let i=0;i<10;i++){ const a = i/10*Math.PI*2 - Math.PI/2, rr = i % 2 ? r*.45 : r; g.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); } g.closePath();
  const gr = g.createRadialGradient(0, 0, 1, 0, 0, r); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(1, '#ffc93c'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#e8a516'; g.lineWidth = 2; g.stroke(); g.restore(); }
function drawItem(g, it){
  if(it.k === 'star') drawStar(g, it.x, it.y, 16, tt*2 + it.x*.01);
  else if(it.k === 'cake'){ g.fillStyle = '#c98a5a'; g.beginPath(); g.moveTo(it.x - 15, it.y); g.lineTo(it.x + 15, it.y); g.lineTo(it.x + 11, it.y + 18); g.lineTo(it.x - 11, it.y + 18); g.fill();
    g.fillStyle = '#ffb3d1'; g.beginPath(); g.arc(it.x, it.y - 2, 16, Math.PI, 0); g.fill(); g.fillStyle = '#e8434f'; g.beginPath(); g.arc(it.x, it.y - 18, 5, 0, 7); g.fill(); }
  else if(it.k === 'shroom'){ g.fillStyle = '#fff3e6'; g.fillRect(it.x - 7, it.y - 20, 14, 20); g.fillStyle = '#e8434f'; g.beginPath(); g.ellipse(it.x, it.y - 20, 22, 15, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#fff'; for(const [dx, dy] of [[-10, -26], [6, -30], [12, -22]]){ g.beginPath(); g.arc(it.x + dx, it.y + dy, 3.5, 0, 7); g.fill(); } }
  else { g.fillStyle = 'rgba(120,170,230,.75)'; g.beginPath(); g.ellipse(it.x, it.y - 3, 34, 8, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(it.x - 14, it.y - 6, 12, 2); }
}

const scene = {
  title: t('einhorn.title'), subtitle: t('einhorn.sub'), emoji: '🦄',
  accent: '#ffc6e0', button: '#b07ad6', bg: '#5b3f7a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ u = { y: GROUND, vy: 0, jumps: 0, run: 0 }; items = []; trail = []; time = TIME; stars = 0; speed = 260; spawn = .6; tt = 0; over = false; hitT = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    if(u.jumps < 2){ u.vy = u.jumps ? -640 : -760; u.jumps++; ctx.tone(u.jumps === 1 ? 660 : 880, 0, .12, 'sine', .1); fx.sparkle(PX, u.y - 30, 6); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(!over){ time -= dt; if(time <= 0){ time = 0; this.finish(ctx); } }
    speed = 260 + (TIME - time)*5;
    u.run += dt*(over ? 0 : 1); u.vy += 2100*dt; u.y += u.vy*dt; if(u.y >= GROUND){ u.y = GROUND; u.vy = 0; u.jumps = 0; }
    hitT = Math.max(0, hitT - dt);
    trail.push({ x: PX - 30, y: u.y - 30 }); for(const p of trail) p.x -= speed*dt; trail = trail.filter(p => p.x > -20); if(trail.length > 60) trail.shift();
    if(!over){ spawn -= dt; if(spawn <= 0){ spawn = rnd(.55, 1.05)*(260/speed);
      const r = Math.random();
      if(r < .45) items.push({ k: 'star', x: 640, y: GROUND - rnd(60, 230) });
      else if(r < .55) items.push({ k: 'cake', x: 640, y: GROUND - rnd(130, 240) });
      else if(r < .82) items.push({ k: 'shroom', x: 640, y: GROUND });
      else items.push({ k: 'puddle', x: 640, y: GROUND });
    } }
    for(const it of items){ it.x -= speed*dt;
      if(it.got) continue;
      const near = Math.abs(it.x - (PX + 10)) < 34;
      if((it.k === 'star' || it.k === 'cake') && near && Math.abs(it.y - (u.y - 55)) < 60){
        it.got = 1; stars += it.k === 'cake' ? 3 : 1; fx.sparkle(it.x, it.y, 14); fx.pop(it.x, it.y - 30, it.k === 'cake' ? '+3' : '+1', '#fff3a8', 30);
        ctx.tone(it.k === 'cake' ? 1319 : 1047 + (stars % 5)*90, 0, .12, 'triangle', .1);
      }
      if((it.k === 'shroom' || it.k === 'puddle') && Math.abs(it.x - PX) < 30 && u.y > GROUND - 26 && !hitT){
        it.got = 1; hitT = 1; stars = Math.max(0, stars - 2); fx.pop(PX, u.y - 110, t('einhorn.oops'), '#fff', 32); ctx.tone(220, 0, .2, 'square', .06); fx.shake(4);
      }
    }
    items = items.filter(it => it.x > -60 && !(it.got && (it.k === 'star' || it.k === 'cake')));
  },
  finish(ctx){
    over = true; const b = best('einhorn', stars);
    fin.start(ctx, greeting('einhorn'), [t('einhorn.score', { n: stars }) + (b.isNew ? '  ★' : ''), t('einhorn.best', { n: b.best })], MEL.birthday);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(!fin.on) hud(g, ['⭐ ' + stars, '⏱ ' + Math.ceil(time) + ' s', '🏆 ' + (peekBest('einhorn') ?? '–')], 262);
    fx.applyShake(g);
    // Regenbogenspur
    ['#ff8fb1', '#ffd36e', '#8fe3b4', '#8fc8ff', '#c9a3ff'].forEach((c, i) => { g.strokeStyle = c; g.globalAlpha = .7; g.lineWidth = 6; g.beginPath();
      trail.forEach((p, k) => { const yy = p.y - 12 + i*6; k ? g.lineTo(p.x, yy) : g.moveTo(p.x, yy); }); g.stroke(); });
    g.globalAlpha = 1;
    for(const it of items) if(!it.got || it.k === 'shroom' || it.k === 'puddle') drawItem(g, it);
    g.globalAlpha = hitT > 0 && Math.floor(tt*12) % 2 ? .4 : 1;
    g.fillStyle = 'rgba(60,30,80,.25)'; g.beginPath(); g.ellipse(PX, GROUND + 6, 44*(1 - (GROUND - u.y)/500), 8, 0, 0, 7); g.fill();
    drawUnicorn(g, PX, u.y, u.run, u.y < GROUND ? 1.04 : 1);
    g.globalAlpha = 1;
    fx.draw(g); g.restore();
    if(!fin.on && stars === 0) hint(g, t('einhorn.hint'), tt, 470, 4);
    fin.draw(g, dt, 'rgba(70,40,100,');
  }
};
startCard(scene);
