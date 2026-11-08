// Hochzeitstag: „Unser Herz“. Die sechs gedruckten Glaslaternen sind am Anfang aus (abgedunkelt).
// Mit dem Finger fährt man das geschnitzte Herz im Baum nach – ein leuchtender Punkt zeigt den Weg.
// Jedes Sechstel des Weges lässt eine Laterne aufleuchten. Ist das Herz geschlossen, erscheinen die Initialen
// (?initialen=A + T) und die Ehejahre (?jahre=10) eingeritzt im hellen Holz des gedruckten Herzens.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

const H = { x: 302, y: 471, sx: 3.75, sy: 4.15 };            // Herz-Umriss (vermessen)
const LAMPS = [[212, 280], [353, 256], [407, 356], [481, 348], [91, 360], [517, 448]];
const q = new URLSearchParams(location.search);
const INIT = (q.get('initialen') || '').trim().slice(0, 12), YEARS = parseInt(q.get('jahre') || '', 10) || 0;

const N = 240, PATH = Array.from({ length: N + 1 }, (_, i) => { const a = i/N*Math.PI*2;
  return { x: H.x + H.sx*16*Math.sin(a)**3, y: H.y - H.sy*(13*Math.cos(a) - 5*Math.cos(2*a) - 2*Math.cos(3*a) - Math.cos(4*a)) }; });

let p, lit, fx, fin, tt, time, over, touching, carve, glow;

