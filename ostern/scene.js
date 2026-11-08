// Ostern: Eiersuche. Die sieben gedruckten Ostereier tauchen beim Start in die Wiese ab.
// Immer wieder lugt eins an seinem Platz hervor – schnell antippen, dann hüpft es in den gedruckten Korb.
// Ziel: alle sieben Eier so schnell wie möglich im Korb. Danach liegt die Karte wieder wie gedruckt da.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, rnd, MEL } from '../core/kit.js';

const EGG = [
  { n: 'ei1', x: 16, y: 600, w: 88, h: 130, cx: 59.7, cy: 666.2, px: 13, py: 601.5, pw: 93.5, ph: 126 },
  { n: 'ei2', x: 96, y: 600, w: 88, h: 130, cx: 140.4, cy: 667.9, px: 93.5, py: 603, pw: 92.5, ph: 125.5 },
  { n: 'ei3', x: 176, y: 600, w: 88, h: 130, cx: 220.5, cy: 669.5, px: 174.5, py: 604.5, pw: 91.5, ph: 125.5 },
  { n: 'ei4', x: 256, y: 600, w: 88, h: 130, cx: 301.2, cy: 669.7, px: 255.5, py: 605.5, pw: 92, ph: 125.5 },
  { n: 'ei5', x: 339, y: 600, w: 88, h: 130, cx: 383.3, cy: 671.9, px: 337.5, py: 608.5, pw: 91.5, ph: 124 },
  { n: 'ei6', x: 418, y: 600, w: 88, h: 130, cx: 463.1, cy: 671.6, px: 418, py: 607.5, pw: 90.5, ph: 124.5 },
  { n: 'ei7', x: 498, y: 600, w: 88, h: 130, cx: 543.4, cy: 671.5, px: 497.5, py: 605.5, pw: 92.5, ph: 129 } ];
const IMG = EGG.map(e => { const a = new Image(); a.src = e.n + '.png'; const b = new Image(); b.src = e.n + '_platz.png'; return { spr: a, bg: b }; });
const BASKET = { x: 400, y: 472 }, NEST = [[-38, 0], [-12, -6], [14, -4], [38, 2], [-24, -22], [4, -24], [28, -18]];

let S, fx, fin, tt, time, over, intro, cur, gap, inBasket;
const ok = i => IMG[i].spr.complete && IMG[i].bg.complete;
function drawEgg(g, i, x, y, sc = 1, rot = 0, clipY = null){
  const e = EGG[i]; if(!ok(i)) return;
  g.save(); if(clipY !== null){ g.beginPath(); g.rect(0, 0, 600, clipY); g.clip(); }
  g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(IMG[i].spr, e.x - e.cx, e.y - e.cy, e.w, e.h); g.restore();
}
function nextPeek(){
  const free = S.map((s, i) => i).filter(i => S[i].st === 'hid');
  if(!free.length){ cur = -1; return; }
  cur = free[Math.floor(Math.random()*free.length)]; S[cur].st = 'peek'; S[cur].t = 0; S[cur].win = Math.max(.9, 1.6 - time*.01) + rnd(0, .4);
}

