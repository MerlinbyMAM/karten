// Geburtstag lustig: „Hoch sollst du leben!“ – der gedruckte Geschenketurm.
// Beim Start schweben die sechs gedruckten Pakete an Luftballons davon. Dann kommen sie einzeln zurück, pendeln über dem Tisch;
// Tippen lässt das Paket fallen. Genau auf seinem Platz gelandet = „Perfekt!“ (rastet ein). Daneben bleibt es schief liegen,
// zu weit daneben fällt es herunter und kommt nochmal. Ist der Turm komplett, steht die Karte wieder wie gedruckt da.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, rnd, MEL } from '../core/kit.js';

const BOX = [
  { n: 'paket1', x: 172, y: 618, w: 262, h: 134, cx: 302.2, cy: 686.6, px: 173.5, py: 619.5, pw: 257.5, ph: 132.5 },
  { n: 'paket2', x: 182, y: 548, w: 241, h: 106, cx: 302.6, cy: 605.9, px: 184, py: 548, pw: 237, ph: 108.5 },
  { n: 'paket3', x: 190, y: 476, w: 224, h: 108, cx: 302.2, cy: 531.8, px: 191.5, py: 476, pw: 221, ph: 110 },
  { n: 'paket4', x: 199, y: 406, w: 207, h: 103, cx: 301.9, cy: 458.7, px: 200.5, py: 407, pw: 203.5, ph: 102.5 },
  { n: 'paket5', x: 207, y: 336, w: 191, h: 98, cx: 302.6, cy: 387, px: 209.5, py: 337, pw: 186.5, ph: 99 },
  { n: 'paket6', x: 217, y: 226, w: 172, h: 133, cx: 303.5, cy: 298.1, px: 219.5, py: 225, pw: 167.5, ph: 136.5 } ];
const IMG = BOX.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const BAL = ['#ff5b7a', '#ffcf3a', '#4aa8ff', '#5cd36b', '#ff9a3c', '#c77dff'];

let st, k, sw, fall, pts, perfect, tries, fx, fin, tt, over, intro;
const ok = i => IMG[i].spr.complete && IMG[i].bg.complete;
function drawBox(g, i, x, y, rot = 0, sc = 1){
  const b = BOX[i]; if(!ok(i)) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore();
}
function balloons(g, x, y, i, swingA){
  for(const [dx, c] of [[-26, BAL[i % 6]], [26, BAL[(i + 2) % 6]]]){
    const bx = x + dx + Math.sin(tt*2 + dx)*4, by = y - 120 + Math.cos(tt*2.3 + dx)*4;
    g.strokeStyle = 'rgba(80,80,80,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x + dx*.5, y); g.quadraticCurveTo(bx + swingA*20, (y + by)/2, bx, by + 30); g.stroke();
    const gr = g.createRadialGradient(bx - 8, by - 10, 3, bx, by, 32); gr.addColorStop(0, '#ffffffcc'); gr.addColorStop(.3, c); gr.addColorStop(1, c);
    g.fillStyle = gr; g.beginPath(); g.ellipse(bx, by, 24, 30, 0, 0, 7); g.fill();
  }
}
const topY = () => k > 0 ? Math.min(...st.slice(0, k).map((s, i) => BOX[i].cy - BOX[i].h/2)) : 700;

