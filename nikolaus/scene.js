// Nikolaus: „Stiefel füllen“ – Nüsse, Mandarinen, Schokolade und Plätzchen fallen vom Himmel. Mit dem Finger in den gedruckten Stiefel ziehen – aber bloß keine Rute hinein! 40 Sekunden.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const B = { x: 256, y: 482, w: 70 }, GOOD = ['🍊', '🥜', '🍫', '🍪', '🍎'], DUR = 40;
let fx, fin, tt, phase, it, nextT, left, pts, n, held, inBoot;
const scene = {
  title: t('nikolaus.title'), subtitle: t('nikolaus.sub'), emoji: '🥾', accent: '#ffd98a', button: '#a01a1a', bg: '#1e1a2a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; it = []; nextT = 0; left = DUR; pts = 0; n = 0; held = null; inBoot = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; return; } if(phase !== 'play') return; let bi = null, bd = 60; for(const o of it){ const d = Math.hypot(o.x - x, o.y - y); if(o.st === 'fall' && d < bd){ bd = d; bi = o; } } if(bi){ held = bi; bi.st = 'held'; bi.dx = bi.x - x; bi.dy = bi.y - y; ctx.tone(660, 0, .05, 'triangle', .04); } },
  onDrag(x, y){ if(held){ held.x = x + held.dx; held.y = y + held.dy; } },
  onRelease(ctx){ if(!held) return; const o = held; held = null;
    if(Math.abs(o.x - B.x) < B.w && o.y > B.y - 90 && o.y < B.y + 50){ o.st = 'drop'; o.t = 0;
      if(o.rute){ pts = Math.max(0, pts - 3); fx.pop(B.x, B.y - 90, t('nikolaus.rute'), '#ffb0a0', 30); fx.shake(6); ctx.tone(160, 0, .3, 'sawtooth', .05); }
      else { const p = o.gold ? 3 : 1; pts += p; n++; inBoot.push(o.e); fx.pop(B.x, B.y - 90, '+' + p, o.gold ? '#ffe27a' : '#ffffff', 30); fx.sparkle(B.x, B.y - 20, 8); ctx.tone(o.gold ? 1046 : 784, 0, .1, 'triangle', .06); } }
    else o.st = 'fall'; },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play'){ left -= dt; if(left <= 0){ left = 0; this.finish(ctx); return; }
      nextT -= dt; if(nextT <= 0){ const r = Math.random() < .2, gold = !r && Math.random() < .1; it.push({ x: 60 + Math.random()*480, y: 270, vy: 50 + Math.random()*40 + (DUR - left)*2, e: r ? '' : (gold ? '⭐' : GOOD[Math.floor(Math.random()*GOOD.length)]), rute: r, gold, st: 'fall', r: Math.random()*6, t: 0 }); nextT = .55 + Math.random()*.5 - (DUR - left)*.006; }
      for(const o of it){ if(o.st === 'fall'){ o.y += o.vy*dt; o.r += dt; if(o.y > 920) o.st = 'gone'; } else if(o.st === 'drop'){ o.t += dt; o.y += 200*dt; if(o.t > .3) o.st = 'gone'; } }
      it = it.filter(o => o.st !== 'gone'); } },
  finish(ctx){ phase = 'end'; held = null; const b = best('nikolaus', pts, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 160, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('nikolaus'), [t('nikolaus.line'), t('nikolaus.score', { n: pts }) + (b.isNew && pts ? '  ★' : '') + '  ·  ' + t('nikolaus.best', { n: b.best })], MEL.birthday), 400); },
  rute(g, x, y, r){ g.save(); g.translate(x, y); g.rotate(r*.3); g.strokeStyle = '#5a3a1a'; g.lineWidth = 3; for(let i = -3; i <= 3; i++){ g.beginPath(); g.moveTo(0, 26); g.quadraticCurveTo(i*4, 0, i*8, -30); g.stroke(); } g.fillStyle = '#c02a2a'; g.fillRect(-8, 14, 16, 8); g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    inBoot.slice(-5).forEach((e, i) => { g.font = '34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, B.x - 40 + i*20, B.y - 6 - (i % 2)*8); });
    if(phase === 'play'){ g.save(); g.strokeStyle = `rgba(255,240,180,${.35 + .25*Math.sin(tt*4)})`; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.ellipse(B.x, B.y, B.w, 18, 0, 0, 7); g.stroke(); g.restore(); }
    for(const o of it){ g.save(); g.globalAlpha = o.st === 'drop' ? 1 - o.t/.3 : 1;
      if(o.rute) this.rute(g, o.x, o.y, o.r); else { if(o.gold){ g.shadowColor = '#ffe27a'; g.shadowBlur = 16; } g.font = (o.st === 'held' ? 52 : 44) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.e, o.x, o.y); }
      g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🥾 ' + pts, '⏱ ' + Math.ceil(left) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('nikolaus.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(30,20,40,', .18); } };
startCard(scene);
window.__ni = { get phase(){ return phase; }, get it(){ return it; }, get pts(){ return pts; }, B };
