// Babyparty: „Storchenflug“. Der gedruckte Storch fliegt los – antippen lässt ihn flattern. Durch die Wolkenlücken
// zum Haus mit dem Herz an der Tür. 8 Lücken, dann landet das Bündel vor der Tür. Ohne Druck: Absturz = einfach weiter.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'storch', x: 56, y: 246, w: 360, h: 308, cx: 223.9, cy: 416.6, px: 56.5, py: 245, pw: 355.5, ph: 306 } ];
const ST = OB[0], IMG = new Image(), BG = new Image(); IMG.src = 'storch.png'; BG.src = 'storch_platz.png';
const TOP = 230, BOT = 610, SC = .36, X = 150, GOAL = 8, DOOR = { x: 461, y: 716 };
let s, gates, passed, phase, fx, fin, tt, moved, spawn, crashes;
function cloud(g, x, y, r){ const P = [[0, 0, 1], [-r*.8, r*.2, .75], [r*.8, r*.25, .7], [-r*.35, -r*.45, .7], [r*.4, -r*.4, .65]];
  g.save(); g.fillStyle = 'rgba(140,165,205,.85)'; for(const [dx, dy, k] of P){ g.beginPath(); g.arc(x + dx, y + dy + 3, r*k + 3, 0, 7); g.fill(); }
  for(const [dx, dy, k] of P){ const gr = g.createRadialGradient(x + dx - r*k*.3, y + dy - r*k*.4, 2, x + dx, y + dy, r*k); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dce8f6'); g.fillStyle = gr; g.beginPath(); g.arc(x + dx, y + dy, r*k, 0, 7); g.fill(); } g.restore(); }
const scene = {
  title: t('babyparty.title'), subtitle: t('babyparty.sub'), emoji: '🕊️', accent: '#ffd0e0', button: '#6a90c0', bg: '#8ab0d8',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ s = { x: ST.cx, y: ST.cy, vy: 0, sc: 1, rot: 0, flap: 0 }; gates = []; passed = 0; phase = 'ready'; tt = 0; moved = false; spawn = 0; crashes = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'intro'; moved = true; s.t = 0; return; }
    if(phase === 'fly' || phase === 'intro'){ s.vy = -330; s.flap = .25; ctx.tone(520, 0, .06, 'sine', .04); } },
  update(dt, ctx){ tt += dt; fx.update(dt); s.flap = Math.max(0, s.flap - dt);
    if(phase === 'intro'){ s.t += dt; const u = Math.min(1, s.t/.7); s.x = ST.cx + (X - ST.cx)*u; s.y = ST.cy + (420 - ST.cy)*u; s.sc = 1 + (SC - 1)*u; if(u >= 1){ phase = 'fly'; s.vy = 0; } }
    if(phase === 'fly'){ s.vy += 820*dt; s.y += s.vy*dt; s.rot = Math.max(-.4, Math.min(.5, s.vy/700));
      spawn -= dt; if(spawn <= 0 && passed + gates.length < GOAL){ const gap = 150 - Math.min(40, passed*5), c = TOP + gap/2 + 30 + Math.random()*(BOT - TOP - gap - 60); gates.push({ x: 660, c, gap, done: false }); spawn = 2.1; }
      for(const g of gates){ g.x -= 150*dt; if(!g.done && g.x < X){ g.done = true; passed++; ctx.tone(660 + passed*60, 0, .15, 'triangle', .07); fx.pop(X, s.y - 50, passed + '/' + GOAL, '#ffffff', 24); } }
      gates = gates.filter(g => g.x > -80);
      const hb = 22; let hit = s.y < TOP - 20 || s.y > BOT + 20;
      for(const g of gates){ if(Math.abs(g.x - X) < 46 && (s.y - hb < g.c - g.gap/2 || s.y + hb > g.c + g.gap/2)) hit = true; }
      if(hit){ crashes++; ctx.tone(200, 0, .25, 'sine', .07); fx.burst(X, s.y, 14, ['#ffffff', '#ffd0e0'], 160, 200, 4); fx.pop(X, s.y - 50, t('babyparty.huch'), '#ffe0f0', 24);
        gates = gates.filter(g => g.x < X - 60 || g.done); s.y = Math.max(TOP + 60, Math.min(BOT - 60, s.y)); s.vy = -200; }
      if(passed >= GOAL && !gates.length){ phase = 'land'; s.t = 0; s.x0 = s.x; s.y0 = s.y; } }
    if(phase === 'land'){ s.t += dt; const u = Math.min(1, s.t/1.6), e = u*u*(3 - 2*u); s.x = s.x0 + (DOOR.x - 40 - s.x0)*e; s.y = s.y0 + (DOOR.y - 70 - s.y0)*e - Math.sin(u*Math.PI)*60; s.rot = 0;
      if(u >= 1){ phase = 'done'; ctx.melody([['G5', .25], ['E5', .25], ['C5', .25], ['G5', .5], ['C6', .75]], 160, 'sine', .09); fx.burst(DOOR.x, DOOR.y - 20, 30, ['#ffd0e0', '#bfe0ff', '#ffffff'], 260, 150, 6);
        setTimeout(() => fin.start(ctx, greeting('babyparty'), [t('babyparty.line')], MEL.birthday), 1200); } } },
  draw(g, ctx){ const dt = 1/60;
    if(moved && BG.complete) g.drawImage(BG, ST.px, ST.py, ST.pw, ST.ph);
    for(const q of gates){ for(let y = TOP - 80; y < q.c - q.gap/2; y += 52) cloud(g, q.x + Math.sin(y)*6, y, 30); for(let y = BOT + 80; y > q.c + q.gap/2; y -= 52) cloud(g, q.x + Math.sin(y)*6, y, 30); }
    if(IMG.complete){ g.save(); g.translate(s.x, s.y); g.rotate(s.rot); const sy = s.flap > 0 ? 1 - .08*Math.sin(s.flap*40) : 1; g.scale(s.sc, s.sc*sy); g.drawImage(IMG, ST.x - ST.cx, ST.y - ST.cy, ST.w, ST.h); g.restore(); }
    fx.draw(g);
    if(!fin.on && phase !== 'ready') hud2(g, '☁️ ' + passed + '/' + GOAL, '🏠', 846);
    if(!fin.on && (phase === 'ready' || (phase === 'intro'))) hint(g, t('babyparty.hint'), tt, 600, 99);
    fin.draw(g, dt, 'rgba(90,120,170,', .18); } };
startCard(scene);
window.__bp = { get phase(){ return phase; }, get passed(){ return passed; }, get s(){ return s; }, get gates(){ return gates; } };
