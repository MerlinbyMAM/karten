// Weihnachten für Kinder: „Geschenke-Express“ – der Weihnachtsmann fliegt mit dem Schlitten über das Dorf. Tippen lässt ein Geschenk fallen – es soll genau in einen der vier gedruckten Schornsteine plumpsen!
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const CH = [[60, 515], [255, 523], [403, 506], [544, 508]], SY = 360, MAXP = 14;
let fx, fin, tt, phase, sx, dir, sp, pres, done, used;
const scene = {
  title: t('lichterdorf.title'), subtitle: t('lichterdorf.sub'), emoji: '🎁', accent: '#ffd98a', button: '#b0201a', bg: '#141e3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; sx = -80; dir = 1; sp = 170; pres = []; done = [0, 0, 0, 0]; used = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; return; } if(phase !== 'play' || used >= MAXP || sx < 0 || sx > 600) return; used++;
    pres.push({ x: sx, y: SY + 20, vx: dir*sp*.85, vy: 0, c: ['#e83a3a', '#3a8ae8', '#3ac86a', '#e8b83a'][used % 4], st: 'fall', r: 0 }); ctx.tone(660, 0, .06, 'triangle', .05); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play' || phase === 'ready'){ sx += dir*sp*dt; if(sx > 700){ dir = -1; sp = Math.min(300, sp + 15); } if(sx < -100){ dir = 1; sp = Math.min(300, sp + 15); } }
    for(const p of pres){ if(p.st !== 'fall') continue; p.vy += 600*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.r += dt*3*Math.sign(p.vx);
      CH.forEach((c, i) => { if(p.st === 'fall' && p.y >= c[1] - 6 && p.y < c[1] + 14 && Math.abs(p.x - c[0]) < 20){ p.st = 'in';
        if(!done[i]){ done[i] = 1; fx.pop(c[0], c[1] - 50, '✔', '#b9ff9a', 34); fx.burst(c[0], c[1] - 10, 16, ['#ffffff', '#ffd34d', '#ff7a5a'], 160, -60, 4); ctx.tone(784 + i*100, 0, .2, 'triangle', .08); }
        else { fx.pop(c[0], c[1] - 50, t('lichterdorf.voll'), '#ffffff', 22); ctx.tone(392, 0, .1, 'sine', .05); } } });
      if(p.st === 'fall' && p.y > 600){ p.st = 'snow'; fx.burst(p.x, 600, 10, ['#ffffff', '#dfe8ff'], 120, 300, 4); ctx.tone(200, 0, .1, 'sine', .04); } }
    pres = pres.filter(p => p.st === 'fall');
    if(phase === 'play' && done.every(Boolean)) this.finish(ctx);
    else if(phase === 'play' && used >= MAXP && !pres.length) this.finish(ctx); },
  finish(ctx){ phase = 'end'; const n = done.reduce((a, b) => a + b, 0), b = n === 4 ? best('lichterdorf', used, false) : { isNew: false, best: '–' };
    ctx.melody([['G4', .5], ['E5', .5], ['D5', .5], ['C5', .5], ['G4', 1.5]], 150, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('lichterdorf'), [t('lichterdorf.line'), (n === 4 ? t('lichterdorf.score', { n: used }) : t('lichterdorf.teil', { n })) + (b.isNew ? '  ★' : '') + '  ·  ' + t('lichterdorf.best', { n: b.best })], MEL.birthday), 700); },
  gift(g, x, y, c, r){ g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = c; g.fillRect(-13, -13, 26, 26); g.fillStyle = '#fff2a0'; g.fillRect(-3, -13, 6, 26); g.fillRect(-13, -3, 26, 6); g.beginPath(); g.ellipse(-6, -16, 6, 4, -.5, 0, 7); g.ellipse(6, -16, 6, 4, .5, 0, 7); g.fill(); g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    CH.forEach((c, i) => { if(done[i]){ for(let k = 0; k < 3; k++){ const u = ((tt*.5 + k/3) % 1); g.fillStyle = `rgba(230,230,240,${.5*(1 - u)})`; g.beginPath(); g.arc(c[0] + Math.sin(u*6 + k)*8, c[1] - 14 - u*70, 6 + u*12, 0, 7); g.fill(); } g.fillStyle = 'rgba(255,220,120,.9)'; g.font = '22px sans-serif'; g.textAlign = 'center'; g.fillText('⭐', c[0], c[1] - 30); }
      else if(phase === 'play'){ g.save(); g.strokeStyle = `rgba(255,240,180,${.4 + .3*Math.sin(tt*4 + i)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(c[0] - 20, c[1] - 4); g.lineTo(c[0] + 20, c[1] - 4); g.stroke(); g.restore(); } });
    for(const p of pres) this.gift(g, p.x, p.y, p.c, p.r);
    g.save(); g.translate(sx, SY + Math.sin(tt*3)*6); g.scale(dir, 1); g.font = '44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('🛷', 0, 0); g.fillText('🎅', -4, -18); g.font = '36px sans-serif'; g.fillText('🦌', 70, -6); g.fillText('🦌', 118, -10);
    g.strokeStyle = '#c8a050'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(20, 0); g.lineTo(60, -4); g.stroke(); g.restore();
    if(Math.random() < .5) fx.sparkle(sx - dir*30, SY + 10, 1);
    fx.draw(g);
    if(!fin.on) hud2(g, '🎁 ' + (MAXP - used), '🏠 ' + done.reduce((a, b) => a + b, 0) + '/4', 846);
    if(!fin.on && phase === 'ready') hint(g, t('lichterdorf.hint'), tt, 460, 99);
    fin.draw(g, dt, 'rgba(20,30,60,', .18); } };
startCard(scene);
window.__do = { get phase(){ return phase; }, get sx(){ return sx; }, get dir(){ return dir; }, get sp(){ return sp; }, get done(){ return done; }, CH, SY };
