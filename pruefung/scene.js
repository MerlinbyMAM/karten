// Prüfung bestanden: „Ab in den Korb!“ Fünf gedruckte Papierknäuel (der Prüfungsstress) liegen auf dem Tisch.
// Knäuel greifen und mit Schwung in den gedruckten Papierkorb werfen. Daneben: zurück auf den Tisch. Treffer und Würfe werden gezählt.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'ball1', x: 74, y: 520, w: 80, h: 80, cx: 117.1, cy: 562.4, px: 74, py: 518, pw: 81.5, ph: 84.5 },
  { n: 'ball2', x: 169, y: 518, w: 82, h: 82, cx: 211.9, cy: 557.9, px: 168, py: 519, pw: 85.5, ph: 76.5 },
  { n: 'ball3', x: 265, y: 520, w: 82, h: 82, cx: 306.4, cy: 562.3, px: 265.5, py: 523.5, pw: 81, ph: 74.5 },
  { n: 'ball4', x: 360, y: 520, w: 84, h: 80, cx: 400.3, cy: 564.0, px: 361, py: 525.5, pw: 81, ph: 72.5 },
  { n: 'ball5', x: 454, y: 518, w: 82, h: 82, cx: 494.3, cy: 562.6, px: 454, py: 524, pw: 81.5, ph: 74.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const RIM = { x: 450, y: 694, r: 80, rr: 98 }, FLOOR = 845, GR = 1500;
let S, fx, fin, tt, hits, throws, over, held, track;
const scene = {
  title: t('pruefung.title'), subtitle: t('pruefung.sub'), emoji: '🎓', accent: '#ffd36a', button: '#1f3a6a', bg: '#1f3a6a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(b => ({ st: 'home', x: b.cx, y: b.cy, vx: 0, vy: 0, rot: 0, t: 0, moved: false, al: 1 })); tt = 0; hits = 0; throws = 0; over = false; held = -1; track = []; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; held = -1; let bd = 60;
    S.forEach((s, i) => { if(s.st !== 'home') return; const d = Math.hypot(x - s.x, y - s.y); if(d < bd){ bd = d; held = i; } });
    if(held < 0) return; const s = S[held]; s.st = 'held'; s.moved = true; s.ox = s.x - x; s.oy = s.y - y; track = [[x, y, performance.now()]]; ctx.tone(500, 0, .04, 'triangle', .04); },
  onDrag(x, y){ if(held < 0) return; const s = S[held]; s.x = x + s.ox; s.y = Math.min(640, y + s.oy); track.push([x, y, performance.now()]); if(track.length > 8) track.shift(); },
  onRelease(ctx){ if(held < 0) return; const s = S[held]; held = -1; const now = performance.now();
    const tr = track.filter(p => now - p[2] < 120), a = tr[0] || track[0], b = track[track.length - 1], dtm = Math.max(16, b[2] - a[2]);
    s.vx = Math.max(-900, Math.min(900, (b[0] - a[0])/dtm*1000*.75)); s.vy = Math.max(-1100, Math.min(600, (b[1] - a[1])/dtm*1000*.75));
    if(Math.hypot(s.vx, s.vy) < 120){ s.st = 'ret'; s.t = 0; s.x0 = s.x; s.y0 = s.y; return; }
    s.st = 'fly'; s.t = 0; s.spin = s.vx/300; throws++; ctx.tone(700, 0, .1, 'sine', .03); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    S.forEach((s, i) => { s.t += dt; const b = OB[i];
      if(s.st === 'fly'){ const py = s.y; s.vy += GR*dt; s.x += s.vx*dt; s.y += s.vy*dt; s.rot += s.spin*dt*4;
        if(s.x < 25){ s.x = 25; s.vx = -s.vx*.5; } if(s.x > 575){ s.x = 575; s.vx = -s.vx*.5; }
        if(s.vy > 0 && py < RIM.y && s.y >= RIM.y){ const dx = Math.abs(s.x - RIM.x);
          if(dx < RIM.r){ s.st = 'in'; s.t = 0; hits++; ctx.tone(880, 0, .12, 'triangle', .08); ctx.tone(1175, .1, .2, 'triangle', .08); fx.burst(RIM.x, RIM.y - 10, 14, ['#ffd36a', '#fff', '#8ac8ff'], 200, 300, 4); fx.pop(RIM.x, RIM.y - 70, t('pruefung.treffer'), '#ffffff', 28);
            if(hits === OB.length) this.finish(ctx); }
          else if(dx < RIM.rr){ s.vy = -s.vy*.45; s.vx += (s.x < RIM.x ? -1 : 1)*140; ctx.tone(260, 0, .06, 'square', .04); } }
        if(s.y > FLOOR){ s.y = FLOOR; if(Math.abs(s.vy) > 220){ s.vy = -s.vy*.35; s.vx *= .6; ctx.tone(150, 0, .05, 'sine', .05); } else { s.st = 'floor'; s.t = 0; fx.pop(s.x, s.y - 40, t('pruefung.daneben'), '#ffe0e0', 22); } } }
      if(s.st === 'floor'){ s.x += s.vx*dt; s.vx *= .92; s.rot += s.vx*dt*.05; if(s.t > .7){ s.st = 'ret'; s.t = 0; s.x0 = s.x; s.y0 = s.y; } }
      if(s.st === 'ret'){ const u = Math.min(1, s.t/.5), e = u*u*(3 - 2*u); s.x = s.x0 + (b.cx - s.x0)*e; s.y = s.y0 + (b.cy - s.y0)*e - Math.sin(u*Math.PI)*80; if(u >= 1){ s.st = 'home'; s.rot = 0; } }
      if(s.st === 'in'){ s.y += 160*dt; if(s.t > .6) s.st = 'gone'; } }); },
  finish(ctx){ over = true; const b = best('pruefung', throws, false);
    ctx.melody([['G4', .25], ['C5', .25], ['E5', .25], ['G5', .5], ['E5', .25], ['G5', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('pruefung'), [t('pruefung.line'), t('pruefung.score', { n: throws }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('pruefung.best', { n: b.best })], MEL.birthday), 1500); },
  draw(g, ctx){ const dt = 1/60;
    S.forEach((s, i) => { const b = OB[i]; if(s.moved && s.st !== 'home' && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    const draw = (i, s) => { const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.translate(s.x, s.y); g.rotate(s.rot); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); };
    S.forEach((s, i) => { if(s.st === 'gone' || s.st === 'held') return;
      if(s.st === 'in'){ g.save(); g.beginPath(); g.rect(0, 0, 600, RIM.y + 2); g.clip(); draw(i, s); g.restore(); } else draw(i, s); });
    if(held >= 0){ const s = S[held]; g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 8; draw(held, s); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🗑️ ' + hits + '/5', '✋ ' + throws, 846);
    if(!fin.on && throws === 0 && held < 0) hint(g, t('pruefung.hint'), tt, 455, 10);
    fin.draw(g, dt, 'rgba(20,35,70,', .2); } };
startCard(scene);
window.__pr = { OB, RIM, S: () => S, get hits(){ return hits; } };
