// Neues Haustier: „Schnurr-Meter“ – das gedruckte Kätzchen sanft streicheln: über den Rücken vom Kopf zum Schwanz. Gegen den Strich mag es gar nicht! Wenn das Schnurr-Meter voll ist, ist das Kätzchen angekommen.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const BACK = { x0: 235, x1: 535, y0: 462, y1: 605 }, HEAD = { x: 178, y: 540, r: 62 };
let fx, fin, tt, phase, purr, held, lx, ly, time, hearts, grr, snd, zz;
const inBack = (x, y) => x > BACK.x0 && x < BACK.x1 && y > BACK.y0 && y < BACK.y1;
const scene = {
  title: t('kitten.title'), subtitle: t('kitten.sub'), emoji: '🐱', accent: '#ffc8d8', button: '#a85a7a', bg: '#3a2a34',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; purr = 0; held = false; time = 0; hearts = []; grr = 0; snd = 0; zz = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; held = true; lx = x; ly = y; if(phase === 'ready') phase = 'pet';
    if(Math.hypot(x - HEAD.x, y - HEAD.y) < HEAD.r){ purr = Math.min(100, purr + 3); hearts.push({ x, y, t: 0 }); ctx.tone(880, 0, .1, 'sine', .04); } },
  onDrag(x, y, ctx){ if(!held || phase !== 'pet') return; const dx = x - lx, dy = y - ly; lx = x; ly = y;
    if(inBack(x, y)){ if(dx > 2){ purr = Math.min(100, purr + dx*.045); if(Math.random() < .25) hearts.push({ x, y: y - 10, t: 0 }); }
      else if(dx < -6 && grr <= 0){ grr = 1; purr = Math.max(0, purr - 8); fx.pop(x, y - 50, t('kitten.grr'), '#ffd0c8', 28); ctx.tone(110, 0, .35, 'sawtooth', .04); } }
    else if(Math.hypot(x - HEAD.x, y - HEAD.y) < HEAD.r && Math.hypot(dx, dy) > 3){ purr = Math.min(100, purr + .4); if(Math.random() < .15) hearts.push({ x, y, t: 0 }); }
    if(purr >= 100) this.finish(ctx); },
  onRelease(){ held = false; },
  update(dt, ctx){ tt += dt; fx.update(dt); if(grr > 0) grr -= dt; if(phase === 'pet'){ time += dt; purr = Math.max(0, purr - dt*1.5); }
    snd -= dt; if(purr > 15 && phase !== 'end' && snd <= 0){ snd = .5; ctx.noise(0, .35, .02 + purr/2500, 120); }
    for(const h of hearts) h.t += dt; hearts = hearts.filter(h => h.t < 1.4); },
  finish(ctx){ phase = 'end'; held = false; const s = Math.round(time*10)/10, b = best('kitten', s, false);
    for(let i = 0; i < 12; i++) hearts.push({ x: 300 + (Math.random() - .5)*300, y: 540 + (Math.random() - .5)*100, t: -Math.random()*.6 });
    ctx.melody([['E5', .25], ['G5', .25], ['C6', .5], ['B5', .25], ['C6', .75]], 140, 'sine', .09);
    setTimeout(() => fin.start(ctx, greeting('kitten'), [t('kitten.line'), t('kitten.score', { s: s.toFixed(1) }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('kitten.best', { s: Number(b.best).toFixed(1) })], MEL.soft), 1500); },
  draw(g, ctx){ const dt = 1/60;
    for(const h of hearts){ if(h.t < 0) continue; g.save(); g.globalAlpha = 1 - h.t/1.4; g.font = `${18 + h.t*12}px sans-serif`; g.textAlign = 'center'; g.fillText('💗', h.x + Math.sin(h.t*5)*10, h.y - h.t*80); g.restore(); }
    if(purr > 20 && phase !== 'end'){ g.save(); g.globalAlpha = Math.min(1, (purr - 20)/40); g.font = 'italic bold 24px Georgia'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(120,60,90,.8)'; g.lineWidth = 4; g.textAlign = 'center';
      const j = Math.sin(tt*40)*purr/60; g.strokeText(t('kitten.schnurr'), 470 + j, 440); g.fillText(t('kitten.schnurr'), 470 + j, 440); g.restore(); }
    if(!fin.on){ g.save(); g.fillStyle = 'rgba(80,40,60,.5)'; g.beginPath(); g.roundRect(120, 300, 360, 22, 11); g.fill(); const gr = g.createLinearGradient(120, 0, 480, 0); gr.addColorStop(0, '#ffb3c8'); gr.addColorStop(1, '#ff5a8a'); g.fillStyle = gr;
      g.beginPath(); g.roundRect(123, 303, 354*purr/100, 16, 8); g.fill(); g.font = '20px sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('😺', 116, 311); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '💗 ' + Math.round(purr) + ' %', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('kitten.hint'), tt, 420, 99);
    fin.draw(g, dt, 'rgba(60,40,50,', .18); } };
startCard(scene);
window.__ki = { get phase(){ return phase; }, get purr(){ return purr; }, BACK };
