// Trauer Haustier: „Regenbogenbrücke“ – ohne Spiel, ohne Punkte. Wer die Wiese berührt, lässt kleine Lichter aufsteigen; leuchtende Pfotenabdrücke wandern still über den gedruckten Regenbogen und werden zu Sternen. Danach erscheint ruhig der Gruß.
import { startCard, t } from '../core/card.js';
import { makeFx, greeting, hint, bigText } from '../core/kit.js';
const RC = { x: 300, y: 560 }, RR = 236, NEED = 7, NOTES = [392, 440, 523.3, 587.3, 659.3, 784, 880];
let fx, tt, lights, paws, stars, taps, done, finT, glow;
const scene = {
  title: t('regenbogen.title'), subtitle: t('regenbogen.sub'), emoji: '🌈', accent: '#f3e6ff', button: '#6a7aa8', bg: '#3a3a52',
  init(ctx){ fx = makeFx(); this.restart(ctx); },
  restart(ctx){ lights = []; paws = []; stars = []; taps = 0; done = false; finT = 0; glow = 0; tt = 0; fx.clear(); },
  onTap(x, y, ctx){ if(done) return; if(y < 330) return; taps++;
    lights.push({ x, y, t: 0, tx: 300 + (Math.random() - .5)*360, ty: 300 + Math.random()*60 });
    ctx.tone(NOTES[(taps - 1) % 7], 0, 1.4, 'sine', .05); ctx.tone(NOTES[(taps - 1) % 7]*2, .05, 1, 'sine', .015);
    for(let i = 0; i < 4; i++){ const k = paws.length; paws.push({ k, t: -i*.35, side: k % 2 }); }
    if(taps >= NEED){ done = true; finT = 0; } },
  update(dt, ctx){ tt += dt; fx.update(dt); if(done){ finT += dt; glow = Math.min(1, glow + dt*.4); } else glow = Math.min(.5, taps/NEED*.5);
    for(const l of lights){ l.t += dt; if(l.t > 3 && !l.star){ l.star = true; stars.push({ x: l.tx, y: l.ty, t: 0 }); } }
    for(const p of paws) p.t += dt; for(const s of stars) s.t += dt; },
  pawPos(k){ const u = Math.min(1, k/30), a = Math.PI*(1.02 - u*1.04); return [RC.x + Math.cos(a)*RR, RC.y - Math.sin(a)*RR*.98]; },
  paw(g, x, y, r, a){ g.save(); g.translate(x, y); g.rotate(r); g.globalAlpha = a; g.fillStyle = '#fffaf0'; g.shadowColor = '#ffe8b0'; g.shadowBlur = 10;
    g.beginPath(); g.ellipse(0, 3, 6, 5, 0, 0, 7); g.fill(); for(const [dx, dy] of [[-6, -5], [-2, -8], [2, -8], [6, -5]]){ g.beginPath(); g.arc(dx, dy, 2.2, 0, 7); g.fill(); } g.restore(); },
  draw(g, ctx){
    if(glow > 0){ g.save(); g.globalAlpha = glow*.55; g.lineWidth = 60; const gr = g.createRadialGradient(RC.x, RC.y, RR - 40, RC.x, RC.y, RR + 40); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,250,235,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.strokeStyle = gr; g.beginPath(); g.arc(RC.x, RC.y, RR, Math.PI*1.02, Math.PI*1.98); g.stroke(); g.restore(); }
    for(const p of paws){ if(p.t < 0) continue; const [x, y] = this.pawPos(p.k), [x2, y2] = this.pawPos(p.k + 1), r = Math.atan2(y2 - y, x2 - x) + Math.PI/2, off = p.side ? 7 : -7;
      const a = Math.min(1, p.t*1.5)*(p.t > 5 ? Math.max(0, 1 - (p.t - 5)/2) : 1); this.paw(g, x + Math.cos(r)*off, y + Math.sin(r)*off, r, a*.9);
      if(p.t > 5 && !p.st){ p.st = true; stars.push({ x, y: y - 10, t: 0 }); } }
    for(const l of lights){ if(l.t > 3) continue; const u = l.t/3, e = u*u*(3 - 2*u), x = l.x + (l.tx - l.x)*e + Math.sin(l.t*3)*10, y = l.y + (l.ty - l.y)*e;
      g.save(); const gr = g.createRadialGradient(x, y, 1, x, y, 22); gr.addColorStop(0, 'rgba(255,248,220,.95)'); gr.addColorStop(1, 'rgba(255,230,170,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); g.restore(); }
    for(const s of stars){ const a = Math.min(1, s.t)*(.6 + .4*Math.sin(tt*2 + s.x)); g.save(); g.globalAlpha = a; g.fillStyle = '#fffbe8'; g.shadowColor = '#fff3c0'; g.shadowBlur = 12; g.translate(s.x, s.y); g.beginPath();
      for(let i = 0; i < 10; i++){ const r = i % 2 ? 2.5 : 7, an = -Math.PI/2 + i*Math.PI/5; g.lineTo(Math.cos(an)*r, Math.sin(an)*r); } g.closePath(); g.fill(); g.restore(); }
    if(!done) hint(g, t('regenbogen.hint'), taps ? 99 : 1, 470, 98);
    if(done && finT > 3){ const a = Math.min(1, (finT - 3)/2.5); g.save(); g.globalAlpha = a*.55; g.fillStyle = 'rgba(60,60,90,1)'; g.beginPath(); g.roundRect(40, 380, 520, 200, 24); g.fill(); g.globalAlpha = a;
      bigText(g, greeting('regenbogen'), 300, 445, 34, '#fffaf0', 'rgba(50,50,80,.8)'); g.font = 'italic 24px Georgia'; g.textAlign = 'center'; g.fillStyle = '#fff3d8'; g.fillText(t('regenbogen.line1'), 300, 515); g.fillText(t('regenbogen.line2'), 300, 548); g.restore(); }
    fx.draw(g); } };
startCard(scene);
window.__rb = { get done(){ return done; }, get taps(){ return taps; }, get finT(){ return finT; } };
