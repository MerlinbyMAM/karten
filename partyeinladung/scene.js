// Party-Einladung: „Korken knallen!“ Die gedruckte Sektflasche kräftig schütteln (schnell hoch und runter wischen), bis der Druck reicht – dann knallt der Korken und die Einladung erscheint mit Datum und Ort.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const C = { x: 300, y: 322 }, Q = new URLSearchParams(location.search), WANN = (Q.get('wann') || '').trim(), WO = (Q.get('wo') || '').trim();
let fx, fin, tt, phase, pr, held, ly, ldir, time, cork, foam, shake;
const scene = {
  title: t('partyeinladung.title'), subtitle: t('partyeinladung.sub'), emoji: '🍾', accent: '#ffd98a', button: '#2a2a6a', bg: '#141428',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; pr = 0; held = false; ldir = 0; time = 0; cork = null; foam = []; shake = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end' || phase === 'pop') return; held = true; ly = y; if(phase === 'ready') phase = 'shake'; },
  onDrag(x, y, ctx){ if(!held || phase !== 'shake') return; const dy = y - ly; if(Math.abs(dy) < 4) return; const d = Math.sign(dy);
    if(d !== ldir && ldir !== 0){ pr = Math.min(100, pr + 4.5); shake = .15; ctx.noise(0, .05, .05, 3000); if(pr >= 100) this.pop(ctx); } ldir = d; ly = y; },
  onRelease(){ held = false; },
  pop(ctx){ phase = 'pop'; held = false; cork = { x: C.x, y: C.y, vx: (Math.random() - .5)*200, vy: -1100, r: 0 };
    ctx.noise(0, .25, .4, 600); ctx.tone(180, 0, .12, 'square', .08); fx.burst(C.x, C.y, 50, ['#ffd34d', '#ffffff', '#c0c0ff', '#ff7aa8', '#7ad3ff'], 420, 300, 6); fx.shake(10);
    setTimeout(() => this.finish(ctx), 1600); },
  update(dt, ctx){ tt += dt; fx.update(dt); if(shake > 0) shake -= dt;
    if(phase === 'shake'){ time += dt; pr = Math.max(0, pr - dt*4); }
    if(cork){ cork.vy += 900*dt; cork.x += cork.vx*dt; cork.y += cork.vy*dt; cork.r += dt*14; }
    if(phase === 'pop' || phase === 'end'){ for(let i = 0; i < 3; i++) foam.push({ x: C.x, y: C.y, vx: (Math.random() - .5)*120, vy: -300 - Math.random()*250, t: 0 }); }
    for(const f of foam){ f.t += dt; f.vy += 700*dt; f.x += f.vx*dt; f.y += f.vy*dt; } foam = foam.filter(f => f.t < 1.2); },
  finish(ctx){ phase = 'end'; const info = [WANN && t('partyeinladung.wann', { w: WANN }), WO && t('partyeinladung.wo', { w: WO })].filter(Boolean);
    fin.start(ctx, greeting('partyeinladung'), info.length ? info : [t('partyeinladung.line')], MEL.fanfare); },
  draw(g, ctx){ const dt = 1/60;
    for(const f of foam){ g.fillStyle = `rgba(255,250,235,${.8*(1 - f.t/1.2)})`; g.beginPath(); g.arc(f.x, f.y, 4 + f.t*6, 0, 7); g.fill(); }
    if(!cork){ const j = shake > 0 ? (Math.random() - .5)*4 : 0; g.save(); g.translate(C.x + j, C.y - 6); g.fillStyle = '#c8a070'; g.beginPath(); g.roundRect(-11, -18, 22, 22, 6); g.fill(); g.strokeStyle = '#8a6a40'; g.lineWidth = 1.5; g.stroke(); g.restore(); }
    else if(cork.y < 1000){ g.save(); g.translate(cork.x, cork.y); g.rotate(cork.r); g.fillStyle = '#c8a070'; g.beginPath(); g.roundRect(-11, -11, 22, 22, 6); g.fill(); g.restore(); }
    if(phase === 'shake' || phase === 'ready'){ const X = 470, Y0 = 400, H = 300; g.save(); g.fillStyle = 'rgba(10,10,30,.55)'; g.beginPath(); g.roundRect(X - 14, Y0 - 14, 28, H + 28, 14); g.fill();
      const gr = g.createLinearGradient(0, Y0 + H, 0, Y0); gr.addColorStop(0, '#ffd34d'); gr.addColorStop(1, '#ff5a3a'); g.fillStyle = gr; g.beginPath(); g.roundRect(X - 8, Y0 + H*(1 - pr/100), 16, H*pr/100 + 1, 8); g.fill();
      g.font = '22px sans-serif'; g.textAlign = 'center'; g.fillText('💥', X, Y0 - 30); g.restore(); }
    fx.draw(g);
    if(!fin.on && phase !== 'end') hud2(g, '🍾 ' + Math.round(pr) + ' %', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('partyeinladung.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(15,15,40,', .25); } };
startCard(scene);
window.__pa = { get phase(){ return phase; }, get pr(){ return pr; } };
