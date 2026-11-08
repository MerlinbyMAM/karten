// Vatertag: Der gedruckte Grill wird lebendig.
// Die acht Würstchen, die auf der Karte gedruckt sind, werden deckungsgleich aus dem Kartenbild ausgeschnitten
// und brutzeln live: erst roh, dann goldbraun, dann verkohlt. Im goldenen Moment antippen = wenden (Wurst springt hoch),
// zweite Seite golden = antippen und sie fliegt auf den gedruckten Teller. Rauch steigt aus der gedruckten Glut.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, rnd, MEL } from '../core/kit.js';

const TIME = 45, PLATE = { x: 500, y: 785 }, TH = 25;     // Tellermitte, Wurstdicke (Kartenkoordinaten 600×900)
// Gedruckte Würstchen: Endpunkte auf dem Kartenbild (vermessen)
const PRINTED = [[272, 432, 370, 460], [202, 447, 315, 477], [377, 452, 482, 480], [160, 460, 272, 500],
                 [340, 472, 455, 505], [127, 485, 237, 535], [290, 490, 412, 532], [250, 517, 375, 562]];
const SL = PRINTED.map(([x1, y1, x2, y2]) => ({ x: (x1 + x2)/2, y: (y1 + y2)/2, a: Math.atan2(y2 - y1, x2 - x1), L: Math.hypot(x2 - x1, y2 - y1) + 6 }));

const img = new Image(); img.src = 'karte.jpg';
let S, fx, fin, time, pts, tt, over, served, smoke;

function capsule(g, L, T){ g.beginPath(); g.roundRect(-L/2, -T/2, L, T, T/2); }

// Ausschnitt aus dem Kartenbild (lokal um die Wurstmitte), mit Garstufen-Tönung
function drawCut(g, k, s, x, y, ang, scale, alpha){
  const p = SL[k];
  g.save(); g.globalAlpha = alpha; g.translate(x, y); g.rotate(ang); g.scale(scale, scale);
  capsule(g, p.L, TH); g.save(); g.clip();
  g.rotate(-p.a); g.translate(-p.x, -p.y);
  if(img.complete && img.naturalWidth) g.drawImage(img, 0, 0, 600, 900);
  g.restore();
  const c = s.cook[s.side];
  let tint = null;
  if(c < .8) tint = `rgba(246,160,150,${.72*(1 - c/.8)})`;
  else if(c > 1.08) tint = `rgba(22,12,8,${Math.min(.88, (c - 1.08)/.22*.88)})`;
  if(tint){ capsule(g, p.L, TH); g.fillStyle = tint; g.fill(); }
  if(c >= .8 && c <= 1.08){ capsule(g, p.L, TH); g.strokeStyle = `rgba(255,215,90,${.55 + .45*Math.sin(tt*12)})`; g.lineWidth = 3; g.stroke(); }
  g.restore();
}

// Loch im Rost, wenn eine gedruckte Wurst gerade nicht an ihrem Platz liegt: Glut + Rostgitter
function drawHole(g, k){
  const p = SL[k];
  g.save(); g.translate(p.x, p.y); g.rotate(p.a); capsule(g, p.L + 8, TH + 9); g.clip();
  g.fillStyle = '#160b07'; g.fillRect(-p.L, -TH, p.L*2, TH*2);
  for(let i = 0; i < 22; i++){ const x = -p.L/2 + (i + .5)*p.L/22, y = Math.sin(i*2.3 + k)*9;
    g.fillStyle = `rgba(255,${70 + (i*37 % 80)},20,${.35 + .3*Math.sin(tt*3 + i + k)})`; g.beginPath(); g.arc(x, y, 2 + (i % 3), 0, 7); g.fill(); }
  g.rotate(-p.a); g.strokeStyle = 'rgba(150,140,130,.85)'; g.lineWidth = 2.5;
  for(let x = -80; x <= 80; x += 15){ g.beginPath(); g.moveTo(x - 20, -40); g.lineTo(x + 20, 40); g.stroke(); }
  g.restore();
}

const fresh = (k, drop) => ({ k, side: 0, cook: [drop ? 0 : rnd(0, .35), 0], rate: rnd(.17, .24), st: drop ? 'drop' : 'on', t: 0 });

