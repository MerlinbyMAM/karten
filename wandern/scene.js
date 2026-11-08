// Wandern: „Auf zum Gipfel!“ Mit dem Finger dem gedruckten Wanderweg in Serpentinen bis zum Gipfelkreuz folgen – wer vom Weg abkommt, muss zurück zum Wanderer. Auf Zeit.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const PATH = [[70, 742], [130, 722], [185, 702], [240, 684], [262, 668], [225, 650], [195, 636], [230, 620], [268, 604], [245, 585], [210, 566], [240, 548], [280, 530], [275, 512], [240, 498], [262, 482], [295, 468], [268, 452], [262, 438], [285, 422], [292, 404], [300, 385], [302, 362], [300, 335]];
const TOL = 42;
let fx, fin, tt, phase, prog, held, time, offT, trail;
function proj(x, y){ let best = { d: 1e9, s: 0 }; for(let i = 0; i < PATH.length - 1; i++){ const [ax, ay] = PATH[i], [bx, by] = PATH[i + 1], dx = bx - ax, dy = by - ay, L = dx*dx + dy*dy; let u = ((x - ax)*dx + (y - ay)*dy)/L; u = Math.max(0, Math.min(1, u)); const d = Math.hypot(ax + dx*u - x, ay + dy*u - y); if(d < best.d) best = { d, s: i + u }; } return best; }
function at(s){ const i = Math.min(PATH.length - 2, Math.floor(s)), u = s - i; return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0])*u, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1])*u]; }
const scene = {
  title: t('wandern.title'), subtitle: t('wandern.sub'), emoji: '🥾', accent: '#bfe98a', button: '#2f5a2a', bg: '#22301e',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; prog = 0; held = false; time = 0; offT = 0; trail = []; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; const h = at(prog); if(Math.hypot(x - h[0], y - h[1]) < 70){ held = true; if(phase === 'ready') phase = 'walk'; ctx.tone(523, 0, .08, 'triangle', .05); } },
  onDrag(x, y, ctx){ if(!held || phase !== 'walk') return; const p = proj(x, y);
    if(p.d > TOL || p.s > prog + 1.6){ held = false; offT = 1.2; fx.pop(x, y - 40, t('wandern.weg'), '#ffd0c8', 26); ctx.tone(160, 0, .15, 'sine', .05); return; }
    if(p.s > prog){ const old = Math.floor(prog); prog = p.s; if(Math.floor(prog) > old){ ctx.tone(392 + Math.floor(prog)*18, 0, .06, 'triangle', .04); const q = at(prog); trail.push(q); } }
    if(prog >= PATH.length - 1.15) this.finish(ctx); },
  onRelease(){ held = false; },
  update(dt, ctx){ tt += dt; fx.update(dt); if(phase === 'walk') time += dt; if(offT > 0) offT -= dt; },
  finish(ctx){ phase = 'end'; held = false; prog = PATH.length - 1; const s = Math.round(time*10)/10, b = best('wandern', s, false); const top = PATH[PATH.length - 1];
    fx.burst(top[0], top[1] - 20, 30, ['#ffd34d', '#ffffff', '#9cf27a'], 260, 200, 5); fx.pop(top[0], top[1] - 60, t('wandern.gipfel'), '#fff6c2', 34);
    ctx.melody([['G4', .25], ['C5', .25], ['E5', .25], ['G5', .5], ['E5', .25], ['G5', 1]], 150, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('wandern'), [t('wandern.line'), t('wandern.score', { s: s.toFixed(1) }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('wandern.best', { s: Number(b.best).toFixed(1) })], MEL.birthday), 1300); },
  draw(g, ctx){ const dt = 1/60;
    if(prog > 0){ g.save(); g.strokeStyle = 'rgba(255,90,60,.85)'; g.lineWidth = 6; g.lineCap = g.lineJoin = 'round'; g.setLineDash([2, 10]); g.beginPath(); g.moveTo(PATH[0][0], PATH[0][1]); for(let i = 1; i <= Math.floor(prog); i++) g.lineTo(PATH[i][0], PATH[i][1]); const h = at(prog); g.lineTo(h[0], h[1]); g.stroke(); g.restore(); }
    if(phase !== 'end'){ const nx = at(Math.min(PATH.length - 1, prog + 1.3)); g.save(); g.globalAlpha = .4 + .3*Math.sin(tt*5); g.fillStyle = '#fff'; g.beginPath(); g.arc(nx[0], nx[1], 6, 0, 7); g.fill(); g.restore(); }
    const h = at(prog); g.save(); const pul = held ? 1 : .6 + .4*Math.sin(tt*4);
    g.fillStyle = `rgba(255,255,255,${.35*pul})`; g.beginPath(); g.arc(h[0], h[1], 26, 0, 7); g.fill(); g.font = '34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🚶', h[0], h[1] - 6); g.restore();
    if(offT > 0){ g.save(); g.globalAlpha = Math.min(1, offT); g.strokeStyle = '#ff7a6a'; g.lineWidth = 3; g.beginPath(); g.arc(h[0], h[1], 40 + (1.2 - offT)*30, 0, 7); g.stroke(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '⛰️ ' + Math.round(prog/(PATH.length - 1)*100) + ' %', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('wandern.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(30,48,30,', .18); } };
startCard(scene);
window.__wa = { get phase(){ return phase; }, get prog(){ return prog; }, PATH };
