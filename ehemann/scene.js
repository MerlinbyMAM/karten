// Ehemann: „Volltreffer ins Herz“. Gedruckte Dartscheibe mit Herz in der Mitte, gedruckte Pfeile auf dem Tisch.
// Pfeil per Wisch nach oben werfen – ins Herz gibt 50 Punkte. 5 Pfeile, Rekord.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const C = { x: 300, y: 405 }, RINGS = [[42, 50], [75, 25], [112, 15], [148, 5]], DARTS = 5;
let stuck, fly, thrown, pts, fx, fin, tt, over, track, held;
function dart(g, x, y, s, rot){ g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = '#c0392b'; g.strokeStyle = '#7a1a10'; g.lineWidth = 1; for(const d of [-1, 1]){ g.beginPath(); g.moveTo(0, 28); g.lineTo(d*13, 46); g.lineTo(d*3, 50); g.lineTo(0, 36); g.closePath(); g.fill(); g.stroke(); }
  g.fillStyle = '#d9d9e0'; g.fillRect(-3, 6, 6, 24); g.fillStyle = '#9a9aa8'; for(let k = 0; k < 4; k++) g.fillRect(-3, 9 + k*5, 6, 1.5);
  g.strokeStyle = '#ececf2'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 6); g.lineTo(0, -12); g.stroke(); g.restore(); }
const scene = {
  title: t('ehemann.title'), subtitle: t('ehemann.sub'), emoji: '🎯', accent: '#ffd36a', button: '#8a2a1a', bg: '#4a1a10',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ stuck = []; fly = null; thrown = 0; pts = 0; over = false; tt = 0; held = false; fx.clear(); fin.stop(); },
  onTap(x, y){ if(over || fly || thrown >= DARTS) return; if(y > 500){ held = true; track = [[x, y, performance.now()]]; } },
  onDrag(x, y){ if(held){ track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); } },
  onRelease(ctx){ if(!held) return; held = false; const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], dtm = Math.max(16, b[2] - a[2]);
    const vx = (b[0] - a[0])/dtm*1000, vy = (b[1] - a[1])/dtm*1000; if(vy > -300) return;
    const tx = b[0] + vx*.1 + (Math.random() - .5)*16, ty = b[1] + vy*.24 + (Math.random() - .5)*16;
    fly = { x0: b[0], y0: b[1], tx, ty, t: 0 }; thrown++; ctx.tone(900, 0, .08, 'sine', .03); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(fly){ fly.t += dt; if(fly.t >= .32){ const d = Math.hypot(fly.tx - C.x, fly.ty - C.y); let p = 0; for(const [r, v] of RINGS){ if(d < r){ p = v; break; } }
        if(p){ stuck.push({ x: fly.tx, y: fly.ty, r: (Math.random() - .5)*.3 }); pts += p; ctx.tone(180, 0, .06, 'square', .08); ctx.tone(p === 50 ? 1046 : 660, .05, .2, 'triangle', .08);
          fx.pop(fly.tx, fly.ty - 40, p === 50 ? t('ehemann.herz') : '+' + p, p === 50 ? '#ffd0dc' : '#ffffff', p === 50 ? 34 : 28); if(p === 50) fx.burst(C.x, C.y, 30, ['#ff4a6a', '#ffd0dc', '#ffffff'], 300, 200, 6); }
        else { fx.pop(fly.tx, fly.ty - 30, t('ehemann.wand'), '#ffe0e0', 24); ctx.tone(140, 0, .15, 'sine', .06); }
        fly = null; if(thrown >= DARTS) setTimeout(() => this.finish(ctx), 900); } } },
  finish(ctx){ if(over) return; over = true; const b = best('ehemann', pts, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['A5', .25], ['C6', .75]], 200, 'triangle', .1);
    fin.start(ctx, greeting('ehemann'), [t('ehemann.line'), t('ehemann.score', { n: pts }) + (b.isNew && pts ? '  ★' : '') + '  ·  ' + t('ehemann.best', { n: b.best })], MEL.birthday); },
  draw(g, ctx){ const dt = 1/60;
    for(const s of stuck) dart(g, s.x, s.y, .7, s.r);
    if(fly){ const u = fly.t/.32, x = fly.x0 + (fly.tx - fly.x0)*u, y = fly.y0 + (fly.ty - fly.y0)*u - Math.sin(u*Math.PI)*40; dart(g, x, y, 1.1 - .4*u, Math.atan2(fly.tx - fly.x0, -(fly.ty - fly.y0))*.6); }
    if(!over && !fly && thrown < DARTS){ const k = Math.sin(tt*3)*4; dart(g, 525, 690 + k, 1.2, 0); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🎯 ' + pts, '🗡️ ' + (DARTS - thrown), 846);
    if(!fin.on && thrown === 0) hint(g, t('ehemann.hint'), tt, 610, 99);
    fin.draw(g, dt, 'rgba(50,15,10,', .22); } };
startCard(scene);
window.__em = { C, get thrown(){ return thrown; }, get pts(){ return pts; }, get flying(){ return !!fly; } };
