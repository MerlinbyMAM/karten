// Danke Hochzeit: „Seifenblasen“ – wie auf der Hochzeit steigen Seifenblasen auf. Antippen lässt sie mit einem kleinen Herz platzen, goldene zählen dreifach. 30 Sekunden.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const DUR = 30;
let fx, fin, tt, phase, bub, nextT, left, pts, n, hearts;
const scene = {
  title: t('dankehochzeit.title'), subtitle: t('dankehochzeit.sub'), emoji: '🫧', accent: '#c8dcff', button: '#5a7ab0', bg: '#2a2e40',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; bub = []; nextT = 0; left = DUR; pts = 0; n = 0; hearts = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; return; } if(phase !== 'play') return; let bi = -1, bd = 1e9; bub.forEach((b, i) => { const d = Math.hypot(b.x - x, b.y - y); if(d < b.r + 14 && d < bd){ bd = d; bi = i; } }); if(bi < 0) return;
    const b = bub.splice(bi, 1)[0], p = b.gold ? 3 : 1; pts += p; n++; hearts.push({ x: b.x, y: b.y, t: 0, gold: b.gold }); fx.burst(b.x, b.y, 10, b.gold ? ['#ffe27a', '#fff6c0'] : ['#ffffff', '#cfe4ff', '#ffd0e0'], 150, 50, 3);
    ctx.tone(b.gold ? 1318 : 880 + Math.random()*400, 0, .08, 'sine', .06); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play'){ left -= dt; if(left <= 0){ left = 0; this.finish(ctx); }
      nextT -= dt; if(nextT <= 0){ bub.push({ x: 60 + Math.random()*480, y: 920, r: 18 + Math.random()*26, v: 60 + Math.random()*70 + (DUR - left)*2, ph: Math.random()*6, gold: Math.random() < .1 }); nextT = .35 + Math.random()*.35; } }
    for(const b of bub){ b.y -= b.v*dt; b.x += Math.sin(tt*1.5 + b.ph)*25*dt; } bub = bub.filter(b => b.y > 200);
    for(const h of hearts) h.t += dt; hearts = hearts.filter(h => h.t < 1.2); },
  finish(ctx){ phase = 'end'; const b = best('dankehochzeit', pts, true);
    setTimeout(() => fin.start(ctx, greeting('dankehochzeit'), [t('dankehochzeit.line'), t('dankehochzeit.score', { n: pts }) + (b.isNew && pts ? '  ★' : '') + '  ·  ' + t('dankehochzeit.best', { n: b.best })], MEL.soft), 300); },
  draw(g, ctx){ const dt = 1/60;
    for(const b of bub){ g.save(); const gr = g.createRadialGradient(b.x - b.r*.3, b.y - b.r*.3, b.r*.1, b.x, b.y, b.r); if(b.gold){ gr.addColorStop(0, 'rgba(255,250,220,.6)'); gr.addColorStop(.8, 'rgba(255,215,90,.25)'); gr.addColorStop(1, 'rgba(255,200,60,.8)'); } else { gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(.7, 'rgba(190,215,255,.25)'); gr.addColorStop(.92, `hsla(${(tt*60 + b.ph*60) % 360},80%,75%,.55)`); gr.addColorStop(1, 'rgba(255,255,255,.7)'); }
      g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(b.x - b.r*.4, b.y - b.r*.45, b.r*.22, b.r*.12, -.6, 0, 7); g.fill(); g.restore(); }
    for(const h of hearts){ g.save(); g.globalAlpha = 1 - h.t/1.2; g.font = `${22 + h.t*14}px sans-serif`; g.textAlign = 'center'; g.fillText(h.gold ? '💛' : '🤍', h.x, h.y - h.t*60); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🫧 ' + pts, '⏱ ' + Math.ceil(left) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('dankehochzeit.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(40,45,70,', .2); } };
startCard(scene);
window.__dh = { get phase(){ return phase; }, get bub(){ return bub; }, get pts(){ return pts; } };
