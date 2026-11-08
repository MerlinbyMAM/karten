// Abitur: „Hüte hoch!“ – die fünf gedruckten Abi-Hüte lösen sich nacheinander vom Himmel und fallen.
// Antippen wirft einen Hut wieder hoch (er dreht sich). Fällt ein Hut auf den gedruckten Tisch, ist er gelandet;
// nach drei Landungen ist Schluss. Am Ende schweben alle zurück an ihren Platz. Optional ?schnitt=1,7 im Gruß.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, rnd, MEL } from '../core/kit.js';

const HAT = [
  { n: 'hut1', x: 70, y: 276, w: 152, h: 158, cx: 149.6, cy: 345.4, px: 69, py: 274, pw: 154, ph: 162.5 },
  { n: 'hut2', x: 378, y: 280, w: 152, h: 154, cx: 448.6, cy: 348.2, px: 377, py: 277.5, pw: 156.5, ph: 158 },
  { n: 'hut3', x: 208, y: 366, w: 186, h: 126, cx: 298, cy: 422, px: 207, py: 364.5, pw: 187.5, ph: 128.5 },
  { n: 'hut4', x: 58, y: 446, w: 140, h: 182, cx: 132.8, cy: 528, px: 56, py: 443.5, pw: 143.5, ph: 187 },
  { n: 'hut5', x: 390, y: 448, w: 160, h: 160, cx: 456.6, cy: 522.7, px: 387.5, py: 448.5, pw: 162.5, ph: 163 } ];
const IMG = HAT.map(h => { const a = new Image(); a.src = h.n + '.png'; const b = new Image(); b.src = h.n + '_platz.png'; return { spr: a, bg: b }; });
const FLOOR = 720, G = 520;
const NOTE = (new URLSearchParams(location.search).get('schnitt') || '').trim().slice(0, 8);

let S, fx, fin, tt, over, tosses, drops, rel, started, endT;

const scene = {
  title: t('abitur.title'), subtitle: t('abitur.sub'), emoji: '🎓',
  accent: '#f3d37a', button: '#2a3a8a', bg: '#141c3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = HAT.map(h => ({ st: 'home', x: h.cx, y: h.cy, vx: 0, vy: 0, r: 0, vr: 0 })); tt = 0; over = false; tosses = 0; drops = 0; rel = 1; started = false; endT = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return; started = true;
    let bi = -1, bd = 90; S.forEach((s, i) => { if(s.st !== 'fly') return; const d = Math.hypot(x - s.x, y - s.y); if(d < bd){ bd = d; bi = i; } });
    if(bi < 0) return;
    const s = S[bi]; s.vy = -rnd(520, 640); s.vx = (s.x - x)*2.2 + rnd(-40, 40) + (s.x < 120 ? 80 : s.x > 480 ? -80 : 0); s.vr = rnd(-7, 7); tosses++;
    fx.pop(s.x, s.y - 50, t('abitur.toss'), '#f3d37a', 26); fx.burst(s.x, s.y, 8, ['#f3d37a', '#fff'], 160, 200, 4); ctx.tone(500 + Math.min(tosses, 30)*20, 0, .08, 'triangle', .08);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(!over){ rel -= dt; const home = S.filter(s => s.st === 'home');
      if(rel <= 0 && home.length && (started || S.every(s => s.st === 'home'))){ const s = home[Math.floor(Math.random()*home.length)]; s.st = 'fly'; s.vy = -80; s.vx = rnd(-40, 40); s.vr = rnd(-2, 2); rel = Math.max(1.2, 3.2 - tosses*.06); } }
    S.forEach((s, i) => {
      if(s.st === 'fly'){ s.vy += G*dt*(1 + Math.min(tosses, 40)*.012); s.x += s.vx*dt; s.y += s.vy*dt; s.r += s.vr*dt;
        if(s.x < 50){ s.x = 50; s.vx = Math.abs(s.vx); } if(s.x > 550){ s.x = 550; s.vx = -Math.abs(s.vx); } if(s.y < 290){ s.y = 290; s.vy = Math.abs(s.vy)*.3; }
        if(s.y > FLOOR){ s.st = 'down'; s.y = FLOOR; drops++; fx.pop(s.x, FLOOR - 50, t('abitur.drop'), '#fff', 26); ctx.noise(0, .1, .08, 600); fx.shake(3);
          if(drops >= 3) this.finish(ctx); } }
      if(s.st === 'back'){ const h = HAT[i]; s.x += (h.cx - s.x)*Math.min(1, dt*4); s.y += (h.cy - s.y)*Math.min(1, dt*4); s.r *= .9; if(Math.hypot(h.cx - s.x, h.cy - s.y) < 1.5 && Math.abs(s.r) < .01) s.st = 'home'; }
    });
  },
  finish(ctx){
    over = true; const b = best('abitur', tosses);
    setTimeout(() => S.forEach(s => s.st = 'back'), 600);
    fx.burst(300, 400, 50, ['#f3d37a', '#ffffff', '#8fb3ff'], 400, 320, 8);
    const sub = [NOTE ? t('abitur.note', { n: NOTE }) : '', t('abitur.score', { n: tosses }) + (b.isNew ? '  ★' : '')].filter(Boolean);
    setTimeout(() => fin.start(ctx, greeting('abitur'), sub, MEL.fanfare), 1200);
  },
  draw(g, ctx){
    const dt = 1/60;
    S.forEach((s, i) => { const h = HAT[i]; if(s.st !== 'home' && IMG[i].bg.complete) g.drawImage(IMG[i].bg, h.px, h.py, h.pw, h.ph); });
    fx.applyShake(g);
    S.forEach((s, i) => { if(s.st === 'home') return; const h = HAT[i]; if(!IMG[i].spr.complete) return;
      g.save(); g.translate(s.x, s.y); g.rotate(s.r); const sc = s.st === 'down' ? .85 : 1; g.scale(sc, sc); g.drawImage(IMG[i].spr, h.x - h.cx, h.y - h.cy, h.w, h.h); g.restore(); });
    fx.draw(g); g.restore();
    if(!fin.on) hud2(g, '🎓 ' + tosses, '❤ '.repeat(Math.max(0, 3 - drops)) || '–', 846);
    if(!fin.on && !started) hint(g, t('abitur.hint'), tt, 560, 9);
    fin.draw(g, dt, 'rgba(15,20,50,', .25);
  }
};
startCard(scene);
window.__ab = { S: () => S, get tosses(){ return tosses; }, get over(){ return over; } };
