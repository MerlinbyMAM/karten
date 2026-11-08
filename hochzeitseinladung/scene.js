// Hochzeitseinladung: „Vorhang auf!“ Ein seidiger Vorhang verdeckt das gedruckte Motiv. Mit dem Finger zur Seite ziehen – dahinter funkeln die Ringe, Blütenblätter regnen, und die Einladung mit Datum und Ort erscheint.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, greeting, hint, MEL } from '../core/kit.js';
const Q = new URLSearchParams(location.search), WANN = (Q.get('wann') || '').trim(), WO = (Q.get('wo') || '').trim(), R = { x: 292, y: 442 }, TOP = 130;
let fx, fin, tt, phase, open, held, lx, petals, done;
const scene = {
  title: t('hochzeitseinladung.title'), subtitle: t('hochzeitseinladung.sub'), emoji: '💍', accent: '#f3d9c0', button: '#8a6a4a', bg: '#2e2620',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ phase = 'ready'; open = 0; held = false; petals = []; done = 0; tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase !== 'end'){ held = true; lx = x; phase = 'open'; } },
  onDrag(x, y, ctx){ if(!held || phase !== 'open') return; open = Math.min(1, open + Math.abs(x - lx)/520); lx = x; if(Math.random() < .2) ctx.noise(0, .1, .02, 4000); if(open >= .85) this.reveal(ctx); },
  onRelease(){ held = false; },
  reveal(ctx){ phase = 'end'; held = false; for(let i = 0; i < 70; i++) petals.push({ x: Math.random()*600, y: -Math.random()*500, v: 40 + Math.random()*60, r: Math.random()*6, s: 6 + Math.random()*6, c: ['#f8c8d0', '#fbe0e4', '#f0b0bc', '#ffffff'][i % 4] });
    ctx.tone(784, 0, 1.5, 'sine', .06); ctx.tone(988, .2, 1.4, 'sine', .05); ctx.tone(1175, .4, 1.4, 'sine', .04); fx.sparkle(R.x, R.y, 30);
    const info = [WANN && t('hochzeitseinladung.wann', { w: WANN }), WO && t('hochzeitseinladung.wo', { w: WO })].filter(Boolean);
    setTimeout(() => fin.start(ctx, greeting('hochzeitseinladung'), info.length ? info : [t('hochzeitseinladung.line')], MEL.soft), 2600); },
  update(dt){ tt += dt; fx.update(dt); if(phase === 'end') done = Math.min(1, done + dt*.9); else if(!held) open = Math.max(0, open - dt*.15);
    for(const p of petals){ p.y += p.v*dt; p.x += Math.sin(tt*2 + p.r)*30*dt; p.r += dt*2; } },
  curtain(g, side, k){ const w = 300*(1 - k), x0 = side < 0 ? 0 : 600 - w; if(w < 2) return; g.save();
    const gr = g.createLinearGradient(x0, 0, x0 + w, 0); for(let i = 0; i <= 8; i++){ gr.addColorStop(i/8, i % 2 ? '#f6e6dc' : '#e8cfc2'); } g.fillStyle = gr; g.fillRect(x0, TOP, w, 900 - TOP);
    g.fillStyle = 'rgba(180,140,90,.9)'; g.fillRect(x0, TOP, w, 10); g.strokeStyle = 'rgba(200,160,100,.8)'; g.lineWidth = 3; const ex = side < 0 ? x0 + w : x0; g.beginPath(); g.moveTo(ex, TOP); g.lineTo(ex, 900); g.stroke();
    g.fillStyle = '#c8a060'; g.beginPath(); g.arc(side < 0 ? x0 + w - 18 : x0 + 18, 520, 10, 0, 7); g.fill(); g.restore(); },
  draw(g, ctx){ const dt = 1/60; const k = phase === 'end' ? Math.min(1, open + done) : open;
    if(phase === 'end'){ const gl = g.createRadialGradient(R.x, R.y, 10, R.x, R.y, 120); gl.addColorStop(0, `rgba(255,240,200,${.5*done})`); gl.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gl; g.beginPath(); g.arc(R.x, R.y, 120, 0, 7); g.fill(); }
    this.curtain(g, -1, k); this.curtain(g, 1, k);
    for(const p of petals){ if(p.y < 0 || p.y > 900) continue; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, p.s, p.s*.55, 0, 0, 7); g.fill(); g.restore(); }
    fx.draw(g);
    if(!fin.on && phase !== 'end') hint(g, t('hochzeitseinladung.hint'), phase === 'ready' ? 1 : 99, 470, 98);
    fin.draw(g, dt, 'rgba(60,45,35,', .25); } };
startCard(scene);
window.__he = { get phase(){ return phase; }, get open(){ return open; } };
