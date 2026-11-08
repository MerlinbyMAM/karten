// Bier: „Frisch gezapft!“ Gedrückt halten zapft Bier in den gedruckten Krug, loslassen stoppt. Die Schaumkrone soll genau am Eichstrich sitzen. Drei Krüge – der Zapfhahn wird jedes Mal launischer.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const TAP = { x: 299, y: 516 }, TOP = 548, BOT = 708, L = 242, R = 368, LINE = 566;
let fx, fin, tt, phase, beer, foam, held, round, score, settle, bub, res, drink, flow;
const yb = () => BOT - beer, yf = () => BOT - beer - foam;
const scene = {
  title: t('bier.title'), subtitle: t('bier.sub'), emoji: '🍺', accent: '#ffd25a', button: '#7a4a14', bg: '#2e1e10',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; beer = 0; foam = 0; held = false; round = 0; score = 0; settle = 0; bub = []; res = []; drink = 0; flow = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready' || phase === 'next'){ phase = 'pour'; round++; beer = 0; foam = 0; } if(phase === 'pour'){ held = true; ctx.noise(0, .15, .08, 2500); } },
  onRelease(ctx){ if(!held) return; held = false; if(phase === 'pour' && beer + foam > 6){ phase = 'settle'; settle = 0; } },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'pour' && held){ const base = [70, 95, 105][round - 1] || 100; flow = base*(round === 3 ? (.5 + Math.abs(Math.sin(tt*5))*1.1) : 1)*(1 + Math.sin(tt*9)*.12);
      beer += flow*dt*.72; foam = Math.min(46, foam + flow*dt*.32);
      if(Math.random() < .5) bub.push({ x: L + 8 + Math.random()*(R - L - 16), y: BOT - 4, v: 30 + Math.random()*50 });
      if(Math.random() < .25) ctx.noise(0, .06, .03, 3000);
      if(yf() < TOP - 18){ phase = 'settle'; settle = 0; held = false; fx.burst(300, TOP, 14, ['#ffffff', '#fff6e0'], 140, 500, 5); fx.pop(300, 470, t('bier.ueber'), '#ffe0c0', 30); } }
    if(phase === 'settle'){ settle += dt; const k = Math.min(1, dt*2); const f2 = foam*(1 - .25*k*(settle < 1.1 ? 1 : 0)); beer += (foam - f2)*.5; foam = f2;
      if(settle > 1.3){ const d = Math.abs(yf() - LINE), p = Math.max(0, Math.round(100 - d*3.2)); score += p; res.push(p); phase = 'show'; settle = 0;
        fx.pop(300, 470, p >= 90 ? t('bier.perfekt', { p }) : p + ' %', p >= 90 ? '#b9ff9a' : '#ffffff', 38); ctx.tone(p >= 90 ? 880 : 520, 0, .14, 'triangle', .07); if(p >= 90) fx.sparkle(300, LINE, 18); } }
    if(phase === 'show'){ settle += dt; if(settle > 1.4){ phase = 'drink'; drink = 0; ctx.tone(392, 0, .1, 'sine', .05); } }
    if(phase === 'drink'){ drink += dt; const tot = beer + foam; const nt = Math.max(0, tot - dt*140); const r = tot ? nt/tot : 0; beer *= r; foam *= r; if(nt <= 0){ beer = foam = 0; if(round >= 3) this.finish(ctx); else phase = 'next'; } }
    for(const b of bub){ b.y -= b.v*dt; } bub = bub.filter(b => b.y > yb() + 4 && beer > 4); },
  finish(ctx){ phase = 'end'; const avg = Math.round(score/3), b = best('bier', avg, true);
    ctx.melody([['C5', .25], ['C5', .25], ['G5', .5], ['E5', .25], ['C6', .75]], 170, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('bier'), [t('bier.line'), t('bier.score', { p: avg }) + (b.isNew && avg ? '  ★' : '') + '  ·  ' + t('bier.best', { p: b.best })], MEL.birthday), 400); },
  draw(g, ctx){ const dt = 1/60;
    g.save(); g.beginPath(); g.moveTo(L, TOP); g.lineTo(R, TOP); g.lineTo(R - 3, BOT); g.lineTo(L + 3, BOT); g.closePath(); g.clip();
    if(beer > 0){ const gr = g.createLinearGradient(0, BOT, 0, yb()); gr.addColorStop(0, 'rgba(190,110,20,.92)'); gr.addColorStop(1, 'rgba(240,175,40,.88)'); g.fillStyle = gr; g.fillRect(L, yb(), R - L, beer);
      g.fillStyle = 'rgba(255,240,180,.7)'; for(const b of bub){ g.beginPath(); g.arc(b.x, b.y, 1.6, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(L + 8, yb(), 10, beer); }
    if(foam > 0){ g.fillStyle = '#fbf6ea'; g.fillRect(L, yf() + 4, R - L, foam); g.fillStyle = '#ffffff'; for(let x = L; x <= R; x += 13){ g.beginPath(); g.arc(x + 6, yf() + 5 + Math.sin(x*.7 + tt)*1.5, 8, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(220,200,160,.5)'; for(let k = 0; k < 10; k++){ g.beginPath(); g.arc(L + 10 + (k*37 % (R - L - 20)), yf() + 10 + (k*13 % Math.max(4, foam - 6)), 2, 0, 7); g.fill(); } }
    g.restore();
    if(held && phase === 'pour'){ g.fillStyle = 'rgba(235,170,40,.9)'; const w = 4 + flow/40; g.fillRect(TAP.x - w/2, TAP.y, w, Math.max(0, yf() - TAP.y + 4)); }
    if(phase !== 'end' && !fin.on){ g.save(); g.strokeStyle = 'rgba(40,20,0,.85)'; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(L - 4, LINE); g.lineTo(R + 4, LINE); g.stroke(); g.setLineDash([]);
      g.font = 'bold 18px Georgia'; g.textAlign = 'right'; g.fillStyle = '#fff2c8'; g.strokeStyle = 'rgba(40,20,0,.8)'; g.lineWidth = 4; g.strokeText('0,5 l', L - 10, LINE + 6); g.fillText('0,5 l', L - 10, LINE + 6); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🍺 ' + round + '/3', '🎯 ' + (res.length ? res[res.length - 1] + ' %' : '–'), 846);
    if(!fin.on && (phase === 'ready' || phase === 'next')) hint(g, t(phase === 'ready' ? 'bier.hint' : 'bier.weiter'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(40,25,10,', .18); } };
startCard(scene);
window.__bi = { get phase(){ return phase; }, get yf(){ return yf(); }, get round(){ return round; }, get score(){ return score; }, LINE };
