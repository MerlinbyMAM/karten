// Ruhestand: „Ab ins Meer!“ Fünf gedruckte Arbeitsdinge liegen im Sand (Aktentasche, Wecker, Krawatte, Ordner, Kaffeebecher).
// Gegenstand greifen und Richtung Meer schleudern – landet er im Wasser, macht es Platsch und er versinkt.
// Zu kurz geworfen: er bleibt im Sand liegen und kann nochmal geworfen werden. Der Wecker klingelt, solange er da ist.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

const OB = [
  { n: 'koffer', x: 3, y: 550, w: 153, h: 153, cx: 79.6, cy: 627.1, px: 0, py: 541.5, pw: 162, ph: 167 },
  { n: 'wecker', x: 152, y: 555, w: 106, h: 145, cx: 205.1, cy: 636.4, px: 143.5, py: 556, pw: 118, ph: 152.5 },
  { n: 'krawatte', x: 240, y: 580, w: 100, h: 180, cx: 288.0, cy: 676.6, px: 233, py: 572.5, pw: 111.5, ph: 194 },
  { n: 'ordner', x: 334, y: 586, w: 169, h: 140, cx: 418.2, cy: 654.0, px: 326, py: 581, pw: 185.5, ph: 153.5 },
  { n: 'tasse', x: 494, y: 628, w: 102, h: 104, cx: 539.5, cy: 680.7, px: 488.5, py: 627, pw: 111.5, ph: 111.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const SEA0 = 378, shore = x => 492 - x*.03;   // Wasser zwischen Horizont und Uferlinie
const W = 1; // Wecker-Index

let S, fx, fin, tt, throws, sunk, over, held, track, ripples, ringT;

const scale = y => Math.max(.28, Math.min(1, .3 + (y - 380)/330*.7));

const scene = {
  title: t('ruhestand.title'), subtitle: t('ruhestand.sub'), emoji: '🏖️',
  accent: '#ffe08a', button: '#1d8aa0', bg: '#1d7a8c',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(b => ({ st: 'home', x: b.cx, y: b.cy, sc: 1, rot: 0, t: 0, moved: false }));
    tt = 0; throws = 0; sunk = 0; over = false; held = -1; track = []; ripples = []; ringT = 2.5; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return; held = -1; let bd = 1e9;
    S.forEach((s, i) => { if(s.st !== 'home' && s.st !== 'sand') return; const b = OB[i], w = b.w*s.sc*.55, h = b.h*s.sc*.55;
      if(Math.abs(x - s.x) < w && Math.abs(y - s.y) < h){ const d = Math.hypot(x - s.x, y - s.y); if(d < bd){ bd = d; held = i; } } });
    if(held < 0) return;
    const s = S[held]; s.st = 'held'; s.moved = true; s.ox = s.x - x; s.oy = s.y - y; track = [[x, y, performance.now()]];
    ctx.tone(330, 0, .06, 'triangle', .05);
  },
  onDrag(x, y){ if(held < 0) return; const s = S[held]; s.x = x + s.ox; s.y = Math.max(500, y + s.oy); s.sc = scale(s.y); track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); },
  onRelease(ctx){
    if(held < 0) return; const s = S[held], i = held; held = -1;
    const now = performance.now(); const tr = track.filter(p => now - p[2] < 140); const a = tr[0] || track[0], b = track[track.length - 1];
    const dtm = Math.max(16, b[2] - a[2]), vx = (b[0] - a[0])/dtm*1000, vy = (b[1] - a[1])/dtm*1000, sp = Math.hypot(vx, vy);
    if(sp < 250 || vy > -120){ s.st = 'sand'; s.sc = scale(s.y); ctx.tone(180, 0, .08, 'sine', .06); return; }
    throws++;
    const k = Math.min(1.25, sp/1700);
    s.st = 'fly'; s.t = 0; s.x0 = s.x; s.y0 = s.y; s.sc0 = s.sc;
    s.tx = Math.max(30, Math.min(570, s.x + vx*.32*k)); s.ty = Math.max(SEA0 + 6, s.y + vy*.42*k); s.dur = .55 + .35*k; s.spin = (vx/900) + (Math.random() - .5)*2;
    ctx.tone(500, 0, .15, 'sine', .04); ctx.tone(700, .05, .12, 'sine', .03);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    ripples = ripples.filter(r => (r.t += dt) < 1.6);
    S.forEach((s, i) => { s.t += dt;
      if(s.st === 'fly'){ const u = Math.min(1, s.t/s.dur);
        s.x = s.x0 + (s.tx - s.x0)*u; s.y = s.y0 + (s.ty - s.y0)*u - Math.sin(u*Math.PI)*(80 + (s.y0 - s.ty)*.35);
        s.sc = s.sc0 + (scale(s.ty) - s.sc0)*u; s.rot += s.spin*dt*4;
        if(u >= 1){ s.y = s.ty;
          if(s.ty < shore(s.tx)){ s.st = 'sink'; s.t = 0; sunk++; ripples.push({ x: s.x, y: s.y, t: 0, s: s.sc });
            fx.burst(s.x, s.y, 16, ['#ffffff', '#bfe9f5', '#6cc9de'], 150*s.sc + 60, 260, 4);
            ctx.noise(0, .35, .15, 500); ctx.tone(160, 0, .25, 'sine', .08); ctx.tone(90, .02, .3, 'triangle', .06);
            fx.pop(s.x, s.y - 30, t('ruhestand.weg'), '#ffffff', 26);
            if(sunk === OB.length) this.finish(ctx);
          } else { s.st = 'sand'; s.rot = 0; ctx.tone(140, 0, .1, 'sine', .07); fx.burst(s.x, s.y + 10, 8, ['#e8cf9a', '#d9b980'], 80, 300, 3); } } }
      if(s.st === 'sink' && s.t > 1.2) s.st = 'gone'; });
    // Wecker klingelt, solange er noch da ist
    const w = S[W];
    if(!over && (w.st === 'home' || w.st === 'sand')){ ringT -= dt; if(ringT <= 0){ ringT = 4.5; w.ring = .9;
      for(let k = 0; k < 8; k++) ctx.tone(k % 2 ? 1900 : 2200, k*.07, .05, 'square', .025); } }
    if(w.ring) w.ring = Math.max(0, w.ring - dt);
  },
  finish(ctx){
    over = true; const b = best('ruhestand', throws, false);
    ctx.melody([['G4', .25], ['C5', .25], ['E5', .25], ['G5', .5], ['E5', .25], ['G5', .75]], 200, 'triangle', .1);
    fx.burst(300, 430, 40, ['#ffe08a', '#ffffff', '#6cc9de', '#ff8a8a'], 360, 300, 7);
    setTimeout(() => fin.start(ctx, greeting('ruhestand'), [t('ruhestand.line'), t('ruhestand.score', { n: throws }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('ruhestand.best', { n: b.best })], MEL.birthday), 1600);
  },
  draw(g, ctx){
    const dt = 1/60;
    S.forEach((s, i) => { const b = OB[i]; if(s.moved && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    for(const r of ripples){ const u = r.t/1.6; g.save(); g.strokeStyle = `rgba(255,255,255,${.8*(1 - u)})`; g.lineWidth = 2;
      for(let k = 0; k < 2; k++){ const rr = (10 + u*60 - k*14)*r.s*1.4; if(rr > 0){ g.beginPath(); g.ellipse(r.x, r.y, rr, rr*.35, 0, 0, 7); g.stroke(); } } g.restore(); }
    const order = S.map((s, i) => i).sort((a, b) => S[a].y - S[b].y);
    for(const i of order){ const s = S[i], b = OB[i]; if(s.st === 'gone' || !IMG[i].spr.complete) continue;
      let x = s.x, y = s.y, rot = s.rot, sc = s.sc, al = 1;
      if(i === W && s.ring){ x += Math.sin(tt*70)*4*s.ring; rot += Math.sin(tt*55)*.12*s.ring; }
      g.save();
      if(s.st === 'sink'){ const u = Math.min(1, s.t/1.2); al = 1 - u; g.beginPath(); g.rect(0, 0, 600, s.y + 4); g.clip(); y += u*b.h*sc*.7; }
      if(s.st === 'fly' || s.st === 'held'){ g.save(); g.globalAlpha = .18; g.fillStyle = '#5a4020';
        const gy = s.st === 'held' ? s.y + b.h*sc*.45 : (s.y0 + (s.ty - s.y0)*Math.min(1, s.t/s.dur)) + b.h*sc*.4;
        g.beginPath(); g.ellipse(x, gy, b.w*sc*.4, b.h*sc*.08, 0, 0, 7); g.fill(); g.restore(); }
      g.globalAlpha = al; g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
      if(s.st === 'held'){ g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 14; g.shadowOffsetY = 8; }
      g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore();
      if(i === W && s.ring && s.st !== 'held'){ g.save(); g.strokeStyle = `rgba(255,80,60,${s.ring})`; g.lineWidth = 3;
        for(const d of [-1, 1]){ g.beginPath(); g.arc(x, y - 30*sc, 46*sc + (1 - s.ring)*20, d < 0 ? Math.PI*1.05 : -Math.PI*.35, d < 0 ? Math.PI*1.35 : -Math.PI*.05); g.stroke(); } g.restore(); } }
    fx.draw(g);
    if(!fin.on) hud2(g, '🌊 ' + sunk + '/5', '✋ ' + throws, 846);
    if(!fin.on && throws === 0 && held < 0) hint(g, t('ruhestand.hint'), tt, 330, 10);
    fin.draw(g, dt, 'rgba(10,60,80,', .2);
  }
};
startCard(scene);
window.__rs = { OB, S: () => S, get sunk(){ return sunk; } };
