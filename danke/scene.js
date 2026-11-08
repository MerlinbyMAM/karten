// Danke: Memory mit sechs Paaren (Blumen, Herz, Geschenk, Stern, Kaffee, Sonne).
// Zwei Karten aufdecken – gleiche bleiben offen. Gezählt werden die Züge; weniger ist besser.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, rnd, MEL } from '../core/kit.js';

let GY = 566;                                             // Mitte des Kartenfelds – nach Motiv eingestellt
const COLS = 4, ROWS = 3, CW = 98, CH = 118, GAP = 12, SYM = ['💐', '💝', '🎁', '⭐', '☕', '🌞'];
let cards, open, lock, moves, pairs, fx, fin, tt, over;

const pos = i => ({ x: 300 + ((i % COLS) - (COLS - 1)/2)*(CW + GAP), y: GY + (Math.floor(i/COLS) - (ROWS - 1)/2)*(CH + GAP) });

function deal(){
  const s = [...SYM, ...SYM];
  for(let i = s.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
  return s.map(sym => ({ sym, f: 0, want: 0, done: false, glow: 0 }));
}

function drawCard(g, c, p){
  const k = Math.cos(c.f*Math.PI), w = Math.abs(k)*CW, front = k < 0;
  g.save(); g.translate(p.x, p.y);
  g.fillStyle = 'rgba(40,60,60,.25)'; g.beginPath(); g.roundRect(-w/2 + 3, -CH/2 + 5, w, CH, 14); g.fill();
  if(c.glow > 0){ g.shadowColor = `rgba(255,205,90,${c.glow})`; g.shadowBlur = 26; }
  if(front){
    g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(-w/2, -CH/2, w, CH, 14); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = c.done ? '#d9a640' : '#bfd6cf'; g.lineWidth = 4; g.stroke();
    if(w > 20){ g.save(); g.scale(w/CW, 1); g.font = '56px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.sym, 0, 4); g.restore(); }
  } else {
    const gr = g.createLinearGradient(0, -CH/2, 0, CH/2); gr.addColorStop(0, '#2f8a86'); gr.addColorStop(1, '#1d625f');
    g.fillStyle = gr; g.beginPath(); g.roundRect(-w/2, -CH/2, w, CH, 14); g.fill(); g.shadowBlur = 0;
    g.strokeStyle = '#e8c37a'; g.lineWidth = 3; g.beginPath(); g.roundRect(-w/2 + 7, -CH/2 + 7, Math.max(0, w - 14), CH - 14, 10); g.stroke();
    if(w > 20){ g.save(); g.scale(w/CW, 1); g.fillStyle = '#e8c37a';
      g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-30, -6, -16, -30, 0, -14); g.bezierCurveTo(16, -30, 30, -6, 0, 14); g.fill(); g.restore(); }
  }
  g.restore();
}

const scene = {
  title: t('danke.title'), subtitle: t('danke.sub'), emoji: '💐',
  accent: '#bfe3da', button: '#2f8a86', bg: '#24413f',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ cards = deal(); open = []; lock = 0; moves = 0; pairs = 0; tt = 0; over = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over || lock > 0) return;
    const i = cards.findIndex((c, i) => { const p = pos(i); return Math.abs(x - p.x) < CW/2 + 4 && Math.abs(y - p.y) < CH/2 + 4; });
    if(i < 0) return;
    const c = cards[i];
    if(c.done || c.want || open.includes(i)) return;
    c.want = 1; open.push(i); ctx.tone(520 + open.length*120, 0, .08, 'triangle', .08);
    if(open.length === 2){
      moves++;
      const [a, b] = open.map(k => cards[k]);
      if(a.sym === b.sym){
        lock = .45;
        setTimeout(() => { a.done = b.done = true; a.glow = b.glow = 1; pairs++; open = [];
          open.length = 0; [pos(cards.indexOf(a)), pos(cards.indexOf(b))].forEach(p => fx.sparkle(p.x, p.y, 12));
          const p = pos(cards.indexOf(b)); fx.pop(p.x, p.y - 80, t('danke.pair'), '#ffd34d', 34);
          ctx.melody([['E5', .25], ['G5', .25], ['C6', .5]], 280, 'triangle', .1);
          if(pairs === SYM.length) this.finish(ctx);
        }, 450);
      } else {
        lock = 1.05;
        setTimeout(() => { a.want = b.want = 0; open = []; ctx.tone(300, 0, .12, 'sine', .06); }, 1000);
      }
    }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); lock = Math.max(0, lock - dt);
    for(const c of cards){ c.f += ((c.want || c.done ? 1 : 0) - c.f)*Math.min(1, dt*10); c.glow = Math.max(0, c.glow - dt*.8); }
  },
  finish(ctx){
    over = true; const b = best('danke', moves, false);
    fx.burst(300, GY, 40, ['#ffd34d', '#ff8fa3', '#7fd1c1', '#fff'], 360, 380, 9);
    setTimeout(() => fin.start(ctx, greeting('danke'), [t('danke.score', { n: moves }) + (b.isNew ? '  ★' : ''), t('danke.best', { n: b.best })], MEL.fanfare), 700);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(!fin.on) hud(g, ['🃏 ' + moves, '✓ ' + pairs + '/' + SYM.length, '🏆 ' + (peekBest('danke') ?? '–')], 312);
    fx.applyShake(g);
    cards.forEach((c, i) => drawCard(g, c, pos(i)));
    fx.draw(g); g.restore();
    if(!fin.on && moves === 0 && !open.length) hint(g, t('danke.hint'), tt, GY, 5);
    fin.draw(g, dt, 'rgba(20,55,52,');
  }
};
startCard(scene);
window.__dk = { cards: () => cards, pos, get moves(){ return moves; } };
