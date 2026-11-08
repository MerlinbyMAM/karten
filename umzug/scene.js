// Umzug: „Einzug!“ Vor dem gedruckten Haus stehen zwei Kartons, Pflanze, Stehlampe und Bild im Rasen.
// Jedes Teil zur offenen Haustür ziehen – es wandert hinein, drinnen geht kurz das Licht an. Auf Zeit, Rekord.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'karton1', x: 14, y: 600, w: 146, h: 170, cx: 88.2, cy: 682.4, px: 9.5, py: 595.5, pw: 157, ph: 180.5 },
  { n: 'pflanze', x: 134, y: 540, w: 140, h: 212, cx: 204.8, cy: 654.5, px: 131, py: 553.5, pw: 149, ph: 205 },
  { n: 'karton2', x: 256, y: 648, w: 130, h: 122, cx: 321.4, cy: 706.2, px: 251, py: 640.5, pw: 141.5, ph: 136.5 },
  { n: 'lampe', x: 368, y: 535, w: 94, h: 221, cx: 417.0, cy: 619.0, px: 366, py: 531.5, pw: 101.5, ph: 233 },
  { n: 'bild', x: 446, y: 624, w: 146, h: 148, cx: 518.1, cy: 696.5, px: 439, py: 618.5, pw: 158, ph: 162 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const DOOR = { x: 302, y: 445, x0: 274, x1: 331, y0: 352, y1: 487 }, NOTES = [523, 587, 659, 784, 1046];
let S, fx, fin, tt, time, done, over, held, started, glow;
const scene = {
  title: t('umzug.title'), subtitle: t('umzug.sub'), emoji: '🏡', accent: '#ffe08a', button: '#3f7a3a', bg: '#2f5a2c',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(b => ({ st: 'home', x: b.cx, y: b.cy, sc: 1, t: 0, moved: false })); tt = 0; time = 0; done = 0; over = false; held = -1; started = false; glow = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; held = -1; let bd = 1e9;
    S.forEach((s, i) => { if(s.st !== 'home' && s.st !== 'back') return; const b = OB[i];
      if(Math.abs(x - s.x) < b.w*.55*s.sc && Math.abs(y - s.y) < b.h*.55*s.sc){ const d = Math.hypot(x - s.x, y - s.y); if(d < bd){ bd = d; held = i; } } });
    if(held < 0) return; started = true; const s = S[held]; s.st = 'held'; s.moved = true; s.ox = s.x - x; s.oy = s.y - y; ctx.tone(392, 0, .06, 'triangle', .05); },
  onDrag(x, y){ if(held < 0) return; const s = S[held]; s.x = x + s.ox; s.y = y + s.oy; s.sc = Math.max(.45, Math.min(1, .45 + (s.y - 400)/300*.55)); },
  onRelease(ctx){ if(held < 0) return; const s = S[held]; held = -1;
    if(Math.hypot(s.x - DOOR.x, s.y - DOOR.y) < 85){ s.st = 'in'; s.t = 0; s.x0 = s.x; s.y0 = s.y; s.sc0 = s.sc; ctx.tone(330, 0, .1, 'sine', .05); }
    else { s.st = 'back'; s.t = 0; s.x0 = s.x; s.y0 = s.y; s.sc0 = s.sc; ctx.tone(220, 0, .08, 'sine', .04); } },
  update(dt, ctx){ tt += dt; fx.update(dt); if(started && !over) time += dt; glow = Math.max(0, glow - dt*1.2);
    S.forEach((s, i) => { s.t += dt; const b = OB[i];
      if(s.st === 'back'){ const u = Math.min(1, s.t/.35), e = 1 - (1 - u)**3; s.x = s.x0 + (b.cx - s.x0)*e; s.y = s.y0 + (b.cy - s.y0)*e; s.sc = s.sc0 + (1 - s.sc0)*e; if(u >= 1) s.st = 'home'; }
      if(s.st === 'in'){ const u = Math.min(1, s.t/.9), e = u*u*(3 - 2*u); s.x = s.x0 + (DOOR.x - s.x0)*e; s.y = s.y0 + (DOOR.y + 25 - s.y0)*e; s.sc = s.sc0 + (.28 - s.sc0)*e;
        if(u >= 1){ s.st = 'gone'; done++; glow = 1; ctx.tone(NOTES[done - 1], 0, .3, 'triangle', .08); fx.burst(DOOR.x, DOOR.y - 20, 12, ['#ffe08a', '#fff'], 120, 200, 4); fx.pop(DOOR.x, DOOR.y - 100, t('umzug.drin'), '#ffffff', 26);
          if(done === OB.length) this.finish(ctx); } } }); },
  finish(ctx){ over = true; const secs = Math.round(time*10)/10, b = best('umzug', secs, false);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('umzug'), [t('umzug.line'), t('umzug.score', { s: secs }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('umzug.best', { s: b.best })], MEL.birthday), 1500); },
  draw(g, ctx){ const dt = 1/60;
    S.forEach((s, i) => { const b = OB[i]; if(s.moved && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    if(glow > 0 || over){ const a = over ? .55 + .2*Math.sin(tt*3) : glow*.8; g.save(); g.globalAlpha = a; const r = g.createRadialGradient(DOOR.x, DOOR.y - 20, 5, DOOR.x, DOOR.y - 20, 90); r.addColorStop(0, 'rgba(255,230,150,1)'); r.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = r; g.fillRect(DOOR.x - 100, DOOR.y - 120, 200, 200); g.restore(); }
    const draw = (i, x, y, sc, al = 1) => { const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = al; g.translate(x, y); g.scale(sc, sc); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore(); };
    const order = S.map((s, i) => i).sort((a, b) => S[a].y - S[b].y);
    for(const i of order){ const s = S[i];
      if(s.st === 'home' || s.st === 'back') draw(i, s.x, s.y, s.sc);
      else if(s.st === 'in'){ const u = Math.min(1, s.t/.9); g.save(); if(u > .55){ g.beginPath(); g.rect(DOOR.x0, DOOR.y0, DOOR.x1 - DOOR.x0, DOOR.y1 - DOOR.y0); g.clip(); } draw(i, s.x, s.y, s.sc, u > .7 ? 1 - (u - .7)/.3 : 1); g.restore(); } }
    if(held >= 0){ const s = S[held]; if(Math.hypot(s.x - DOOR.x, s.y - DOOR.y) < 85){ g.save(); g.strokeStyle = 'rgba(255,224,138,.95)'; g.lineWidth = 4; g.shadowColor = '#ffe08a'; g.shadowBlur = 16; g.strokeRect(DOOR.x0 - 4, DOOR.y0 - 4, DOOR.x1 - DOOR.x0 + 8, DOOR.y1 - DOOR.y0 + 8); g.restore(); }
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 14; g.shadowOffsetY = 10; draw(held, s.x, s.y, s.sc); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '📦 ' + done + '/' + OB.length, '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && !started) hint(g, t('umzug.hint'), tt, 520, 10);
    fin.draw(g, dt, 'rgba(30,60,30,', .2); } };
startCard(scene);
window.__uz = { OB, DOOR, S: () => S, get done(){ return done; } };