const scene = {
  title: t('ostern.title'), subtitle: t('ostern.sub'), emoji: '🐣',
  accent: '#ffe08a', button: '#e98aa8', bg: '#3d6b3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = EGG.map(() => ({ st: 'home', t: 0, win: 1.4 })); tt = 0; time = 0; over = false; intro = 0; cur = -1; gap = .8; inBasket = []; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over || intro < 1.6) return;
    let hit = -1;
    EGG.forEach((e, i) => { if(Math.abs(x - e.cx) < e.w*.6 && Math.abs(y - e.cy) < e.h*.6) hit = i; });
    if(hit < 0) return;
    const s = S[hit];
    if(s.st === 'peek' && s.t > .12){ s.st = 'hop'; s.t = 0; cur = -1; gap = .35; ctx.tone(880 + inBasket.length*90, 0, .12, 'triangle', .1); fx.sparkle(EGG[hit].cx, EGG[hit].cy - 20, 10); }
    else if(s.st === 'hid'){ ctx.tone(300, 0, .07, 'sine', .05); fx.burst(x, y, 5, ['#9ccc65', '#c5e1a5'], 80, 200, 4); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); intro += dt;
    if(intro >= 1.6 && !over) time += dt;
    S.forEach((s, i) => {
      s.t += dt;
      if(s.st === 'home' && intro > .5 + i*.08){ s.st = 'dive'; s.t = 0; }
      if(s.st === 'dive' && s.t >= .5){ s.st = 'hid'; s.t = 0; }
      if(s.st === 'peek' && s.t >= s.win){ s.st = 'down'; s.t = 0; if(cur === i){ cur = -1; gap = .3; } }
      if(s.st === 'down' && s.t >= .25){ s.st = 'hid'; s.t = 0; }
      if(s.st === 'hop' && s.t >= .7){ s.st = 'basket'; inBasket.push(i); fx.burst(BASKET.x, BASKET.y, 12, ['#ffd34d', '#ff8fb1', '#8fd3ff', '#fff'], 150, 250, 5);
        fx.pop(BASKET.x, BASKET.y - 60, inBasket.length + '/7', '#fff', 30); ctx.melody([['G5', .2], ['C6', .3]], 280, 'triangle', .08);
        if(inBasket.length === EGG.length) this.finish(ctx); }
    });
    if(!over && intro >= 1.6 && cur < 0){ gap -= dt; if(gap <= 0) nextPeek(); }
  },
  finish(ctx){
    over = true; const secs = Math.round(time*10)/10, b = best('ostern', secs, false);
    setTimeout(() => { S.forEach(s => { s.st = 'back'; s.t = 0; }); fx.burst(300, 600, 50, ['#ffd34d', '#ff8fb1', '#8fd3ff', '#b5e48c', '#fff'], 380, 340, 8);
      fin.start(ctx, greeting('ostern'), [t('ostern.score', { s: secs }) + (b.isNew ? '  ★' : ''), t('ostern.best', { s: b.best })], MEL.birthday); }, 700);
  },
  draw(g, ctx){
    const dt = 1/60;
    S.forEach((s, i) => { const e = EGG[i]; if(s.st !== 'home' && ok(i) && !(s.st === 'back' && s.t > .6)) g.drawImage(IMG[i].bg, e.px, e.py, e.pw, e.ph); });
    // Eier im Korb (vor dem Korbrand gezeichnet, klein)
    inBasket.forEach((i, k) => { if(S[i].st !== 'basket') return; const [dx, dy] = NEST[k]; drawEgg(g, i, BASKET.x + dx, BASKET.y + dy, .42, dx*.01); });
    S.forEach((s, i) => {
      const e = EGG[i], base = e.y + e.h;
      if(s.st === 'dive'){ const u = s.t/.5; drawEgg(g, i, e.cx, e.cy + u*u*e.h, 1, Math.sin(u*20)*.1*(1 - u), base); }
      else if(s.st === 'peek'){ const u = Math.min(1, s.t/.18), out = .62*u; drawEgg(g, i, e.cx, e.cy + (1 - out)*e.h, 1, Math.sin(s.t*12)*.08, base);
        g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.beginPath(); g.arc(e.cx, base - e.h*.6, 34, -Math.PI/2, -Math.PI/2 + (1 - s.t/s.win)*Math.PI*2); g.stroke(); g.restore(); }
      else if(s.st === 'down'){ const u = s.t/.25; drawEgg(g, i, e.cx, e.cy + (.38 + .62*u)*e.h, 1, 0, base); }
      else if(s.st === 'hop'){ const u = Math.min(1, s.t/.7), q = u*u*(3 - 2*u), k = inBasket.length, [dx, dy] = NEST[k] || [0, 0];
        const x = e.cx + (BASKET.x + dx - e.cx)*q, y = e.cy + .38*e.h*(1 - q) + (BASKET.y + dy - e.cy)*q - Math.sin(u*Math.PI)*170;
        drawEgg(g, i, x, y, 1 - .58*q, u*Math.PI*2); }
      else if(s.st === 'back'){ const u = Math.min(1, s.t/.6), q = u*u*(3 - 2*u); const k = inBasket.indexOf(i), [dx, dy] = NEST[k] || [0, 0];
        drawEgg(g, i, BASKET.x + dx + (e.cx - BASKET.x - dx)*q, BASKET.y + dy + (e.cy - BASKET.y - dy)*q - Math.sin(u*Math.PI)*120, .42 + .58*q, (1 - q)*Math.PI*2); }
    });
    fx.draw(g);
    if(!fin.on) hud2(g, '🥚 ' + inBasket.length + '/7', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && intro > 1.6 && inBasket.length === 0) hint(g, t('ostern.hint'), tt, 580, 9);
    fin.draw(g, dt, 'rgba(40,80,40,', .2);
  }
};
startCard(scene);
window.__os = { EGG, S: () => S, get n(){ return inBasket.length; }, get time(){ return time; } };
