// Danke: Der gedruckte Blumenstrauß ist ein Puzzle. Beim Start mischen sich die 9 Kacheln des Druckbilds durcheinander;
// zwei Kacheln antippen = tauschen. Ist alles wieder an seinem Platz, steht die gedruckte Karte wieder vollständig da.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, MEL, drawPiece, cardImg } from '../core/kit.js';

const PZ = { x: 75, y: 290, s: 450 }, N = 3, TS = PZ.s/N;     // Puzzlefeld auf dem Druckbild (vermessen)
const home = i => ({ x: PZ.x + (i % N + .5)*TS, y: PZ.y + (Math.floor(i/N) + .5)*TS });
const PIECES = Array.from({ length: N*N }, (_, i) => ({ ...home(i), w: TS, h: TS, shape: 'rect' }));
let slot, sel, moves, anim, fx, fin, tt, over, solvedT, mixT;

function shuffled(){
  let a;
  do { a = [...Array(N*N).keys()]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
  while(a.filter((v, i) => v === i).length > 1);
  return a;                                   // slot[i] = welches Teil liegt auf Platz i
}
const isSolved = () => slot.every((v, i) => v === i);

const scene = {
  title: t('danke.title'), subtitle: t('danke.sub'), emoji: '💐',
  accent: '#bfe3da', button: '#2f8a86', bg: '#24413f',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ slot = shuffled(); sel = -1; moves = 0; anim = {}; tt = 0; over = false; solvedT = 0; mixT = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over || mixT < 1.2) return;
    const cx = Math.floor((x - PZ.x)/TS), cy = Math.floor((y - PZ.y)/TS);
    if(cx < 0 || cy < 0 || cx >= N || cy >= N) return;
    const i = cy*N + cx;
    if(sel < 0){ sel = i; ctx.tone(660, 0, .07, 'triangle', .07); return; }
    if(sel === i){ sel = -1; return; }
    const a = sel, b = i; sel = -1; moves++;
    [slot[a], slot[b]] = [slot[b], slot[a]];
    anim[slot[a]] = { from: home(b), t: 0 }; anim[slot[b]] = { from: home(a), t: 0 };
    ctx.tone(slot[a] === a || slot[b] === b ? 988 : 523, 0, .12, 'triangle', .09);
    for(const k of [a, b]) if(slot[k] === k){ const h = home(k); fx.sparkle(h.x, h.y, 10); }
    if(isSolved()){ over = true; setTimeout(() => this.finish(ctx), 900); }
  },
  update(dt, ctx){
    tt += dt; mixT += dt; fx.update(dt);
    for(const k in anim){ anim[k].t += dt*4; if(anim[k].t >= 1) delete anim[k]; }
    if(over) solvedT += dt;
  },
  finish(ctx){
    const b = best('danke', moves, false);
    fx.burst(300, PZ.y + PZ.s/2, 40, ['#ffd34d', '#ff8fa3', '#7fd1c1', '#fff'], 360, 380, 9);
    fin.start(ctx, greeting('danke'), [t('danke.score', { n: moves }) + (b.isNew ? '  ★' : ''), t('danke.best', { n: b.best })], MEL.fanfare);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(!cardImg.complete) return;
    // Mischen am Anfang: Kacheln fliegen von ihrem Druckplatz zu ihrer gemischten Position
    const mix = Math.min(1, Math.max(0, (mixT - .4)/.8)), em = mix*mix*(3 - 2*mix);
    const gap = over ? Math.max(0, 1 - solvedT*1.5) : 1;
    g.save(); g.fillStyle = `rgba(36,65,63,${.9*gap})`; g.fillRect(PZ.x - 3, PZ.y - 3, PZ.s + 6, PZ.s + 6); g.restore();
    slot.forEach((piece, i) => {
      const to = home(i), from = home(piece), P = PIECES[piece];
      let x = from.x + (to.x - from.x)*em, y = from.y + (to.y - from.y)*em;
      const an = anim[piece]; if(an){ const u = an.t, e = u*u*(3 - 2*u); x = an.from.x + (to.x - an.from.x)*e; y = an.from.y + (to.y - an.from.y)*e - Math.sin(u*Math.PI)*30; }
      const s = (1 - .03*gap) * (sel === i ? 1.06 : 1);
      drawPiece(g, P, x, y, 0, s);
      if(sel === i){ g.save(); g.strokeStyle = '#ffd34d'; g.lineWidth = 5; g.strokeRect(x - TS*s/2, y - TS*s/2, TS*s, TS*s); g.restore(); }
      else if(piece === i && !over && mix >= 1){ g.save(); g.strokeStyle = 'rgba(255,215,90,.55)'; g.lineWidth = 2; g.strokeRect(x - TS*s/2 + 2, y - TS*s/2 + 2, TS*s - 4, TS*s - 4); g.restore(); }
    });
    fx.draw(g);
    if(!fin.on) hud(g, ['🔀 ' + moves, '✓ ' + slot.filter((v, i) => v === i).length + '/9', '🏆 ' + (peekBest('danke') ?? '–')], PZ.y - 64);
    if(!fin.on && moves === 0 && mixT > 1.2) hint(g, t('danke.hint'), tt, PZ.y + PZ.s/2, 6);
    fin.draw(g, dt, 'rgba(20,55,52,', .22);
  }
};
startCard(scene);
window.__dk = { slot: () => slot, home, PZ, get moves(){ return moves; } };
