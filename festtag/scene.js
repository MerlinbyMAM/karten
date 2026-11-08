// Kommunion / Konfirmation / Firmung: „Friedenstauben“. Die fünf gedruckten Tauben sitzen neben der Kerze.
// Antippen: die Taube hüpft, breitet sich als leuchtendes Abbild aus und fliegt mit einem Licht in den Himmel,
// wo das Licht als Stern über der Kerzenflamme bleibt. Ohne Punkte. Anlass per ?anlass=Erstkommunion personalisierbar.
import { startCard, t } from '../core/card.js';
import { makeFx, greeting, hint, rnd, bigText } from '../core/kit.js';

const DV = [
  { n: 'taube1', x: 0, y: 546, w: 104, h: 128, cx: 61.5, cy: 620.7 },
  { n: 'taube2', x: 98, y: 514, w: 99, h: 128, cx: 151.8, cy: 586.7 },
  { n: 'taube3', x: 372, y: 520, w: 80, h: 110, cx: 407.6, cy: 584.1 },
  { n: 'taube4', x: 440, y: 544, w: 82, h: 106, cx: 479.3, cy: 604.4 },
  { n: 'taube5', x: 506, y: 562, w: 94, h: 130, cx: 550.5, cy: 632 } ];
const IMG = DV.map(d => { const a = new Image(); a.src = d.n + '.png'; return a; });
const FLAME = { x: 298, y: 300 }, NOTES = [523.3, 659.3, 784, 880, 1046.5];
const q = new URLSearchParams(location.search), ANL = (q.get('anlass') || '').trim().slice(0, 30), NM = (q.get('name') || '').trim();

let S, lights, fx, tt, done, finT, n;

function drawDove(g, i, x, y, sc, rot, al, glow){
  const d = DV[i]; if(!IMG[i].complete) return;
  g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(rot); g.scale(sc*(d.cx < 300 ? 1 : 1), sc);
  if(glow){ g.shadowColor = 'rgba(255,240,190,.95)'; g.shadowBlur = 30; }
  g.drawImage(IMG[i], d.x - d.cx, d.y - d.cy, d.w, d.h); g.restore();
}

const scene = {
  title: t('festtag.title'), subtitle: t('festtag.sub'), emoji: '🕊️',
  accent: '#f6e3b0', button: '#6c8db5', bg: '#3a5a7a',
  init(ctx){ fx = makeFx(); this.restart(ctx); },
  restart(ctx){ S = DV.map(() => ({ st: 'sit', t: 0 })); lights = []; tt = 0; done = false; finT = 0; n = 0; fx.clear(); ctx.showAgain && ctx.showAgain(false); },
  onTap(x, y, ctx){
    if(done) return;
    let bi = -1, bd = 70; DV.forEach((d, i) => { if(S[i].st !== 'sit') return; const dd = Math.hypot(x - d.cx, y - d.cy); if(dd < bd){ bd = dd; bi = i; } });
    if(bi < 0) return;
    S[bi].st = 'fly'; S[bi].t = 0; S[bi].k = n;
    ctx.tone(NOTES[n % 5], 0, 1.4, 'sine', .07); ctx.tone(NOTES[n % 5]*1.5, .05, 1, 'sine', .025); n++;
    fx.sparkle(DV[bi].cx, DV[bi].cy - 20, 8);
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    S.forEach((s, i) => { s.t += dt;
      if(s.st === 'fly' && s.t >= 2.4){ s.st = 'gone'; const a = -Math.PI/2 + (s.k - 2)*.42; lights.push({ x: FLAME.x + Math.cos(a)*120, y: FLAME.y - 30 + Math.sin(a)*90 + 40, a: 0, ph: rnd(0, 6) }); ctx.tone(1318.5, 0, .8, 'sine', .03); }
      if(s.st === 'gone') s.st = 'sit2'; });
    for(const l of lights) l.a = Math.min(1, l.a + dt*.8);
    if(!done && lights.length === DV.length){ done = true; finT = 0;
      ctx.melody([['G5', 1], ['C6', 1], ['E6', 2], ['D6', 1], ['C6', 1], ['G5', 2], ['C6', 3]], 76, 'sine', .07);
      setTimeout(() => ctx.showAgain(true), 4000); }
    if(done) finT += dt;
  },
  draw(g, ctx){
    // Sterne über der Flamme
    for(const l of lights){ const tw = .7 + .3*Math.sin(tt*2.2 + l.ph); g.save(); g.globalAlpha = l.a*tw;
      const r = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, 22); r.addColorStop(0, 'rgba(255,250,225,1)'); r.addColorStop(1, 'rgba(255,235,170,0)');
      g.fillStyle = r; g.beginPath(); g.arc(l.x, l.y, 22, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,250,230,.9)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(l.x - 11, l.y); g.lineTo(l.x + 11, l.y); g.moveTo(l.x, l.y - 11); g.lineTo(l.x, l.y + 11); g.stroke(); g.restore(); }
    S.forEach((s, i) => { const d = DV[i];
      if(s.st === 'sit' && !done){ const k = .3 + .3*Math.sin(tt*2 + i); g.save(); g.strokeStyle = `rgba(255,248,220,${k})`; g.lineWidth = 2; g.beginPath(); g.ellipse(d.cx, d.cy, d.w*.55, d.h*.5, 0, 0, 7); g.stroke(); g.restore(); }
      if(s.st === 'fly'){
        const hop = s.t < .35 ? Math.sin(s.t/.35*Math.PI)*14 : 0;
        if(s.t < .35) drawDove(g, i, d.cx, d.cy - hop, 1, 0, 1, false);
        const u = Math.max(0, (s.t - .25)/2.15), e = u*u*(3 - 2*u), a = -Math.PI/2 + (s.k - 2)*.42;
        const tx = FLAME.x + Math.cos(a)*120, ty = FLAME.y - 30 + Math.sin(a)*90 + 40;
        const x = d.cx + (tx - d.cx)*e + Math.sin(u*Math.PI*2)*40*(d.cx < 300 ? -1 : 1), y = d.cy + (ty - d.cy)*e - Math.sin(u*Math.PI)*60;
        if(u > 0) drawDove(g, i, x, y, 1 - .55*e, Math.sin(tt*10)*.08, .75*(1 - Math.max(0, u - .8)/.2), true);
        if(u > 0){ g.save(); g.fillStyle = 'rgba(255,245,200,.9)'; g.beginPath(); g.arc(x, y - 8, 4, 0, 7); g.fill(); g.restore(); fx.sparkle(x, y, 1); }
      } });
    fx.draw(g);
    if(!done && n === 0) hint(g, t('festtag.hint'), tt, 470, 9);
    if(done && finT > 1.5){
      const a = Math.min(1, (finT - 1.5)*.6), msg = ANL ? (NM ? t('festtag.msgNA', { anlass: ANL, name: NM }) : t('festtag.msgA', { anlass: ANL })) : greeting('festtag');
      g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(40,60,90,.28)'; g.fillRect(0, 400, 600, 150);
      bigText(g, msg, 300, 450, msg.length > 26 ? 34 : 42, '#fffaf0', 'rgba(40,50,90,.85)');
      bigText(g, t('festtag.line'), 300, 512, 26, '#f6e3b0', 'rgba(40,50,90,.85)'); g.restore();
    }
  }
};
startCard(scene);
window.__ft = { DV, S: () => S, get lights(){ return lights.length; } };