const scene = {
  title: t('vatertag.title'), subtitle: t('vatertag.sub'), emoji: '🌭',
  accent: '#ffcf7a', button: '#c0542b', bg: '#3b2a1e',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = SL.map((_, k) => fresh(k)); time = TIME; pts = 0; tt = 0; over = false; served = 0; smoke = []; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    let bi = -1, bd = 1e9;
    S.forEach((s, k) => { if(s.st !== 'on') return; const p = SL[k], dx = x - p.x, dy = y - p.y;
      const u = dx*Math.cos(p.a) + dy*Math.sin(p.a), v = -dx*Math.sin(p.a) + dy*Math.cos(p.a);
      const d = Math.abs(v) + Math.max(0, Math.abs(u) - p.L/2); if(d < bd){ bd = d; bi = k; } });
    if(bi < 0 || bd > 26) return;
    const s = S[bi], p = SL[bi], c = s.cook[s.side];
    if(c < .55){ fx.pop(p.x, p.y - 34, t('vatertag.raw'), '#ffe2d6', 28); ctx.tone(330, 0, .1, 'sine', .07); return; }
    const perfect = c >= .8 && c <= 1.08; pts += perfect ? 2 : 1;
    fx.pop(p.x, p.y - 40, perfect ? (s.side ? t('vatertag.served') : t('vatertag.perfect')) : '+1', perfect ? '#ffd34d' : '#fff', perfect ? 32 : 28);
    if(s.side === 0){ s.st = 'flip'; s.t = 0; ctx.noise(0, .12, .05, 2000); ctx.tone(perfect ? 880 : 660, 0, .1, 'triangle', .09); if(perfect) fx.sparkle(p.x, p.y, 10); }
    else { s.st = 'fly'; s.t = 0; ctx.melody([['C5', .25], ['E5', .25], ['G5', .5]], 300, 'triangle', .1); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(!over){ time -= dt; if(time <= 0){ time = 0; this.finish(ctx); } }
    if(Math.random() < dt*9) smoke.push({ x: rnd(150, 450), y: rnd(470, 560), r: rnd(8, 16), a: .35, vx: rnd(-8, 8) });
    for(const m of smoke){ m.y -= dt*45; m.x += m.vx*dt + Math.sin(tt + m.y*.02)*dt*10; m.r += dt*9; m.a -= dt*.09; }
    smoke = smoke.filter(m => m.a > 0);
    if(over) return;
    const heat = 1 + (TIME - time)/TIME*.5;
    S.forEach((s, k) => {
      const p = SL[k];
      s.t += dt;
      if(s.st === 'flip'){ if(s.t >= .55){ s.st = 'on'; s.side = 1; } return; }
      if(s.st === 'fly'){ if(s.t >= .8){ served++; fx.burst(PLATE.x, PLATE.y - 20, 10, ['#ffd34d', '#ff9a3c', '#fff'], 160, 300, 6); S[k] = fresh(k, true); } return; }
      if(s.st === 'drop'){ if(s.t >= .6){ s.st = 'on'; ctx.noise(0, .1, .03, 2500); } return; }
      s.cook[s.side] += dt*s.rate*heat;
      if(Math.random() < dt*2.2*s.cook[s.side]) fx.burst(p.x + rnd(-p.L/3, p.L/3), p.y - 8, 1, s.cook[s.side] > 1.08 ? ['#444', '#666'] : ['rgba(255,255,255,.6)'], 30, -50, 7);
      if(s.cook[s.side] > 1.3){ pts = Math.max(0, pts - 2); fx.pop(p.x, p.y - 38, t('vatertag.burnt'), '#ff8a6a', 30);
        fx.burst(p.x, p.y, 14, ['#222', '#444', '#777'], 110, -40, 11); fx.shake(4); ctx.tone(150, 0, .3, 'sawtooth', .06); S[k] = fresh(k, true); }
    });
  },
  finish(ctx){
    over = true; const b = best('vatertag', pts);
    fin.start(ctx, greeting('vatertag'), [t('vatertag.score', { n: pts }) + (b.isNew ? '  ★' : ''), t('vatertag.best', { n: b.best })], MEL.fanfare);
  },
  draw(g, ctx){
    const dt = 1/60;
    for(const m of smoke){ g.fillStyle = `rgba(235,230,220,${m.a*.5})`; g.beginPath(); g.arc(m.x, m.y, m.r, 0, 7); g.fill(); }
    fx.applyShake(g);
    S.forEach((s, k) => { if(s.st !== 'on') drawHole(g, k); });
    S.forEach((s, k) => {
      const p = SL[k];
      if(s.st === 'on') drawCut(g, k, s, p.x, p.y, p.a, 1, 1);
      else if(s.st === 'flip'){ const u = s.t/.55, h = Math.sin(u*Math.PI)*46;
        g.save(); g.translate(p.x, p.y - h); g.scale(1, Math.abs(Math.cos(u*Math.PI))*.85 + .15); g.translate(-p.x, -p.y);
        drawCut(g, k, s, p.x, p.y, p.a + (u > .5 ? Math.PI : 0), 1 + h/300, 1); g.restore(); }
      else if(s.st === 'fly'){ const u = Math.min(1, s.t/.8), e = u*u*(3 - 2*u);
        const x = p.x + (PLATE.x - p.x)*e, y = p.y + (PLATE.y - p.y)*e - Math.sin(u*Math.PI)*120;
        drawCut(g, k, s, x, y, p.a + u*Math.PI*2, 1 - u*.35, 1 - Math.max(0, u - .85)/.15); }
      else if(s.st === 'drop'){ const u = Math.min(1, s.t/.6), y = p.y - (1 - u*u)*160;
        drawCut(g, k, s, p.x, y, p.a, 1, Math.min(1, u*3)); }
    });
    fx.draw(g); g.restore();
    if(!fin.on) hud(g, ['🔥 ' + pts, '⏱ ' + Math.ceil(time) + ' s', '🏆 ' + (peekBest('vatertag') ?? '–')], 345);
    if(!fin.on && served === 0 && pts === 0) hint(g, t('vatertag.hint'), tt, 640, 6);
    fin.draw(g, dt, 'rgba(50,25,10,');
  }
};
startCard(scene);
window.__vt = { S: () => S, SL, get pts(){ return pts; }, get served(){ return served; } };
