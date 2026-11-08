// Save the Date: „Abreißkalender“ – auf dem gedruckten Kalender liegen Blätter. Mit einem Wisch nach unten reißt man eines nach dem anderen ab, bis das große Datum erscheint.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, greeting, hint, MEL } from '../core/kit.js';
const Q = new URLSearchParams(location.search), DATUM = (Q.get('datum') || '').trim(), WO = (Q.get('wo') || '').trim(), P = { x: 150, y: 345, w: 300, h: 270 }, N = 6;
let fx, fin, tt, phase, left, flying, held, sy, sx;
const MON = () => t('savethedate.monate').split(',');
const scene = {
  title: t('savethedate.title'), subtitle: t('savethedate.sub'), emoji: '📅', accent: '#f3c8c8', button: '#a85a6a', bg: '#2e2224',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; left = N; flying = []; held = false; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; if(x > P.x && x < P.x + P.w && y > P.y - 40 && y < P.y + P.h + 40){ held = true; sy = y; sx = x; phase = 'tear'; } },
  onDrag(x, y, ctx){ if(!held || left <= 0) return; if(y - sy > 60){ held = false; left--; flying.push({ k: left, x: P.x, y: P.y, vx: (x - sx)*3 + (Math.random() - .5)*120, vy: 200, r: 0, vr: (Math.random() - .5)*4, t: 0 });
    ctx.noise(0, .18, .12, 2500); ctx.tone(600 + (N - left)*60, 0, .08, 'triangle', .05);
    if(left === 0){ fx.sparkle(P.x + P.w/2, P.y + P.h/2, 30); ctx.tone(784, .1, .3, 'triangle', .08); ctx.tone(1046, .3, .5, 'triangle', .08); phase = 'end'; setTimeout(() => this.finish(ctx), 2200); } } },
  onRelease(){ held = false; },
  update(dt){ tt += dt; fx.update(dt); for(const f of flying){ f.t += dt; f.vy += 700*dt; f.x += f.vx*dt; f.y += f.vy*dt; f.r += f.vr*dt; } flying = flying.filter(f => f.y < 1100); },
  finish(ctx){ const info = [DATUM && t('savethedate.datum', { w: DATUM }), WO && t('savethedate.wo', { w: WO })].filter(Boolean);
    fin.start(ctx, greeting('savethedate'), info.length ? info : [t('savethedate.line')], MEL.soft); },
  page(g, k, x, y, r){ g.save(); g.translate(x + P.w/2, y + P.h/2); g.rotate(r); g.translate(-P.w/2, -P.h/2);
    g.fillStyle = '#fbf5ec'; g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 8; g.fillRect(0, 0, P.w, P.h); g.shadowBlur = 0;
    g.fillStyle = '#c8707a'; g.fillRect(0, 0, P.w, 36); const m = MON(); g.fillStyle = '#fff'; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(m[(k*5 + 3) % 12], P.w/2, 18);
    g.fillStyle = '#6a3a40'; g.font = 'bold 120px Georgia'; g.fillText(String((k*7 + 5) % 28 + 1), P.w/2, P.h/2 + 30); g.fillStyle = 'rgba(120,60,70,.5)'; g.font = 'italic 18px Georgia'; g.fillText(t('savethedate.nochnicht'), P.w/2, P.h - 24); g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    if(left === 0){ g.save(); g.fillStyle = '#fbf5ec'; g.fillRect(P.x, P.y, P.w, P.h); g.fillStyle = '#c8707a'; g.fillRect(P.x, P.y, P.w, 36); g.fillStyle = '#fff'; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♥', P.x + P.w/2, P.y + 18);
      g.fillStyle = '#8a3a48'; g.font = 'italic bold 40px Georgia'; const d = DATUM || t('savethedate.bald'); g.fillText(d, P.x + P.w/2, P.y + P.h/2, P.w - 20); g.font = 'italic 20px Georgia'; g.fillText(t('savethedate.vormerken'), P.x + P.w/2, P.y + P.h - 40); g.restore(); }
    else for(let k = 0; k < left; k++) if(k === left - 1) this.page(g, k, P.x, P.y + (held ? 3 : 0), 0);
    for(const f of flying) this.page(g, f.k, f.x, f.y, f.r);
    fx.draw(g);
    if(!fin.on && phase !== 'end'){ g.save(); g.fillStyle = 'rgba(100,50,60,.6)'; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.fillText('📄 × ' + left, 300, 680); g.restore(); }
    if(!fin.on && phase === 'ready') hint(g, t('savethedate.hint'), tt, 730, 99);
    fin.draw(g, dt, 'rgba(60,35,40,', .25); } };
startCard(scene);
window.__sd = { get phase(){ return phase; }, get left(){ return left; }, P };
