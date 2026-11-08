// Wein: „Weinlese“ – von den gedruckten Rebstöcken fallen Trauben. Antippen, und sie fliegen in den Korb. Goldene Beeren zählen dreifach, 40 Trauben.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const SRC = [[160, 400, 40], [395, 405, 34], [92, 455, 18], [250, 330, 70], [470, 330, 60]], KORB = { x: 300, y: 640 }, TOTAL = 40;
let fx, fin, tt, phase, G, spawned, nextT, inKorb, pts, lost, pile;
const scene = {
  title: t('wein.title'), subtitle: t('wein.sub'), emoji: '🍇', accent: '#e0b0ff', button: '#6a1a3a', bg: '#3a2a14',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; G = []; spawned = 0; nextT = 0; inKorb = 0; pts = 0; lost = 0; pile = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; nextT = .3; return; } if(phase !== 'play') return;
    let bi = -1, bd = 58; G.forEach((g, k) => { if(g.st !== 'fall') return; const d = Math.hypot(g.x - x, g.y - y); if(d < bd){ bd = d; bi = k; } });
    if(bi < 0) return; const g = G[bi]; g.st = 'fly'; g.x0 = g.x; g.y0 = g.y; g.t = 0; g.tx = KORB.x + (Math.random() - .5)*120; g.ty = KORB.y + (Math.random() - .5)*14;
    ctx.tone(g.gold ? 1046 : 700 + Math.random()*200, 0, .09, 'triangle', .06); fx.sparkle(g.x, g.y, g.gold ? 14 : 5); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play'){ nextT -= dt; const prog = spawned/TOTAL;
      if(nextT <= 0 && spawned < TOTAL){ const s = SRC[Math.floor(Math.random()*SRC.length)]; spawned++;
        G.push({ st: 'fall', x: s[0] + (Math.random() - .5)*s[2]*2, y: s[1], vy: 40 + Math.random()*40 + prog*80, ph: Math.random()*6, gold: Math.random() < .12, r: 0, t: 0 }); nextT = Math.max(.35, 1.1 - prog*.8) * (.6 + Math.random()*.8); }
      for(const g of G){
        if(g.st === 'fall'){ g.vy += (120 + prog*160)*dt; g.y += g.vy*dt; g.x += Math.sin(tt*3 + g.ph)*20*dt; g.r += dt*2;
          if(g.y > 810){ g.st = 'splat'; g.t = 0; lost++; fx.burst(g.x, 812, 8, g.gold ? ['#ffd34d', '#fff2a0'] : ['#5a2a6a', '#8a4a9a', '#3a1a4a'], 120, 500, 3); ctx.tone(150, 0, .08, 'sine', .04); } }
        else if(g.st === 'fly'){ g.t += dt/.45; const u = Math.min(1, g.t); g.x = g.x0 + (g.tx - g.x0)*u; g.y = g.y0 + (g.ty - g.y0)*u - Math.sin(u*Math.PI)*90;
          if(u >= 1){ g.st = 'done'; inKorb++; pts += g.gold ? 3 : 1; if(pile.length < 60) pile.push({ x: g.tx, y: g.ty - Math.min(26, pile.length*.6) + (Math.random() - .5)*6, gold: g.gold });
            fx.pop(g.tx, g.ty - 50, g.gold ? '+3' : '+1', g.gold ? '#ffe27a' : '#f0d0ff', g.gold ? 34 : 26); ctx.tone(g.gold ? 1318 : 523, 0, .08, 'sine', .05); } }
        else if(g.st === 'splat'){ g.t += dt; if(g.t > .8) g.st = 'gone'; } }
      G = G.filter(g => g.st !== 'done' && g.st !== 'gone');
      if(spawned >= TOTAL && !G.length) this.finish(ctx); } },
  finish(ctx){ phase = 'end'; const b = best('wein', pts, true);
    ctx.melody([['E5', .25], ['G5', .25], ['C6', .25], ['E6', .75]], 160, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('wein'), [t('wein.line'), t('wein.score', { n: inKorb, p: pts }) + (b.isNew && pts ? '  ★' : '') + '  ·  ' + t('wein.best', { n: b.best })], MEL.birthday), 400); },
  grape(g, x, y, r, gold){ const gr = g.createRadialGradient(x - r*.35, y - r*.35, r*.1, x, y, r); if(gold){ gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.5, '#f0c040'); gr.addColorStop(1, '#a07010'); } else { gr.addColorStop(0, '#b088c8'); gr.addColorStop(.5, '#5a2a7a'); gr.addColorStop(1, '#2a0a3a'); }
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); },
  draw(g, ctx){ const dt = 1/60;
    for(const p of pile) this.grape(g, p.x, p.y, 9, p.gold);
    for(const q of G){ if(q.st === 'splat'){ g.fillStyle = q.gold ? `rgba(240,200,60,${.6*(1 - q.t/.8)})` : `rgba(80,30,100,${.6*(1 - q.t/.8)})`; g.beginPath(); g.ellipse(q.x, 812, 16, 5, 0, 0, 7); g.fill(); continue; }
      const r = q.gold ? 15 : 13; if(q.gold){ g.save(); g.shadowColor = '#ffe27a'; g.shadowBlur = 18; } this.grape(g, q.x, q.y, r, q.gold); if(q.gold) g.restore();
      g.strokeStyle = '#4a5a20'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(q.x, q.y - r); g.lineTo(q.x + 3, q.y - r - 7); g.stroke(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🍇 ' + inKorb + '/' + TOTAL, '⭐ ' + pts, 846);
    if(!fin.on && phase === 'ready') hint(g, t('wein.hint'), tt, 500, 99);
    fin.draw(g, dt, 'rgba(50,30,20,', .18); } };
startCard(scene);
window.__wn = { get phase(){ return phase; }, get G(){ return G; }, get pts(){ return pts; }, get inKorb(){ return inKorb; } };
