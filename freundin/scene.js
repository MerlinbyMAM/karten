// Beste Freundin: „Unsere Momente“ – Merkspiel mit den sechs gedruckten Polaroids der Pinnwand.
// Die Fotos leuchten in einer Reihenfolge auf (springen leicht vor, eigener Ton); danach tippt man sie nach.
// Jede richtige Runde verlängert die Folge um einen Moment. Fehler oder 9 Momente = Finale.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL, drawPiece } from '../core/kit.js';

const PH = [[132, 419, 146, 172], [300, 416, 150, 168], [468, 420, 146, 174], [132, 611, 150, 172], [299, 610, 152, 170], [465, 612, 150, 170]]
  .map(([x, y, w, h]) => ({ x, y, w, h, shape: 'rect' }));
const NOTE = [523.3, 587.3, 659.3, 784, 880, 1046.5], GOAL = 9;

let seq, step, mode, show, glowP, fx, fin, tt, over, wait, round;

function addMoment(){ let k; do k = Math.floor(Math.random()*6); while(seq.length && k === seq[seq.length - 1]); seq.push(k); }

const scene = {
  title: t('freundin.title'), subtitle: t('freundin.sub'), emoji: '📸',
  accent: '#ffd0e4', button: '#c4508a', bg: '#6a3a5a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ seq = []; addMoment(); addMoment(); step = 0; mode = 'wait'; wait = 1.2; show = 0; glowP = PH.map(() => 0); tt = 0; over = false; round = 0; fx.clear(); fin.stop(); },
  pulse(k, ctx){ glowP[k] = 1; ctx.tone(NOTE[k], 0, .35, 'triangle', .09); },
  onTap(x, y, ctx){
    if(over || mode !== 'input') return;
    const k = PH.findIndex(p => Math.abs(x - p.x) < p.w/2 && Math.abs(y - p.y) < p.h/2);
    if(k < 0) return;
    this.pulse(k, ctx);
    if(k === seq[step]){
      step++;
      if(step === seq.length){ round = seq.length; fx.sparkle(PH[k].x, PH[k].y, 12);
        if(seq.length >= GOAL) return this.finish(ctx, true);
        fx.pop(300, 300, '♥ ' + seq.length, '#ff6fa8', 34); addMoment(); mode = 'wait'; wait = 1; }
    } else {
      fx.pop(PH[k].x, PH[k].y - 100, t('freundin.oops'), '#fff', 34); ctx.tone(180, 0, .3, 'sawtooth', .06); fx.shake(5);
      this.finish(ctx, false);
    }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); glowP = glowP.map(v => Math.max(0, v - dt*2.4));
    if(over) return;
    if(mode === 'wait'){ wait -= dt; if(wait <= 0){ mode = 'show'; show = 0; step = 0; } }
    else if(mode === 'show'){
      const iv = Math.max(.42, .75 - seq.length*.03), i = Math.floor(show/iv), prev = Math.floor((show - dt)/iv);
      if(i !== prev || show === 0){ if(i < seq.length) this.pulse(seq[i], ctx); }
      show += dt; if(show >= seq.length*iv + .2){ mode = 'input'; step = 0; }
    }
  },
  finish(ctx, all){
    over = true; mode = 'end'; const n = Math.max(round, all ? seq.length : round), b = best('freundin', n);
    fx.burst(300, 520, 46, ['#ff9fc8', '#ffd36e', '#c9a3ff', '#fff'], 360, 300, 8);
    setTimeout(() => fin.start(ctx, greeting('freundin'), [t('freundin.score', { n }) + (b.isNew ? '  ★' : ''), t('freundin.best', { n: b.best })], MEL.birthday), 900);
  },
  draw(g, ctx){
    const dt = 1/60;
    PH.forEach((p, k) => {
      const v = glowP[k];
      if(v > 0){
        g.save(); g.shadowColor = `rgba(255,120,180,${v})`; g.shadowBlur = 30*v; g.fillStyle = `rgba(255,170,210,${.55*v})`;
        g.fillRect(p.x - p.w/2 - 6, p.y - p.h/2 - 6, p.w + 12, p.h + 12); g.restore();
        drawPiece(g, p, p.x, p.y - 6*v, Math.sin(k)*.03*v, 1 + .08*v);
        g.save(); g.fillStyle = `rgba(255,255,255,${.25*v})`; g.fillRect(p.x - p.w*(1 + .08*v)/2, p.y - 6*v - p.h*(1 + .08*v)/2, p.w*(1 + .08*v), p.h*(1 + .08*v)); g.restore();
      }
    });
    fx.draw(g);
    if(!fin.on){
      hud2(g, '📸 ' + round, '♥ ' + seq.length + '/' + GOAL, 846);
      const msg = mode === 'show' || mode === 'wait' ? t('freundin.watch') : mode === 'input' ? t('freundin.you') : '';
      if(msg){ g.save(); g.font = 'bold 30px Georgia'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = 'rgba(90,30,70,.85)'; g.strokeText(msg, 300, 300); g.fillStyle = '#fff'; g.fillText(msg, 300, 300); g.restore(); }
      if(round === 0 && mode !== 'end') hint(g, t('freundin.hint'), tt, 515, 9);
    }
    fin.draw(g, dt, 'rgba(90,40,75,', .22);
  }
};
startCard(scene);
window.__fr = { PH, get seq(){ return seq; }, get mode(){ return mode; }, get round(){ return round; }, get over(){ return over; } };
