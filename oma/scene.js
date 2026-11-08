// Oma: „Omas Kuchen“ – der gedruckte Apfelkuchen wird gerecht geteilt.
// Drei Wischer quer über den Kuchen = drei Schnitte durch die Mitte (in Kuchen-Perspektive). Danach rücken die sechs
// Stücke (Ausschnitte des Druckbilds) auseinander, und es wird bewertet, wie gleich groß sie sind.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL, cardImg } from '../core/kit.js';

const K = { x: 289, y: 619, rx: 142, ry: 88 };               // Kuchen-Ellipse (vermessen, inkl. Rand)
const CUTS = 3;
let cuts, sw, fx, fin, tt, over, explode, score;

// normierte Kuchenkoordinaten (Kreis) <-> Bild
const toN = (x, y) => ({ u: (x - K.x)/K.rx, v: (y - K.y)/K.ry });
const toI = (u, v) => ({ x: K.x + u*K.rx, y: K.y + v*K.ry });

function sectors(){
  const a = cuts.flatMap(c => [c, c + Math.PI]).map(v => (v + 4*Math.PI) % (2*Math.PI)).sort((p, q) => p - q);
  return a.map((v, i) => ({ a0: v, a1: i + 1 < a.length ? a[i + 1] : a[0] + 2*Math.PI }));
}
function wedge(g, a0, a1, dx, dy, R = 1.08){
  g.beginPath(); const c = toI(0, 0); g.moveTo(c.x + dx, c.y + dy);
  for(let k = 0; k <= 24; k++){ const a = a0 + (a1 - a0)*k/24, p = toI(Math.cos(a)*R, Math.sin(a)*R); g.lineTo(p.x + dx, p.y + dy); }
  g.closePath();
}

const scene = {
  title: t('oma.title'), subtitle: t('oma.sub'), emoji: '🥧',
  accent: '#ffe2b0', button: '#b8382a', bg: '#6a2a22',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ cuts = []; sw = null; tt = 0; over = false; explode = 0; score = 0; fx.clear(); fin.stop(); },
  onTap(x, y){ if(!over) sw = { x0: x, y0: y, x1: x, y1: y }; },
  onDrag(x, y){ if(sw){ sw.x1 = x; sw.y1 = y; } },
  onRelease(ctx){
    if(!sw || over) { sw = null; return; }
    const a = toN(sw.x0, sw.y0), b = toN(sw.x1, sw.y1), du = b.u - a.u, dv = b.v - a.v, L = Math.hypot(du, dv); sw = null;
    if(L < .9) return;                                      // muss richtig quer über den Kuchen gehen
    let ang = Math.atan2(dv, du); ang = (ang + 2*Math.PI) % Math.PI;
    if(cuts.some(c => Math.min(Math.abs(c - ang), Math.PI - Math.abs(c - ang)) < .08)) return;
    cuts.push(ang); ctx.noise(0, .14, .09, 2600); ctx.tone(300, 0, .05, 'square', .04);
    const p = toI(0, 0); fx.pop(p.x, p.y - 110, t('oma.cut'), '#fff', 30); fx.burst(p.x, p.y, 8, ['#f3d6a0', '#ffffff'], 120, 200, 4);
    if(cuts.length === CUTS) this.finish(ctx);
  },
  finish(ctx){
    over = true; const S = sectors(), ideal = 2*Math.PI/S.length, dev = S.reduce((s, q) => s + Math.abs(q.a1 - q.a0 - ideal), 0);
    score = Math.max(0, Math.round(100*(1 - dev/(2*Math.PI)*1.5)));
    const b = best('oma', score), verdict = score >= 95 ? t('oma.perfect') : score >= 80 ? t('oma.ok') : t('oma.bad');
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .5]], 240, 'triangle', .09);
    setTimeout(() => { fx.burst(K.x, K.y, 30, ['#ffd98a', '#ff9f9f', '#ffffff'], 260, 200, 6); fx.pop(K.x, K.y - 140, score + ' %', '#ffe27a', 46); }, 900);
    setTimeout(() => fin.start(ctx, greeting('oma'), [t('oma.score', { n: score }) + (b.isNew ? '  ★' : ''), verdict], MEL.soft), 2400);
  },
  update(dt){ tt += dt; fx.update(dt); if(over) explode = Math.min(1, explode + dt*1.4); },
  draw(g, ctx){
    const dt = 1/60;
    if(over && explode > 0 && cardImg.complete){
      // Teller unter dem Kuchen sichtbar machen, dann Stücke leicht nach außen versetzt zeichnen
      g.save(); const r = g.createRadialGradient(K.x, K.y, 10, K.x, K.y, K.rx*1.1); r.addColorStop(0, '#f6f1e8'); r.addColorStop(1, '#ddd3c4');
      g.fillStyle = r; g.beginPath(); g.ellipse(K.x, K.y, K.rx*1.06, K.ry*1.08, 0, 0, 7); g.fill(); g.restore();
      const e = explode*explode*(3 - 2*explode);
      for(const s of sectors()){ const m = (s.a0 + s.a1)/2, off = toI(Math.cos(m)*.16*e, Math.sin(m)*.16*e), dx = off.x - K.x, dy = off.y - K.y;
        g.save(); g.fillStyle = 'rgba(80,40,10,.25)'; wedge(g, s.a0, s.a1, dx + 2, dy + 6); g.fill(); wedge(g, s.a0, s.a1, dx, dy); g.clip(); g.drawImage(cardImg, dx, dy, 600, 900); g.restore(); }
    }
    // Schnittlinien
    if(!over || explode < .2) for(const c of cuts){ const p = toI(Math.cos(c)*1.05, Math.sin(c)*1.05), q = toI(-Math.cos(c)*1.05, -Math.sin(c)*1.05);
      g.save(); g.strokeStyle = 'rgba(90,45,15,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      g.strokeStyle = 'rgba(255,240,210,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x + 1, p.y - 2); g.lineTo(q.x + 1, q.y - 2); g.stroke(); g.restore(); }
    // laufender Wisch als Messer-Spur
    if(sw){ g.save(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(sw.x0, sw.y0); g.lineTo(sw.x1, sw.y1); g.stroke(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🔪 ' + cuts.length + '/' + CUTS, over ? score + ' %' : '🥧 ' + (cuts.length*2 || 1), 846);
    if(!fin.on && cuts.length === 0 && !sw) hint(g, t('oma.hint'), tt, 470, 9);
    fin.draw(g, dt, 'rgba(90,35,25,', .22);
  }
};
startCard(scene);
window.__om = { K, get cuts(){ return cuts; }, get score(){ return score; }, get over(){ return over; } };
