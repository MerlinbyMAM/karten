// Entschuldigung: „Herz kleben“ – das gedruckte Herz ist in Scherben zersprungen. Die Teile an ihren Platz ziehen; sind alle wieder da, schimmern die Bruchlinien golden wie bei der japanischen Kintsugi-Kunst.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'herz', x: 120, y: 320, w: 360, h: 340, cx: 305.6, cy: 464.3, px: 120.5, py: 318.5, pw: 365.5, ph: 341 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const H = 0, HB = OB[0], CX = HB.w*.5, CY = HB.h*.42, w = HB.w, h = HB.h;
const RIM = [[-5, -5], [w*.33, -5], [w*.66, -5], [w + 5, -5], [w + 5, h*.33], [w + 5, h*.66], [w + 5, h + 5], [w*.66, h + 5], [w*.33, h + 5], [-5, h + 5], [-5, h*.66], [-5, h*.33]];
const CUTS = [0, 2, 4, 6, 8, 10], JAG = CUTS.map((k, i) => { const [rx, ry] = RIM[k], mx = (CX + rx)/2, my = (CY + ry)/2, dx = rx - CX, dy = ry - CY, L = Math.hypot(dx, dy), s = (i % 2 ? 1 : -1)*22; return [mx - dy/L*s, my + dx/L*s]; });
let fx, fin, tt, phase, S, held, done, gold, goldC;
const SH = CUTS.map((a, i) => { const z = CUTS[(i + 1) % CUTS.length] || 12, p = [[CX, CY], JAG[i]]; for(let k = a; k <= (z === 0 ? 12 : z); k++) p.push(RIM[k % 12]); p.push(JAG[(i + 1) % CUTS.length]);
  const cx = p.reduce((s, q) => s + q[0], 0)/p.length, cy = p.reduce((s, q) => s + q[1], 0)/p.length; return { p, cx, cy }; });
function goldCanvas(){ const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'); q.strokeStyle = '#e8b84a'; q.lineWidth = 4; q.lineJoin = q.lineCap = 'round';
  CUTS.forEach((k, i) => { q.beginPath(); q.moveTo(CX, CY); q.lineTo(JAG[i][0], JAG[i][1]); q.lineTo(RIM[k][0], RIM[k][1]); q.stroke(); }); q.globalCompositeOperation = 'destination-in'; q.drawImage(IMG[H].spr, 0, 0, w, h); return c; }
const scene = {
  title: t('entschuldigung.title'), subtitle: t('entschuldigung.sub'), emoji: '💔', accent: '#ffc0c8', button: '#a83a4a', bg: '#2e2226',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ const SPOTS = [[90, 330], [510, 330], [80, 720], [520, 720], [180, 790], [420, 790]].sort(() => Math.random() - .5);
    S = SH.map((s, i) => ({ ...s, x: SPOTS[i][0], y: SPOTS[i][1], r: (Math.random() - .5)*1.2, hx: HB.x + s.cx, hy: HB.y + s.cy, ok: false })); phase = 'ready'; held = null; done = false; gold = 0; goldC = null; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(done) return; phase = 'play'; let bi = null, bd = 80; for(const s of S){ if(s.ok) continue; const d = Math.hypot(s.x - x, s.y - y); if(d < bd){ bd = d; bi = s; } } if(bi){ held = bi; held.dx = bi.x - x; held.dy = bi.y - y; S.splice(S.indexOf(bi), 1); S.push(bi); ctx.tone(440, 0, .06, 'triangle', .04); } },
  onDrag(x, y){ if(held){ held.x = x + held.dx; held.y = y + held.dy; held.r *= .9; } },
  onRelease(ctx){ if(!held) return; const s = held; held = null; if(Math.hypot(s.x - s.hx, s.y - s.hy) < 40){ s.ok = true; s.x = s.hx; s.y = s.hy; s.r = 0; fx.sparkle(s.x, s.y, 8); ctx.tone(660 + S.filter(q => q.ok).length*60, 0, .15, 'triangle', .06);
      if(S.every(q => q.ok)){ done = true; ctx.melody([['E5', .5], ['G5', .5], ['B5', .5], ['E6', 1.5]], 90, 'sine', .08); setTimeout(() => fin.start(ctx, greeting('entschuldigung'), [t('entschuldigung.line')], null), 2600); } } },
  update(dt){ tt += dt; fx.update(dt); if(done) gold = Math.min(1, gold + dt*.6); },
  shard(g, s){ const img = IMG[H].spr; if(!img.complete) return; g.save(); g.translate(s.x, s.y); g.rotate(s.r); g.translate(-s.cx, -s.cy);
    if(!s.ok){ g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 10; } g.beginPath(); s.p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.save(); g.clip(); g.drawImage(img, 0, 0, HB.w, HB.h); g.restore();
    g.restore(); },
  draw(g, ctx){ const dt = 1/60;
    hole(g, H);
    if(!done && IMG[H].spr.complete){ g.save(); g.globalAlpha = .12; g.drawImage(IMG[H].spr, HB.x, HB.y, w, h); g.restore(); }
    for(const s of S) if(s.ok) this.shard(g, s); for(const s of S) if(!s.ok) this.shard(g, s);
    if(gold > 0){ if(!goldC) goldC = goldCanvas(); g.save(); g.globalAlpha = gold; g.shadowColor = '#ffe08a'; g.shadowBlur = 14*gold; g.drawImage(goldC, HB.x, HB.y, w, h); g.restore(); }
    fx.draw(g);
    if(!fin.on && phase === 'ready') hint(g, t('entschuldigung.hint'), tt, 470, 99);
    fin.draw(g, dt, 'rgba(60,40,45,', .15); } };
startCard(scene);
window.__so = { get S(){ return S; }, get done(){ return done; } };
