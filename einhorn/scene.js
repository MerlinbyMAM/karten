// Kindergeburtstag (Einhorn): Sternenfänger. Die sechs gedruckten Sterne leuchten nacheinander auf.
// Wer den leuchtenden Stern rechtzeitig antippt, lässt ihn vom Himmel zum Horn des gedruckten Einhorns fliegen –
// das Horn funkelt in Regenbogenfarben. Danach kehrt der Stern an seinen Platz zurück. 40 Sekunden.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

// Freigestellte Sterne + Himmelsflicken (aus dem Originalbild, Inpainting) – Kartenkoordinaten 600 × 900
const STARS = [
  { n: 'stern1', x: 130, y: 196, w: 85, h: 86, cx: 171.2, cy: 243.5, px: 125, py: 194.5, pw: 94.5, ph: 90.5 },
  { n: 'stern2', x: 383, y: 198, w: 84, h: 86, cx: 425.2, cy: 247.5, px: 378.5, py: 197.5, pw: 94.5, ph: 90 },
  { n: 'stern3', x: 55, y: 293, w: 87, h: 86, cx: 99.2, cy: 339.8, px: 52, py: 292, pw: 94.5, ph: 90 },
  { n: 'stern4', x: 458, y: 293, w: 87, h: 86, cx: 501, cy: 339.7, px: 455, py: 290.5, pw: 94.5, ph: 90.5 },
  { n: 'stern5', x: 125, y: 391, w: 85, h: 83, cx: 166.7, cy: 437.8, px: 121, py: 389, pw: 92.5, ph: 88.5 },
  { n: 'stern6', x: 420, y: 391, w: 85, h: 83, cx: 460.6, cy: 437, px: 415, py: 389, pw: 92, ph: 88.5 } ];
const HORN = { x: 400, y: 418 }, TIME = 40;
const IMG = STARS.map(s => { const a = new Image(); a.src = s.n + '.png'; const b = new Image(); b.src = s.n + '_platz.png'; return { spr: a, bg: b }; });

let S, fx, fin, tt, time, caught, over, cur, gap, win, hornGlow;
const ready = i => IMG[i].spr.complete && IMG[i].bg.complete;

function nextStar(){
  const free = S.map((s, i) => i).filter(i => S[i].st === 'home' && i !== cur);
  if(!free.length){ cur = -1; gap = .3; return; }
  cur = free[Math.floor(Math.random()*free.length)]; S[cur].st = 'glow'; S[cur].t = 0;
  win = Math.max(1.05, 2.2 - (TIME - time)*.03);
}
function drawStar(g, i, x, y, sc, rot, al){
  const s = STARS[i]; if(!ready(i)) return;
  g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
  g.drawImage(IMG[i].spr, s.x - s.cx, s.y - s.cy, s.w, s.h); g.restore();
}

