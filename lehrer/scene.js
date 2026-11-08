// Danke Lehrer/in: „Tafel wischen“. Die gedruckte Tafel ist voller Kreide. Den gedruckten Schwamm nehmen und sauber wischen –
// dann schreibt sich eine Danke-Botschaft in Kreide (mit Namen, z. B. ?name=Frau%20Müller).
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'schwamm', x: 70, y: 554, w: 102, h: 48, cx: 117.7, cy: 580.2, px: 71, py: 556, pw: 98, ph: 48.5 } ];
const SP = OB[0], SPR = new Image(), SBG = new Image(), CLEAN = new Image(); SPR.src = 'schwamm.png'; SBG.src = 'schwamm_platz.png'; CLEAN.src = 'tafel_sauber.jpg';
const BD = { x0: 54, y0: 272, x1: 548, y1: 586 }, WY1 = 556, GX = 26, GY = 14;
const q = new URLSearchParams(location.search), NM = (q.get('name') || '').trim().slice(0, 24);
let mask, mg, cells, cleaned, sp, held, phase, fx, fin, tt, write, last;
const scene = {
  title: t('lehrer.title'), subtitle: t('lehrer.sub'), emoji: '🧽', accent: '#ffe08a', button: '#2a5a3a', bg: '#2a4a3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); mask = document.createElement('canvas'); mask.width = BD.x1 - BD.x0; mask.height = WY1 - BD.y0; mg = mask.getContext('2d'); this.restart(ctx); },
  restart(ctx){ mg.clearRect(0, 0, mask.width, mask.height); cells = new Set(); cleaned = 0; sp = { x: SP.cx, y: SP.cy, moved: false }; held = false; phase = 'wipe'; tt = 0; write = 0; last = null; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase !== 'wipe') return; if(Math.abs(x - sp.x) < 70 && Math.abs(y - sp.y) < 45 || sp.moved){ held = true; sp.moved = true; sp.ox = sp.moved && Math.abs(x - sp.x) > 70 ? 0 : sp.x - x; sp.oy = sp.moved && Math.abs(y - sp.y) > 45 ? 0 : sp.y - y; last = null; this.move(x, y, ctx); } },
  onDrag(x, y, ctx){ if(held) this.move(x, y, ctx); },
  onRelease(){ held = false; last = null; },
  move(x, y, ctx){ sp.x = x + sp.ox; sp.y = y + sp.oy; const px = sp.x - BD.x0, py = sp.y - BD.y0;
    mg.save(); mg.lineCap = 'round'; mg.lineJoin = 'round'; mg.strokeStyle = '#fff'; mg.fillStyle = '#fff'; mg.lineWidth = 64; mg.beginPath(); if(last){ mg.moveTo(last[0], last[1]); mg.lineTo(px, py); mg.stroke(); } else { mg.arc(px, py, 32, 0, 7); mg.fill(); } mg.restore(); last = [px, py];
    const cw = mask.width/GX, ch = mask.height/GY; for(let i = -1; i <= 1; i++) for(let j = -1; j <= 1; j++){ const cx = Math.floor(px/cw) + i, cy = Math.floor(py/ch) + j; if(cx >= 0 && cy >= 0 && cx < GX && cy < GY) cells.add(cx + cy*GX); }
    const c = cells.size/(GX*GY); if(Math.floor(c*10) > Math.floor(cleaned*10)) ctx.noise(0, .12, .05, 2500); cleaned = c;
    if(cleaned > .9 && phase === 'wipe'){ phase = 'write'; held = false; mg.fillStyle = '#fff'; mg.fillRect(0, 0, mask.width, mask.height); ctx.tone(784, 0, .2, 'triangle', .07); } },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'write'){ write += dt*.55; if(Math.random() < .3) ctx.noise(0, .04, .03, 4000); if(write >= 1){ phase = 'done'; ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 180, 'triangle', .09);
      setTimeout(() => fin.start(ctx, '', [], MEL.birthday), 1800); } } },
  draw(g, ctx){ const dt = 1/60;
    if(CLEAN.complete && cleaned > 0){ const tmp = scene._tmp || (scene._tmp = document.createElement('canvas')); tmp.width = mask.width; tmp.height = mask.height; const tg = tmp.getContext('2d');
      tg.clearRect(0, 0, tmp.width, tmp.height); tg.drawImage(mask, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.drawImage(CLEAN, 0, 0, CLEAN.width, CLEAN.height*(WY1 - BD.y0)/(BD.y1 - BD.y0), 0, 0, tmp.width, tmp.height); tg.globalCompositeOperation = 'source-over';
      g.drawImage(tmp, BD.x0, BD.y0); }
    if(phase === 'write' || phase === 'done'){ const lines = [t('lehrer.k1'), NM ? t('lehrer.k2n', { name: NM }) : t('lehrer.k2'), t('lehrer.k3')], total = lines.join('').length; let n = Math.floor(Math.min(1, write)*total);
      g.save(); g.fillStyle = 'rgba(245,245,240,.92)'; g.shadowColor = 'rgba(255,255,255,.5)'; g.shadowBlur = 3; g.textAlign = 'center'; g.font = 'bold 40px "Comic Sans MS","Segoe Print","Bradley Hand",cursive';
      lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, n)); n -= l.length; g.fillText(s, 301, 340 + i*62); }); g.restore(); }
    if(sp.moved && SBG.complete) g.drawImage(SBG, SP.px, SP.py, SP.pw, SP.ph);
    if(SPR.complete){ g.save(); g.translate(sp.x, sp.y); if(held){ g.rotate(Math.sin(tt*20)*.05); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 10; g.shadowOffsetY = 6; } g.drawImage(SPR, SP.x - SP.cx, SP.y - SP.cy, SP.w, SP.h); g.restore(); }
    if(held && Math.random() < .5) fx.burst(sp.x + (Math.random() - .5)*50, sp.y + 10, 1, ['#e8e8e0'], 40, 200, 2);
    fx.draw(g);
    if(!fin.on && phase === 'wipe'){ g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(150, 614, 300, 12); g.fillStyle = "#ffe08a"; g.fillRect(150, 614, 300*Math.min(1, cleaned/.9), 12); g.restore(); }
    if(!fin.on && !sp.moved) hint(g, t('lehrer.hint'), tt, 650, 99);
    fin.draw(g, dt, 'rgba(20,40,30,', .1); } };
startCard(scene);
window.__lh = { SP, BD, get cleaned(){ return cleaned; }, get phase(){ return phase; } };