const scene = {
  title: t('partyturm.title'), subtitle: t('partyturm.sub'), emoji: '🎁',
  accent: '#ffe08a', button: '#e2507a', bg: '#1f6f6a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){
    st = BOX.map(() => ({ placed: false, dx: 0, away: 0 })); k = 0; sw = { t: 0 }; fall = null; pts = 0; perfect = 0; tries = 0;
    tt = 0; over = false; intro = 0; fx.clear(); fin.stop();
  },
  onTap(x, y, ctx){
    if(over || intro < 2.4 || fall || k >= BOX.length) return;
    const b = BOX[k], sx = this.swingX();
    fall = { x: sx, y: this.swingY(), vy: 0, dx: sx - b.cx }; tries++; ctx.tone(520, 0, .08, 'triangle', .08);
  },
  swingX(){ const amp = 70 + k*14, sp = 1.6 + k*.22; return BOX[k].cx + Math.sin(sw.t*sp)*amp; },
  swingY(){ return Math.min(topY() - 40, BOX[k].cy - 150) - 0; },
  update(dt, ctx){
    tt += dt; intro += dt; fx.update(dt); sw.t += dt;
    if(intro < 2.4){ st.forEach((s, i) => { s.away = Math.min(1, Math.max(0, (intro - .4 - (BOX.length - 1 - i)*.15)/1.1)); }); return; }
    if(fall){
      const b = BOX[k]; fall.vy += 2400*dt; fall.y += fall.vy*dt;
      if(fall.y >= b.cy){
        const d = Math.abs(fall.dx);
        if(d <= 9){ st[k] = { placed: true, dx: 0, away: 0 }; pts += 3; perfect++; fx.pop(b.cx, b.cy - b.h/2 - 20, t('partyturm.perfect'), '#ffd34d', 36); fx.burst(b.cx, b.cy - b.h/2, 18); ctx.tone(880 + k*80, 0, .18, 'triangle', .1); }
        else if(d < b.w*.32){ st[k] = { placed: true, dx: fall.dx, away: 0 }; pts += 1; fx.pop(b.cx + fall.dx, b.cy - b.h/2 - 20, t(d < 30 ? 'partyturm.giggle' : 'partyturm.oops2'), '#fff', 30); ctx.noise(0, .12, .12, 300); fx.shake(4); }
        else { fx.pop(b.cx + fall.dx, b.cy - 40, t('partyturm.oops'), '#fff', 34); ctx.tone(200, 0, .25, 'sawtooth', .06); fx.shake(6); fall = { ...fall, off: true, vx: Math.sign(fall.dx)*240, vy: -300 }; this.tumble = fall; fall = null; return; }
        fall = null; k++;
        if(k >= BOX.length) this.finish(ctx);
      }
    }
    if(this.tumble){ const f = this.tumble; f.vy += 1800*dt; f.x += f.vx*dt; f.y += f.vy*dt; f.r = (f.r || 0) + dt*5*Math.sign(f.vx); if(f.y > 1000) this.tumble = null; }
  },
  finish(ctx){
    over = true; const b = best('partyturm', pts);
    fx.burst(300, 300, 50, ['#ffd34d', '#ff7aa8', '#7ad3ff', '#9cf27a', '#fff'], 380, 380, 9);
    setTimeout(() => fin.start(ctx, greeting('partyturm'), [t('partyturm.floors', { n: pts }) + (b.isNew ? '  ★' : ''), t('partyturm.best', { n: b.best })], MEL.birthday), 600);
  },
  draw(g, ctx){
    const dt = 1/60;
    // leerer Tisch hinter allen Paketen, die nicht (genau) an ihrem Druckplatz stehen
    st.forEach((s, i) => { const b = BOX[i]; if((!s.placed || s.dx) && (intro > .4 || s.away > 0) && ok(i)) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    fx.applyShake(g);
    // Intro: Pakete schweben an Ballons davon
    if(intro < 2.4) st.forEach((s, i) => { const b = BOX[i], u = s.away, y = b.cy - u*u*900, x = b.cx + Math.sin(u*6 + i)*30*u;
      if(u > 0) balloons(g, x, y - b.h/2, i, 0); drawBox(g, i, x, y, Math.sin(u*5 + i)*.15*u); });
    // platzierte Pakete
    st.forEach((s, i) => { if(s.placed) drawBox(g, i, BOX[i].cx + s.dx, BOX[i].cy); });
    // pendelndes Paket an Ballons
    if(intro >= 2.4 && !over && k < BOX.length){
      const b = BOX[k];
      if(fall) drawBox(g, k, fall.x, fall.y);
      else { const x = this.swingX(), y = this.swingY(), a = Math.cos(sw.t*(1.6 + k*.22))*.08; balloons(g, x, y - b.h/2, k, a); drawBox(g, k, x, y, a);
        g.save(); g.setLineDash([6, 8]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(b.cx, b.cy - b.h/2 - 6); g.lineTo(b.cx, b.cy + b.h/2); g.stroke(); g.restore(); }
    }
    if(this.tumble){ const f = this.tumble; drawBox(g, k, f.x, f.y, f.r || 0); }
    fx.draw(g); g.restore();
    if(!fin.on) hud2(g, '🎁 ' + k + '/' + BOX.length, '⭐ ' + pts);
    if(!fin.on && intro >= 2.4 && tries === 0) hint(g, t('partyturm.hint'), tt, 790, 6);
    fin.draw(g, dt, 'rgba(20,70,66,', .2);
  }
};
startCard(scene);
window.__pt = { BOX, get k(){ return k; }, get pts(){ return pts; }, swingX: () => scene.swingX(), get falling(){ return !!scene.tumble; } };
