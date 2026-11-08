// Partyturm (Geburtstag lustig): Ein Geschenk pendelt am Seil über dem Podest. Tippen lässt es fallen.
// Was übersteht, wird abgeschnitten und purzelt weg – der Turm wird schmaler. Genau getroffen = „Perfekt!“
// und das Geschenk wächst wieder. 12 Etagen schaffen → die Geburtstagstorte landet obenauf, Finale mit Namen.
// Waschbär und Dackel auf der Karte kommentieren das Geschehen.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud, best, peekBest, greeting, hint, shade, rnd, MEL } from '../core/kit.js';

const GOAL = 12, BH = 30, BASE_Y = 742, PED = [172, 472];      // Podest-Oberkante auf dem Kartenbild (600 × 900)
const COLS = ['#ef5b5b', '#2bb3a3', '#f6c431', '#8a63d2', '#ff8a3d', '#3b8fe0', '#e85d9c', '#5cbf5c'];
const RIB = ['#ffe9a8', '#ffffff', '#c0392b', '#ffd34d'];
let stack, cur, falling, chips, fx, fin, floors, over, phase, speed, talk, topper, tt, perfectRun;

function newBox(){
  const last = stack[stack.length - 1];
  return { x: 300, y: 390, w: last ? last.w : 240, col: COLS[(stack.length) % COLS.length], rib: RIB[stack.length % RIB.length], ph: rnd(0, 6.28) };
}
function topY(){ return BASE_Y - stack.length*BH; }
function drawGift(g, x, y, w, col, rib, bow, rot = 0){
  g.save(); g.translate(x, y + BH/2); g.rotate(rot);
  const gr = g.createLinearGradient(0, -BH/2, 0, BH/2); gr.addColorStop(0, shade(col, 30)); gr.addColorStop(1, shade(col, -35));
  g.fillStyle = gr; g.beginPath(); g.roundRect(-w/2, -BH/2, w, BH, 5); g.fill();
  g.strokeStyle = 'rgba(40,20,30,.35)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = rib; g.fillRect(-6, -BH/2, 12, BH); g.fillRect(-w/2, -4, w, 8);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-w/2 + 6, -BH/2 + 4, Math.max(0, w - 12), 4);
  if(bow){ g.fillStyle = rib; g.beginPath(); g.ellipse(-11, -BH/2 - 6, 11, 7, -.5, 0, 7); g.ellipse(11, -BH/2 - 6, 11, 7, .5, 0, 7); g.fill(); g.beginPath(); g.arc(0, -BH/2 - 5, 5, 0, 7); g.fill(); }
  g.restore();
}
function drawCake(g, x, y){
  g.save(); g.translate(x, y);
  g.fillStyle = '#fff3e0'; g.beginPath(); g.roundRect(-60, -48, 120, 48, 10); g.fill();
  g.fillStyle = '#ff7aa8'; g.beginPath(); g.moveTo(-60, -40); for(let i=0;i<=12;i++) g.quadraticCurveTo(-55 + i*10, -26 + (i % 2)*8, -50 + i*10, -40); g.lineTo(60, -48); g.lineTo(-60, -48); g.fill();
  for(const cx of [-30, 0, 30]){ g.fillStyle = '#7ad3ff'; g.fillRect(cx - 4, -78, 8, 30); const f = 1 + Math.sin(tt*18 + cx)*.15; g.fillStyle = '#ffd34d'; g.beginPath(); g.ellipse(cx, -86, 6*f, 11*f, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, -84, 2.5, 5, 0, 0, 7); g.fill(); }
  g.restore();
}
function say(who, key){ talk = { who, txt: t('partyturm.' + key), life: 1.6 }; }
function bubble(g, x, y, txt){
  g.save(); g.font = 'bold 24px Georgia'; const w = g.measureText(txt).width + 26;
  g.fillStyle = '#fff'; g.strokeStyle = '#3a2440'; g.lineWidth = 3; g.beginPath(); g.roundRect(x - w/2, y - 24, w, 44, 14); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - 8, y + 19); g.lineTo(x + 2, y + 34); g.lineTo(x + 10, y + 19); g.fill();
  g.fillStyle = '#3a2440'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y - 1); g.restore();
}

