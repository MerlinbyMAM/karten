// Abschied Kollege: „Kiste packen“. Auf dem gedruckten Schreibtisch steht ein offener Umzugskarton.
// Kaktus, Lieblingstasse, Foto und Hefter (aus dem Druck) in den Karton ziehen – sie plumpsen hinein.
// Am alten Platz bleibt ein blasser Umriss als Erinnerung. Zeit wird gestoppt, Rekord gespeichert.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

const OB = [
  { n: 'kaktus', x: 32, y: 476, w: 92, h: 150, cx: 77.0, cy: 559.4, px: 32, py: 480, pw: 90.5, ph: 147 },
  { n: 'tasse', x: 128, y: 578, w: 98, h: 92, cx: 169.2, cy: 621.2, px: 126, py: 578, pw: 99, ph: 90.5 },
  { n: 'foto', x: 322, y: 547, w: 113, h: 116, cx: 376.4, cy: 603.7, px: 320.5, py: 548.5, pw: 113, ph: 113 },
  { n: 'hefter', x: 426, y: 601, w: 101, h: 72, cx: 473.1, cy: 636.3, px: 425, py: 603, pw: 101, ph: 70.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const BOX = { x: 268, y: 498 }, RIM = [[120, 300], [600, 300], [600, 470], [397, 505], [263, 538], [145, 490], [120, 480]];
const NOTES = [523, 659, 784, 1046];

let S, fx, fin, tt, time, packed, over, held, started, boxHop;

const scene = {
  title: t('abschied.title'), subtitle: t('abschied.sub'), emoji: '📦',
  accent: '#ffd88a', button: '#6a4a8c', bg: '#4a3a6a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(b => ({ st: 'home', x: b.cx, y: b.cy, sc: 1, t: 0 })); tt = 0; time = 0; packed = 0; over = false; held = -1; started = false; boxHop = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return; held = -1; let bd = 1e9;
    S.forEach((s, i) => { if(s.st !== 'home' && s.st !== 'back') return; const b = OB[i];
      if(Math.abs(x - s.x) < b.w*.6 && Math.abs(y - s.y) < b.h*.6){ const d = Math.hypot(x - s.x, y - s.y); if(d < bd){ bd = d; held = i; } } });
    if(held < 0) return; started = true;
    const s = S[held]; s.st = 'held'; s.ox = s.x - x; s.oy = s.y - y; ctx.tone(392, 0, .06, 'triangle', .05);
  },
  onDrag(x, y){ if(held < 0) return; const s = S[held]; s.x = x + s.ox; s.y = y + s.oy; const d = Math.hypot(s.x - BOX.x, s.y - BOX.y); s.sc = d < 110 ? .8 + d/110*.2 : 1; },
  onRelease(ctx){
    if(held < 0) return; const s = S[held], i = held; held = -1;
    if(Math.hypot(s.x - BOX.x, s.y - BOX.y) < 95){ s.st = 'drop'; s.t = 0; s.x0 = s.x; s.y0 = s.y; s.sc0 = s.sc; ctx.tone(300, 0, .1, 'sine', .05); }
    else { s.st = 'back'; s.t = 0; s.x0 = s.x; s.y0 = s.y; ctx.tone(220, 0, .08, 'sine', .04); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); if(started && !over) time += dt; boxHop = Math.max(0, boxHop - dt*2.5);
    S.forEach((s, i) => { s.t += dt; const b = OB[i];
      if(s.st === 'back'){ const u = Math.min(1, s.t/.3), e = 1 - (1 - u)**3; s.x = s.x0 + (b.cx - s.x0)*e; s.y = s.y0 + (b.cy - s.y0)*e; s.sc = 1; if(u >= 1) s.st = 'home'; }
      if(s.st === 'drop'){ const u = Math.min(1, s.t/.7);
        if(u < .35){ const e = u/.35; s.x = s.x0 + (BOX.x - s.x0)*e; s.y = s.y0 + (BOX.y - 40 - s.y0)*e - Math.sin(e*Math.PI)*30; s.sc = s.sc0 + (.62 - s.sc0)*e; }
        else { const e = (u - .35)/.65; s.x = BOX.x; s.y = BOX.y - 40 + e*e*120; s.sc = .62; }
        if(u >= 1){ s.st = 'in'; packed++; boxHop = 1; ctx.tone(110, 0, .18, 'sine', .1); ctx.tone(NOTES[packed - 1], .05, .3, 'triangle', .08);
          fx.burst(BOX.x, BOX.y - 10, 10, ['#ffd88a', '#fff', '#c9a26a'], 140, 300, 4); fx.pop(BOX.x, BOX.y - 70, t('abschied.plopp'), '#ffffff', 26);
          if(packed === OB.length) this.finish(ctx); } } });
  },
  finish(ctx){
    over = true; const secs = Math.round(time*10)/10, b = best('abschied', secs, false);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['A5', .25], ['C6', .75]], 200, 'triangle', .1);
    for(let k = 0; k < 3; k++) setTimeout(() => fx.burst(BOX.x, BOX.y - 30, 24, ['#ff6b8a', '#ffd88a', '#ffffff', '#8ac8ff'], 320, 260, 6), k*300);
    setTimeout(() => fin.start(ctx, greeting('abschied'), [t('abschied.line'), t('abschied.score', { s: secs }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('abschied.best', { s: b.best })], MEL.birthday), 1600);
  },
  draw(g, ctx){
    const dt = 1/60;
    // alter Platz: blasser Umriss als Erinnerung
    S.forEach((s, i) => { const b = OB[i]; if(s.st === 'home') return;
      if(IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph);
      if(IMG[i].spr.complete){ g.save(); g.globalAlpha = .3; g.drawImage(IMG[i].spr, b.x, b.y, b.w, b.h); g.restore(); } });
    // Karton hüpft beim Einplumpsen: Ausschnitt des gedruckten Kartons kurz anheben
    const draw = (i, x, y, sc, al = 1) => { const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = al; g.translate(x, y); g.scale(sc, sc); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); };
    S.forEach((s, i) => {
      if(s.st === 'drop' && s.t/.7 >= .35){ g.save(); g.beginPath(); RIM.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); draw(i, s.x, s.y, s.sc); g.restore(); } });
    S.forEach((s, i) => {
      if(s.st === 'home' || s.st === 'back') draw(i, s.x, s.y + (s.st === 'home' && !started ? -Math.max(0, Math.sin(tt*3 - i*.8))*3 : 0), 1);
      else if(s.st === 'drop' && s.t/.7 < .35) draw(i, s.x, s.y, s.sc); });
    if(held >= 0){ const s = S[held], b = OB[held];
      const near = Math.hypot(s.x - BOX.x, s.y - BOX.y) < 95;
      if(near){ g.save(); g.strokeStyle = 'rgba(255,216,138,.9)'; g.lineWidth = 4; g.shadowColor = '#ffd88a'; g.shadowBlur = 16; g.beginPath(); g.ellipse(BOX.x, BOX.y, 95, 34, -.05, 0, 7); g.stroke(); g.restore(); }
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 14; g.shadowOffsetY = 10; draw(held, s.x, s.y, s.sc); g.restore(); }
    if(boxHop > 0){ g.save(); g.globalAlpha = boxHop*.5; g.fillStyle = '#fff3d0'; g.beginPath(); g.ellipse(BOX.x, BOX.y, 80*(1.2 - boxHop*.2), 26, 0, 0, 7); g.fill(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '📦 ' + packed + '/' + OB.length, '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !started) hint(g, t('abschied.hint'), tt, 330, 10);
    fin.draw(g, dt, 'rgba(40,30,70,', .2);
  }
};
startCard(scene);
window.__ab = { OB, BOX, S: () => S, get packed(){ return packed; } };
