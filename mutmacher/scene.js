// Mut machen: „Die Sonne kommt durch“ – ohne Punkte, ohne Zeit. Wolken vor der gedruckten Sonne mit dem Finger beiseiteschieben. Mit jeder Wolke wird es heller, bis die Sonne strahlt und der Gruß erscheint.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, greeting, hint, MEL } from '../core/kit.js';
const S = { x: 315, y: 435 }, NOTES = [392, 440, 494, 523, 587, 659, 784];
let fx, fin, tt, phase, cl, held, lx, ly, sun, done;
const scene = {
  title: t('mutmacher.title'), subtitle: t('mutmacher.sub'), emoji: '☀️', accent: '#ffe07a', button: '#3a6ab0', bg: '#2a3448',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ cl = Array.from({ length: 7 }, (_, i) => { const a = i/7*Math.PI*2; return { x: S.x + Math.cos(a)*40, y: S.y + Math.sin(a)*24, r: 62 + (i % 3)*10, vx: 0, vy: 0, free: false }; }); phase = 'ready'; held = null; sun = 0; done = false; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(done) return; phase = 'play'; let bi = null, bd = 1e9; for(const c of cl){ const d = Math.hypot(c.x - x, c.y - y); if(d < c.r && d < bd){ bd = d; bi = c; } } held = bi; lx = x; ly = y; },
  onDrag(x, y){ if(!held) return; held.vx = (x - lx)*30; held.vy = (y - ly)*30; held.x += x - lx; held.y += y - ly; lx = x; ly = y; },
  onRelease(){ held = null; },
  update(dt, ctx){ tt += dt; fx.update(dt);
    for(const c of cl){ if(c !== held){ c.x += c.vx*dt; c.y += c.vy*dt; c.vx *= Math.pow(.15, dt); c.vy *= Math.pow(.15, dt); }
      const d = Math.hypot(c.x - S.x, c.y - S.y); if(!c.free && d > 170){ c.free = true; const k = cl.filter(q => q.free).length; ctx.tone(NOTES[k - 1], 0, 1.2, 'sine', .06); fx.sparkle(S.x, S.y, 6 + k*2); } }
    const k = cl.filter(c => c.free).length/cl.length; sun += (k - sun)*Math.min(1, dt*2);
    if(!done && k >= 1){ done = true; ctx.melody([['C5', .5], ['E5', .5], ['G5', .5], ['C6', 1.5]], 90, 'sine', .08); setTimeout(() => fin.start(ctx, greeting('mutmacher'), [t('mutmacher.line')], null), 2200); } },
  cloud(g, c){ g.save(); g.globalAlpha = .93; g.fillStyle = '#c8cdd6'; for(const [dx, dy, s] of [[-.5, .1, .55], [0, -.2, .7], [.5, .05, .6], [-.15, .25, .6], [.25, .28, .55]]){ g.beginPath(); g.arc(c.x + dx*c.r, c.y + dy*c.r, s*c.r, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(c.x - .1*c.r, c.y - .35*c.r, .4*c.r, 0, 7); g.fill(); g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    if(sun > .02){ g.save(); g.globalAlpha = sun*.75; const gr = g.createRadialGradient(S.x, S.y, 10, S.x, S.y, 360); gr.addColorStop(0, 'rgba(255,245,190,1)'); gr.addColorStop(.3, 'rgba(255,230,140,.5)'); gr.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(S.x, S.y, 360, 0, 7); g.fill();
      g.translate(S.x, S.y); g.rotate(tt*.1); g.fillStyle = 'rgba(255,240,170,.35)'; for(let i = 0; i < 12; i++){ g.rotate(Math.PI/6); g.beginPath(); g.moveTo(0, -60); g.lineTo(14, -320*sun); g.lineTo(-14, -320*sun); g.closePath(); g.fill(); } g.restore();
      g.save(); g.globalAlpha = sun*.12; g.fillStyle = '#ffe9a0'; g.fillRect(0, 0, 600, 900); g.restore(); }
    for(const c of cl) this.cloud(g, c);
    fx.draw(g);
    if(!fin.on && !done) hint(g, t('mutmacher.hint'), phase === 'ready' ? 1 : 99, 640, 98);
    fin.draw(g, dt, 'rgba(60,70,100,', .15); } };
startCard(scene);
window.__mu2 = { get cl(){ return cl; }, get done(){ return done; }, S };