const scene = {
  title: t('einhorn.title'), subtitle: t('einhorn.sub'), emoji: '🦄',
  accent: '#ffc6e0', button: '#b07ad6', bg: '#5b3f7a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = STARS.map(() => ({ st: 'home', t: 0 })); tt = 0; time = TIME; caught = 0; over = false; cur = -1; gap = 1; win = 2.2; hornGlow = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    let hit = -1;
    STARS.forEach((s, i) => { if(Math.hypot(x - s.cx, y - s.cy) < 52) hit = i; });
    if(hit < 0) return;
    const st = S[hit];
    if(st.st === 'glow'){
      st.st = 'fly'; st.t = 0; caught++; cur = -1; gap = .35;
      ctx.tone(1047 + (caught % 6)*110, 0, .14, 'triangle', .1); fx.sparkle(STARS[hit].cx, STARS[hit].cy, 14);
    } else if(st.st === 'home'){ fx.pop(STARS[hit].cx, STARS[hit].cy - 50, t('einhorn.oops'), '#fff', 28); ctx.tone(330, 0, .08, 'sine', .05); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); hornGlow = Math.max(0, hornGlow - dt*.9);
    if(!over){ time -= dt; if(time <= 0){ time = 0; this.finish(ctx); } }
    S.forEach((st, i) => {
      st.t += dt;
      if(st.st === 'glow' && st.t > win){ st.st = 'home'; if(cur === i){ cur = -1; gap = .45; } }
      if(st.st === 'fly' && st.t >= .75){ st.st = 'gone'; st.t = 0; hornGlow = 1; fx.burst(HORN.x, HORN.y, 22, ['#ff8fb1', '#ffd36e', '#8fe3b4', '#8fc8ff', '#c9a3ff', '#fff'], 260, 200, 7);
        fx.pop(HORN.x, HORN.y - 50, '+1', '#fff3a8', 34); ctx.melody([['E6', .2], ['G6', .3]], 300, 'triangle', .07); }
      if(st.st === 'gone' && st.t >= 2.2){ st.st = 'back'; st.t = 0; }
      if(st.st === 'back' && st.t >= .6){ st.st = 'home'; st.t = 0; }
    });
    if(!over && cur < 0){ gap -= dt; if(gap <= 0) nextStar(); }
  },
  finish(ctx){
    over = true; const b = best('einhorn', caught);
    fin.start(ctx, greeting('einhorn'), [t('einhorn.score', { n: caught }) + (b.isNew ? '  ★' : ''), t('einhorn.best', { n: b.best })], MEL.birthday);
  },
  draw(g, ctx){
    const dt = 1/60;
    // leere Sternplätze mit Himmel füllen
    S.forEach((st, i) => { const s = STARS[i]; if(st.st !== 'home' && st.st !== 'glow' && ready(i)) g.drawImage(IMG[i].bg, s.px, s.py, s.pw, s.ph); });
    // Horn-Funkeln
    if(hornGlow > 0){ const r = g.createRadialGradient(HORN.x, HORN.y, 2, HORN.x, HORN.y, 70);
      r.addColorStop(0, `rgba(255,250,210,${.9*hornGlow})`); r.addColorStop(.5, `rgba(255,170,230,${.45*hornGlow})`); r.addColorStop(1, 'rgba(180,160,255,0)');
      g.fillStyle = r; g.beginPath(); g.arc(HORN.x, HORN.y, 70, 0, 7); g.fill(); }
    S.forEach((st, i) => {
      const s = STARS[i];
      if(st.st === 'glow'){
        const p = st.t/win, k = .5 + .5*Math.sin(st.t*14);
        const r = g.createRadialGradient(s.cx, s.cy, 5, s.cx, s.cy, 70); r.addColorStop(0, `rgba(255,245,180,${.75})`); r.addColorStop(1, 'rgba(255,220,120,0)');
        g.fillStyle = r; g.beginPath(); g.arc(s.cx, s.cy, 70, 0, 7); g.fill();
        drawStar(g, i, s.cx, s.cy, 1.12 + .08*k, Math.sin(st.t*10)*.12, 1);
        g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4; g.beginPath(); g.arc(s.cx, s.cy, 50, -Math.PI/2, -Math.PI/2 + (1 - p)*Math.PI*2); g.stroke(); g.restore();
      } else if(st.st === 'fly'){
        const u = Math.min(1, st.t/.75), e = u*u*(3 - 2*u);
        const x = s.cx + (HORN.x - s.cx)*e, y = s.cy + (HORN.y - s.cy)*e - Math.sin(u*Math.PI)*90;
        drawStar(g, i, x, y, 1 - .7*u, u*Math.PI*3, 1);
        fx.sparkle(x, y, 1);
      } else if(st.st === 'back'){ const u = st.t/.6; drawStar(g, i, s.cx, s.cy, u, (1 - u)*2, u); }
    });
    fx.draw(g);
    if(!fin.on) hud2(g, '⭐ ' + caught, '⏱ ' + Math.ceil(time) + ' s');
    if(!fin.on && caught === 0 && tt < 6) hint(g, t('einhorn.hint'), tt, 520, 6);
    fin.draw(g, dt, 'rgba(70,40,100,', .2);
  }
};
startCard(scene);
window.__eh = { STARS, S: () => S, get caught(){ return caught; } };
