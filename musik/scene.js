// Musik: „Spiel mir das Lied!“ Noten schweben auf die gedruckten Klaviertasten herab – im richtigen Moment antippen, und „Happy Birthday“ erklingt. Ein Rhythmusspiel.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const LANES = [65, 138, 212, 302, 392, 465, 535], HY = 705, Y0 = 290, FALL = 1.7, BPM = 96;
const LM = { G4: 0, A4: 1, B4: 2, C5: 3, D5: 4, E5: 5, F5: 6, G5: 6 };
const SONG = [['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2], ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2], ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]];
let fx, fin, tt, phase, N, st, hits, perf, combo, press, nf;
const scene = {
  title: t('musik.title'), subtitle: t('musik.sub'), emoji: '🎹', accent: '#d9b8ff', button: '#4a2a6a', bg: '#241a30',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ let b = 0; N = SONG.map(([n, d]) => { const o = { n, lane: LM[n], at: b*60/BPM + 2.2, st: 'come' }; b += d; return o; }); phase = 'ready'; st = 0; hits = 0; perf = 0; combo = 0; press = LANES.map(() => 0); tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ nf = nf || ctx.noteFreq;
    if(phase === 'ready'){ phase = 'play'; st = 0; ctx.tone(523, 0, .1, 'sine', .05); ctx.tone(523, .62, .1, 'sine', .05); ctx.tone(784, 1.25, .1, 'sine', .06); return; }
    if(phase !== 'play' || y < 380) return;
    let lane = 0, bd = 999; LANES.forEach((lx, k) => { if(Math.abs(lx - x) < bd){ bd = Math.abs(lx - x); lane = k; } }); press[lane] = .25;
    let bi = -1, be = .22; N.forEach((o, k) => { if(o.st === 'come' && o.lane === lane && Math.abs(o.at - st) < be){ be = Math.abs(o.at - st); bi = k; } });
    if(bi < 0){ ctx.tone(110, 0, .08, 'sine', .04); combo = 0; return; }
    const o = N[bi]; o.st = 'hit'; o.ht = 0; hits++; combo++; const good = be < .09; if(good) perf++;
    const f = nf ? nf(o.n) : 440; ctx.tone(f, 0, .5, 'triangle', .14); ctx.tone(f*2, 0, .3, 'sine', .04);
    fx.pop(LANES[lane], HY - 70, good ? t('musik.perfekt') : t('musik.gut'), good ? '#ffe9a0' : '#e8d8ff', good ? 26 : 22); fx.sparkle(LANES[lane], HY - 10, good ? 12 : 6); },
  update(dt, ctx){ tt += dt; fx.update(dt); for(let k = 0; k < 7; k++) press[k] = Math.max(0, press[k] - dt);
    if(phase === 'play'){ st += dt;
      for(const o of N){ if(o.st === 'come' && st - o.at > .22){ o.st = 'miss'; o.ht = 0; combo = 0; } if(o.st !== 'come') o.ht += dt; }
      if(st > N[N.length - 1].at + 1.2) this.finish(ctx); } },
  finish(ctx){ phase = 'end'; const p = Math.round(hits/N.length*100), b = best('musik', p, true);
    setTimeout(() => fin.start(ctx, greeting('musik'), [t('musik.line'), t('musik.score', { n: hits, m: N.length, p: perf }) + (b.isNew && hits ? '  ★' : '') + '  ·  ' + t('musik.best', { p: b.best })], MEL.birthday), 500); },
  draw(g, ctx){ const dt = 1/60;
    press.forEach((v, k) => { if(v > 0){ g.fillStyle = `rgba(255,236,170,${v*2})`; g.fillRect(LANES[k] - 30, 650, 60, 112); } });
    if(phase === 'play') for(const o of N){ if(o.st === 'come' || (o.st !== 'come' && o.ht < .4)){
      const u = (st - (o.at - FALL))/FALL; if(u < 0) continue; const x = LANES[o.lane], y = o.st === 'come' ? Y0 + (HY - Y0)*u : HY - (o.st === 'hit' ? o.ht*120 : -o.ht*40);
      const a = o.st === 'come' ? Math.min(1, u*4) : 1 - o.ht/.4; g.save(); g.globalAlpha = a; const col = o.st === 'miss' ? '#8a8a8a' : (o.lane % 2 ? '#c89a3a' : '#6a3a9a');
      g.shadowColor = o.st === 'hit' ? '#ffe9a0' : 'rgba(0,0,0,.35)'; g.shadowBlur = o.st === 'hit' ? 20 : 6; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 17, 13, -.35, 0, 7); g.fill();
      g.shadowBlur = 0; g.strokeStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 14, y - 4); g.lineTo(x + 14, y - 44); g.quadraticCurveTo(x + 24, y - 34, x + 30, y - 30); g.stroke(); g.restore(); } }
    if(phase === 'play'){ g.save(); g.strokeStyle = 'rgba(255,240,200,.55)'; g.lineWidth = 2; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(20, HY); g.lineTo(580, HY); g.stroke(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🎵 ' + hits + '/' + N.length, combo > 2 ? '🔥 ' + combo : '🎹', 846);
    if(!fin.on && phase === 'ready') hint(g, t('musik.hint'), tt, 470, 99);
    if(!fin.on && phase === 'play' && st < 2.2) hint(g, ['3', '2', '1'][Math.min(2, Math.floor(st/.62))] || '', 1, 470, 99);
    fin.draw(g, dt, 'rgba(40,25,60,', .18); } };
startCard(scene);
window.__mu = { get phase(){ return phase; }, get st(){ return st; }, get N(){ return N; }, get hits(){ return hits; }, LANES };