const scene = {
  title: t('partyturm.title'), subtitle: t('partyturm.sub'), emoji: '🎁',
  accent: '#ffd34d', button: '#e85d9c', bg: '#7a3b62',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){
    stack = []; falling = null; chips = []; floors = 0; over = false; phase = 'swing'; speed = 1.5; talk = null; topper = null; tt = 0; perfectRun = 0;
    fx.clear(); fin.stop(); cur = newBox();
  },
  onTap(x, y, ctx){
    if(phase !== 'swing' || over) return;
    falling = { x: cur.x, y: cur.y, w: cur.w, col: cur.col, rib: cur.rib, vy: 0 };
    phase = 'drop'; ctx.tone(660, 0, .08, 'sine', .06);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); if(talk){ talk.life -= dt; if(talk.life <= 0) talk = null; }
    const ty = topY();
    if(phase === 'swing'){
      cur.ph += dt*speed;
      cur.x = 300 + Math.sin(cur.ph)*Math.min(210, 150 + floors*6); window.__ptx = cur.x; window.__ptTop = stack.length ? stack[stack.length-1].x : 322;
      cur.y = Math.min(420, ty - 100) - BH;
    }
    if(phase === 'drop' && falling){
      falling.vy += 2200*dt; falling.y += falling.vy*dt;
      const land = ty - BH;
      if(falling.y >= land){
        falling.y = land;
        const below = stack.length ? stack[stack.length - 1] : { x: (PED[0] + PED[1])/2, w: PED[1] - PED[0] };
        const l = Math.max(falling.x - falling.w/2, below.x - below.w/2), r = Math.min(falling.x + falling.w/2, below.x + below.w/2);
        const ov = r - l, d = falling.x - below.x;
        if(ov <= 6){                                        // daneben – Geschenk fällt, Spiel vorbei
          chips.push({ x: falling.x, y: falling.y, w: falling.w, col: falling.col, rib: falling.rib, vx: Math.sign(d || 1)*160, vy: -200, rot: 0, vr: Math.sign(d || 1)*5 });
          falling = null; over = true; phase = 'over'; say('both', 'oops'); fx.shake(10);
          ctx.noise(0, .4, .35, 300); ctx.melody(MEL.oops, 120, 'square', .08);
          setTimeout(() => this.finish(ctx, false), 1300);
          return;
        }
        let nb;
        if(Math.abs(d) < 7 && stack.length){                // perfekt
          perfectRun++; nb = { x: below.x, w: Math.min(240, falling.w + (perfectRun > 1 ? 10 : 4)), col: falling.col, rib: falling.rib };
          fx.pop(below.x, land - 30, t('partyturm.perfect'), '#ffd34d', 40); fx.sparkle(below.x, land, 18);
          ctx.tone(1047, 0, .12, 'triangle', .1); ctx.tone(1568, .08, .2, 'triangle', .08); say('dog', 'woof');
        } else {
          perfectRun = 0; nb = { x: (l + r)/2, w: ov, col: falling.col, rib: falling.rib };
          const cutW = falling.w - ov;
          if(cutW > 2){ const cx = d > 0 ? r + cutW/2 : l - cutW/2; chips.push({ x: cx, y: land, w: cutW, col: falling.col, rib: falling.rib, vx: Math.sign(d)*120, vy: -80, rot: 0, vr: Math.sign(d)*4 }); }
          ctx.tone(330 + stack.length*40, 0, .1, 'square', .06); ctx.noise(0, .08, .15, 1500);
          if(cutW > 40) say('raccoon', 'giggle');
        }
        stack.push(nb); floors = stack.length; falling = null; fx.burst(nb.x, land + BH, 8, [nb.col, '#fff'], 160, 600, 6);
        speed = 1.5 + floors*.16;
        if(floors >= GOAL){ phase = 'topper'; topper = { y: 150, vy: 0 }; ctx.tone(784, 0, .2); return; }
        cur = newBox(); phase = 'swing';
      }
    }
    if(phase === 'topper' && topper){
      topper.vy += 1600*dt; topper.y += topper.vy*dt;
      if(topper.y >= ty){ topper.y = ty; phase = 'won'; fx.burst(300, ty - 40, 40, undefined, 380); fx.shake(6); setTimeout(() => this.finish(ctx, true), 600); }
    }
    for(const c of chips){ c.vy += 1800*dt; c.x += c.vx*dt; c.y += c.vy*dt; c.rot += c.vr*dt; }
    chips = chips.filter(c => c.y < 1000);
  },
  finish(ctx, won){
    const b = best('partyturm', floors);
    const sub = [t('partyturm.floors', { n: floors }) + (b.isNew ? '  ★' : ''), t('partyturm.best', { n: b.best })];
    fin.start(ctx, greeting('partyturm'), sub, won ? MEL.birthday : MEL.fanfare);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(!fin.on) hud(g, ['🎁 ' + floors + ' / ' + GOAL, '🏆 ' + (peekBest('partyturm') ?? '–')], 262);
    fx.applyShake(g);
    // Turm mit leichtem Wackeln, je höher desto mehr
    const sway = Math.sin(tt*2.2)*Math.min(4, floors*.35);
    stack.forEach((b, i) => { const k = (i + 1)/Math.max(1, stack.length); drawGift(g, b.x + sway*k, BASE_Y - (i + 1)*BH, b.w, b.col, b.rib, i === stack.length - 1 && phase !== 'won' && phase !== 'topper'); });
    if(topper) drawCake(g, 300 + sway, topper.y);
    for(const c of chips) drawGift(g, c.x, c.y, c.w, c.col, c.rib, false, c.rot);
    if(phase === 'swing' && !over){
      // zwei Luftballons tragen das Geschenk
      for(const [dx, col] of [[-16, '#ef5b5b'], [16, '#3b8fe0']]){
        const bx = cur.x + dx + Math.sin(tt*3 + dx)*3, byy = cur.y - 58;
        g.strokeStyle = 'rgba(60,40,40,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cur.x, cur.y - 10); g.lineTo(bx, byy + 20); g.stroke();
        const gr = g.createRadialGradient(bx - 6, byy - 8, 2, bx, byy, 22); gr.addColorStop(0, '#fff'); gr.addColorStop(.25, col); gr.addColorStop(1, shade(col, -50));
        g.fillStyle = gr; g.beginPath(); g.ellipse(bx, byy, 17, 21, 0, 0, 7); g.fill();
      }
      drawGift(g, cur.x, cur.y, cur.w, cur.col, cur.rib, true);
      // Ziel-Hilfe: Schatten auf dem Turm
      g.fillStyle = 'rgba(60,20,60,.18)'; g.fillRect(cur.x - cur.w/2, topY() - 6, cur.w, 6);
    }
    if(falling) drawGift(g, falling.x, falling.y, falling.w, falling.col, falling.rib, true);
    fx.draw(g);
    g.restore();
    if(talk){ const a = Math.min(1, talk.life*2); g.globalAlpha = a;
      if(talk.who !== 'dog') bubble(g, 110, 560, talk.txt);
      if(talk.who !== 'raccoon') bubble(g, 500, 545, talk.who === 'both' ? t('partyturm.oops2') : talk.txt);
      g.globalAlpha = 1; }
    if(!fin.on && floors === 0) hint(g, t('partyturm.hint'), tt, 470, 4);
    fin.draw(g, dt);
  }
};
startCard(scene);
