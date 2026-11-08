// Weihnachten lustig: „Lichtsalat“ – das Rentier hat sich in der Lichterkette verheddert. Jede Birne schaltet sich und ihre Nachbarn an der Kette um. Schaffst du es, dass alle leuchten?
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const BU = [[215, 305], [468, 365], [115, 470], [480, 525], [127, 615], [397, 630], [240, 693], [417, 745]], COL = ['#ff4a3a', '#3ad06a', '#ffd23a', '#4a8aff'];
const ORD = [0, 1, 3, 5, 7, 6, 4, 2];
let fx, fin, tt, phase, on, moves, blink;
const scene = {
  title: t('rentier.title'), subtitle: t('rentier.sub'), emoji: '🦌', accent: '#ffd23a', button: '#1a6a3a', bg: '#1e2a3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ on = BU.map(() => 1); for(let k = 0; k < 4 + Math.floor(Math.random()*3); k++) this.toggle(Math.floor(Math.random()*8), null); if(on.every(Boolean)) this.toggle(3, null); phase = 'ready'; moves = 0; blink = 0; tt = 0; fx.clear(); fin.stop(); },
  toggle(k, ctx){ const p = ORD.indexOf(k); for(const d of [-1, 0, 1]){ const q = p + d; if(q >= 0 && q < 8){ const j = ORD[q]; on[j] ^= 1; } } },
  onTap(x, y, ctx){ if(phase === 'end') return; let k = -1, bd = 46; BU.forEach((b, i) => { const d = Math.hypot(b[0] - x, b[1] - y); if(d < bd){ bd = d; k = i; } }); if(k < 0) return; phase = 'play';
    this.toggle(k, ctx); moves++; ctx.tone(on[k] ? 880 : 440, 0, .08, 'square', .04); fx.sparkle(BU[k][0], BU[k][1], 5);
    if(on.every(Boolean)) this.finish(ctx); },
  update(dt, ctx){ tt += dt; fx.update(dt); if(phase === 'end') blink += dt; },
  finish(ctx){ phase = 'end'; const b = best('rentier', moves, false); BU.forEach(bb => fx.burst(bb[0], bb[1], 8, COL, 200, 300, 4));
    ctx.melody([['E5', .25], ['E5', .25], ['E5', .5], ['E5', .25], ['E5', .25], ['E5', .5], ['E5', .25], ['G5', .25], ['C5', .25], ['D5', .25], ['E5', 1]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('rentier'), [t('rentier.line'), t('rentier.score', { n: moves }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('rentier.best', { n: b.best })], null), 1800); },
  draw(g, ctx){ const dt = 1/60;
    BU.forEach((b, i) => { const c = COL[i % 4], lit = phase === 'end' ? (Math.floor(blink*6 + i) % 2 ? 1 : .6) : on[i];
      if(lit){ g.save(); const gr = g.createRadialGradient(b[0], b[1], 4, b[0], b[1], 60); gr.addColorStop(0, c); gr.addColorStop(.35, c + 'aa'); gr.addColorStop(1, c + '00'); g.globalAlpha = lit; g.fillStyle = gr; g.beginPath(); g.arc(b[0], b[1], 60, 0, 7); g.fill();
        g.globalAlpha = .85*lit; g.fillStyle = c; g.beginPath(); g.arc(b[0], b[1], 24, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(b[0] - 7, b[1] - 8, 7, 0, 7); g.fill(); g.restore(); }
      else if(phase !== 'end'){ g.save(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.setLineDash([4, 5]); g.lineWidth = 2; g.beginPath(); g.arc(b[0], b[1], 30, 0, 7); g.stroke(); g.restore(); } });
    fx.draw(g);
    if(!fin.on) hud2(g, '💡 ' + on.reduce((a, b) => a + b, 0) + '/8', '👆 ' + moves, 846);
    if(!fin.on && phase === 'ready') hint(g, t('rentier.hint'), tt, 770, 99);
    fin.draw(g, dt, 'rgba(20,30,50,', .18); } };
startCard(scene);
window.__re = { get phase(){ return phase; }, get on(){ return on; }, BU, ORD };
