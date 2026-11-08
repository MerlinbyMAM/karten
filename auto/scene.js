// Auto: „Lichter aus!“ Wie beim Grand-Prix-Start gehen fünf rote Lampen an – sobald sie ausgehen, tippen! Die gedruckten Räder drehen durch. Drei Starts, die beste Reaktionszeit zählt.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL, cardImg } from '../core/kit.js';
const WH = [[140, 598, 46], [470, 598, 46]], LX = 300, LY = 395;
let fx, fin, tt, phase, lit, tl, wait, react, tries, bestR, spin, rot, streaks, smoke, results;
const scene = {
  title: t('auto.title'), subtitle: t('auto.sub'), emoji: '🏎️', accent: '#ff6a5a', button: '#b0201a', bg: '#2a2a30',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; lit = 0; tl = 0; tries = 0; bestR = 0; spin = 0; rot = 0; streaks = []; smoke = []; results = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(phase === 'ready' || phase === 'show'){ if(phase === 'show' && tl < .6) return; if(tries >= 3) return; phase = 'lights'; lit = 0; tl = 0; ctx.tone(440, 0, .12, 'square', .05); return; }
    if(phase === 'lights' || phase === 'hold'){ phase = 'show'; tl = 0; results.push(null); tries++; fx.pop(300, 470, t('auto.frueh'), '#ffd0c8', 32); ctx.tone(180, 0, .35, 'sawtooth', .06); if(tries >= 3) setTimeout(() => this.finish(ctx), 1500); return; }
    if(phase === 'go'){ react = tl; phase = 'show'; tl = 0; tries++; results.push(react); if(!bestR || react < bestR) bestR = react; spin = 1;
      for(const w of WH) for(let k = 0; k < 6; k++) smoke.push({ x: w[0] - 40, y: w[1] + 30, vx: -60 - Math.random()*120, vy: -20 - Math.random()*40, t: 0 });
      fx.pop(300, 470, Math.round(react*1000) + ' ms', react < .25 ? '#b9ff9a' : '#ffffff', 40); ctx.noise(0, .9, .22, 500); ctx.tone(120, 0, .6, 'sawtooth', .05);
      if(tries >= 3) setTimeout(() => this.finish(ctx), 1700); } },
  update(dt, ctx){ tt += dt; tl += dt; fx.update(dt);
    if(phase === 'lights'){ const n = Math.min(5, Math.floor(tl/.8) + 1); if(n > lit){ lit = n; ctx.tone(330, 0, .12, 'square', .05); } if(tl > 4){ phase = 'hold'; tl = 0; wait = .4 + Math.random()*2.2; } }
    if(phase === 'hold' && tl > wait){ phase = 'go'; tl = 0; lit = 0; }
    spin = Math.max(0, spin - dt*.45); rot += dt*spin*40;
    if(spin > .2 && Math.random() < spin) streaks.push({ y: 470 + Math.random()*200, x: 620, l: 60 + Math.random()*140 });
    for(const s of streaks) s.x -= 1600*dt; streaks = streaks.filter(s => s.x + s.l > -20);
    for(const s of smoke){ s.t += dt; s.x += s.vx*dt; s.y += s.vy*dt; } smoke = smoke.filter(s => s.t < 1.4); },
  finish(ctx){ if(phase === 'end') return; phase = 'end'; const ms = bestR ? Math.round(bestR*1000) : 0, b = ms ? best('auto', ms, false) : { isNew: false, best: '–' };
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 180, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('auto'), [t('auto.line'), (ms ? t('auto.score', { n: ms }) : t('auto.keine')) + (b.isNew ? '  ★' : '') + '  ·  ' + t('auto.best', { n: b.best })], MEL.birthday), 300); },
  draw(g, ctx){ const dt = 1/60;
    for(const s of streaks){ g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + s.l, s.y); g.stroke(); }
    if(spin > 0 && cardImg.complete && cardImg.naturalWidth){ const k = cardImg.naturalWidth/600;
      for(const w of WH){ g.save(); g.beginPath(); g.arc(w[0], w[1], w[2], 0, 7); g.clip(); g.translate(w[0], w[1]); g.rotate(rot); g.drawImage(cardImg, (w[0] - w[2])*k, (w[1] - w[2])*k, w[2]*2*k, w[2]*2*k, -w[2], -w[2], w[2]*2, w[2]*2); g.restore();
        g.save(); g.globalAlpha = Math.min(.5, spin*.6); g.strokeStyle = '#ddd'; g.lineWidth = 2; for(let a = 0; a < 3; a++){ g.beginPath(); g.arc(w[0], w[1], w[2]*(.45 + a*.18), rot*2 + a, rot*2 + a + 1.4); g.stroke(); } g.restore(); } }
    for(const s of smoke){ g.fillStyle = `rgba(230,230,230,${.45*(1 - s.t/1.4)})`; g.beginPath(); g.arc(s.x, s.y, 14 + s.t*40, 0, 7); g.fill(); }
    if(phase !== 'end' && !fin.on){ g.save(); g.fillStyle = 'rgba(20,20,24,.85)'; g.beginPath(); g.roundRect(LX - 170, LY - 34, 340, 68, 14); g.fill();
      for(let k = 0; k < 5; k++){ const x = LX - 132 + k*66, on = k < lit && (phase === 'lights' || phase === 'hold');
        g.fillStyle = on ? '#ff2a1a' : '#3a0a08'; if(on){ g.shadowColor = '#ff3a2a'; g.shadowBlur = 24; } g.beginPath(); g.arc(x, LY, 22, 0, 7); g.fill(); g.shadowBlur = 0; } g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🚦 ' + tries + '/3', '⚡ ' + (bestR ? Math.round(bestR*1000) + ' ms' : '–'), 846);
    if(!fin.on && (phase === 'ready' || (phase === 'show' && tries < 3 && tl > .6))) hint(g, t(tries ? 'auto.weiter' : 'auto.hint'), tt, 730, 99);
    if(!fin.on && (phase === 'lights' || phase === 'hold')) hint(g, t('auto.warte'), 1, 730, 99);
    fin.draw(g, dt, 'rgba(30,30,36,', .18); } };
startCard(scene);
window.__au = { get phase(){ return phase; }, get tries(){ return tries; }, get bestR(){ return bestR; } };