const scene = {
  title: t('hochzeitstag.title'), subtitle: t('hochzeitstag.sub'), emoji: '💞',
  accent: '#f3d1a6', button: '#9c3b52', bg: '#5a1f2e',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ p = 0; lit = LAMPS.map(() => 0); tt = 0; time = 0; over = false; touching = false; carve = 0; glow = 0; fx.clear(); fin.stop(); },
  onTap(x, y){ touching = true; this.follow(x, y); },
  onDrag(x, y, ctx){ this.follow(x, y, ctx); },
  onRelease(){ touching = false; },
  follow(x, y, ctx){
    if(over) return;
    // vorwärts entlang des Pfads suchen (max. 1/8 voraus), Finger muss nah am Umriss sein
    let best = -1, bd = 34;
    for(let k = 0; k <= N/8; k++){ const i = Math.min(N, p + k), P = PATH[i], d = Math.hypot(x - P.x, y - P.y); if(d < bd){ bd = d; best = i; } }
    if(best > p){
      const before = Math.floor(p/N*6); p = best;
      const now = Math.min(6, Math.floor(p/N*6));
      for(let j = before; j < now; j++) this.light(j, ctx);
      if(Math.random() < .5) fx.burst(PATH[p].x, PATH[p].y, 1, ['#ffd98a', '#fff3cf'], 40, 30, 3);
      if(p >= N - 8){ for(let j = 0; j < 6; j++) if(!lit[j]) this.light(j, ctx); p = N; this.done(ctx); }
    }
  },
  light(j, ctx){
    const [x, y] = LAMPS[j]; lit[j] = .01; fx.sparkle(x, y, 10); ctx && ctx.tone([523, 587, 659, 784, 880, 1047][j], 0, .6, 'sine', .07);
  },
  done(ctx){
    over = true; touching = false; glow = 1;
    const secs = Math.round(time*10)/10, b = best('hochzeitstag', secs, false);
    ctx.melody([['E5', .5], ['G5', .5], ['C6', 1], ['B5', .5], ['C6', 1.5]], 110, 'sine', .08);
    fx.burst(H.x, H.y, 40, ['#ffd98a', '#ff9fb5', '#ffffff', '#e8577a'], 300, 160, 7);
    const sub = [YEARS ? t('hochzeitstag.years', { n: YEARS }) : '', t('hochzeitstag.score', { s: secs }) + (b.isNew ? '  ★' : '')].filter(Boolean);
    setTimeout(() => fin.start(ctx, greeting('hochzeitstag'), sub, MEL.soft), 2600);
  },
  update(dt){
    tt += dt; fx.update(dt); glow = Math.max(0, glow - dt*.4);
    if(touching && !over) time += dt;
    lit = lit.map(v => v > 0 ? Math.min(1, v + dt*2) : 0);
    if(over) carve = Math.min(1, carve + dt*.7);
  },
  draw(g, ctx){
    const dt = 1/60;
    // Laternen: aus = dunkel und entsättigt, an = warmes Glühen
    LAMPS.forEach(([x, y], j) => {
      const k = lit[j], off = 1 - k;
      if(off > 0){ g.save(); g.beginPath(); g.ellipse(x, y + 4, 25, 34, 0, 0, 7); g.clip();
        g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${.7*off})`; g.fillRect(x - 30, y - 34, 60, 76);
        g.globalCompositeOperation = 'multiply'; const r = g.createRadialGradient(x, y + 8, 2, x, y + 8, 30);
        r.addColorStop(0, `rgba(80,62,58,${off})`); r.addColorStop(1, `rgba(175,155,145,${off})`); g.fillStyle = r; g.fillRect(x - 30, y - 34, 60, 76); g.restore(); }
      if(k > 0){ const f = 1 + Math.sin(tt*9 + j)*.08, r = g.createRadialGradient(x, y + 8, 2, x, y + 8, 70*f);
        r.addColorStop(0, `rgba(255,214,140,${.55*k})`); r.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = r; g.beginPath(); g.arc(x, y + 8, 70*f, 0, 7); g.fill(); }
    });
    // Nachgezogene Spur + Führungspunkt
    if(p > 0){ g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = '#ffcf7a'; g.shadowBlur = 14;
      g.strokeStyle = `rgba(255,222,150,${over ? .9*Math.max(.25, 1 - carve*.6) : .9})`; g.lineWidth = 6;
      g.beginPath(); g.moveTo(PATH[0].x, PATH[0].y); for(let i = 1; i <= p; i++) g.lineTo(PATH[i].x, PATH[i].y); g.stroke(); g.restore(); }
    if(!over){ const P = PATH[Math.min(N, p + 6)], k = .6 + .4*Math.sin(tt*6);
      g.save(); g.fillStyle = `rgba(255,240,200,${k})`; g.shadowColor = '#fff2c4'; g.shadowBlur = 18; g.beginPath(); g.arc(P.x, P.y, 9, 0, 7); g.fill(); g.restore(); }
    // eingeritzte Initialen im gedruckten Holzherz
    if(carve > 0){
      const txt = INIT || '♥', y0 = H.y - 4;
      g.save(); g.globalAlpha = carve; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold ${txt.length > 7 ? 26 : 34}px Georgia`;
      g.fillStyle = 'rgba(255,240,215,.55)'; g.fillText(txt, H.x + 1.5, y0 + 1.5);
      g.fillStyle = '#5a3418'; g.fillText(txt, H.x, y0);
      if(YEARS){ g.font = 'italic bold 20px Georgia'; g.fillStyle = 'rgba(255,240,215,.5)'; g.fillText(YEARS + ' ♥', H.x + 1, y0 + 35); g.fillStyle = '#5a3418'; g.fillText(YEARS + ' ♥', H.x, y0 + 34); }
      g.restore();
    }
    if(glow > 0){ const r = g.createRadialGradient(H.x, H.y, 10, H.x, H.y, 160); r.addColorStop(0, `rgba(255,220,160,${.5*glow})`); r.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = r; g.beginPath(); g.arc(H.x, H.y, 160, 0, 7); g.fill(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🏮 ' + lit.filter(v => v > 0).length + '/6', '⏱ ' + time.toFixed(1) + ' s', 846);
    if(!fin.on && p === 0) hint(g, t('hochzeitstag.hint'), tt, 610, 9);
    fin.draw(g, dt, 'rgba(60,15,30,', .25);
  }
};
startCard(scene);
window.__hz = { PATH, get p(){ return p; }, get over(){ return over; } };
