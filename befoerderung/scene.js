// Beförderung: „Die Karriereleiter“. Der gedruckte Kollege geht zur gedruckten Goldleiter und klettert
// im Takt nach oben: Die nächste Sprosse leuchtet im Rhythmus auf – genau dann tippen. Daneben getippt = eine Sprosse zurück.
// Oben strahlt der Pokal. Zeit und Patzer werden gezählt, Rekord gespeichert.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';

const P = { x: 166, y: 552, w: 126, h: 288, cx: 229.1, foot: 840 };          // gedruckter Kollege (Füße bei y 840)
const RUNG = [780, 730, 683, 637, 590, 542, 497];                             // gedruckte Sprossen (Kartenkoord.)
const lx = y => 355 + (780 - y)*28/370;                                       // Leitermitte je Höhe
const TROPHY = { x: 392, y: 285 };
const spr = new Image(); spr.src = 'chef.png'; const platz = new Image(); platz.src = 'chef_platz.png';

let fx, fin, tt, time, step, phase, beat, beatT, miss, started, over, wob, px, py, sc, walkT, flash;

const scene = {
  title: t('befoerderung.title'), subtitle: t('befoerderung.sub'), emoji: '🪜',
  accent: '#ffd36a', button: '#1d3a6e', bg: '#1d2a48',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ tt = 0; time = 0; step = 0; phase = 'stand'; beat = .8; beatT = 0; miss = 0; started = false; over = false; wob = 0;
    px = P.cx; py = P.foot; sc = 1; walkT = 0; flash = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    if(phase === 'stand'){ phase = 'walk'; walkT = 0; started = true; ctx.tone(392, 0, .08, 'triangle', .05); return; }
    if(phase !== 'climb') return;
    // Treffer, wenn nah am Taktschlag (Leuchten am hellsten)
    const d = Math.min(beatT, beat - beatT);
    if(d < .17){ step++; flash = 1; const ry = RUNG[step - 1];
      ctx.tone(330 + step*55, 0, .14, 'triangle', .08);
      fx.burst(lx(ry), ry, 8, ['#ffd36a', '#fff3c4'], 110, 260, 3);
      beat = Math.max(.46, beat - .05);
      if(step >= RUNG.length) this.finish(ctx); }
    else { miss++; wob = 1; ctx.tone(150, 0, .2, 'sawtooth', .05);
      if(step > 0){ step--; fx.pop(px, py - 200*sc, t('befoerderung.rutsch'), '#ffffff', 24); } }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt); if(started && !over) time += dt; wob = Math.max(0, wob - dt*3); flash = Math.max(0, flash - dt*3);
    if(phase === 'walk'){ walkT += dt; const u = Math.min(1, walkT/1.1), e = u*u*(3 - 2*u);
      px = P.cx + (lx(RUNG[0]) - 8 - P.cx)*e; sc = 1 - .36*e; py = P.foot - 20*e;
      if(u >= 1){ phase = 'climb'; beatT = 0; } }
    if(phase === 'climb' || phase === 'top'){ beatT += dt; if(beatT >= beat){ beatT -= beat; if(phase === 'climb') ctx.tone(196, 0, .05, 'sine', .025); }
      const ty = step ? RUNG[step - 1] : P.foot - 20; py += (ty - py)*Math.min(1, dt*12); px += (lx(py) - 8 - px)*Math.min(1, dt*12); }
  },
  finish(ctx){
    over = true; phase = 'top'; const secs = Math.round(time*10)/10, b = best('befoerderung', secs, false);
    ctx.melody([['C5', .2], ['E5', .2], ['G5', .2], ['C6', .4], ['G5', .2], ['C6', .6]], 180, 'triangle', .1);
    for(let k = 0; k < 4; k++) setTimeout(() => fx.burst(TROPHY.x, TROPHY.y, 26, ['#ffd36a', '#ffffff', '#1d3a6e', '#8ac8ff'], 340, 260, 6), k*280);
    setTimeout(() => fin.start(ctx, greeting('befoerderung'), [t('befoerderung.line'), t('befoerderung.score', { s: secs, m: miss }) + (b.isNew ? '  ★' : '') + '  ·  ' + t('befoerderung.best', { s: b.best })], MEL.birthday), 1700);
  },
  draw(g, ctx){
    const dt = 1/60;
    if(phase !== 'stand'){ if(platz.complete) g.drawImage(platz, P.x, P.y, P.w, P.h); }
    // Pokal strahlt, wenn oben angekommen; sonst sanftes Funkeln
    const glow = over ? .8 + .2*Math.sin(tt*6) : .15 + .1*Math.sin(tt*2);
    g.save(); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(TROPHY.x, TROPHY.y, 10, TROPHY.x, TROPHY.y, 120);
    rg.addColorStop(0, `rgba(255,220,120,${glow*.5})`); rg.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = rg; g.fillRect(TROPHY.x - 130, TROPHY.y - 130, 260, 260); g.restore();
    // nächste Sprosse leuchtet im Takt
    if(phase === 'climb' && step < RUNG.length){ const ry = RUNG[step], cx = lx(ry), k = Math.max(0, 1 - Math.min(beatT, beat - beatT)/.25);
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,236,160,${.15 + .85*k})`; g.lineWidth = 10 + 6*k; g.lineCap = 'round';
      g.shadowColor = '#ffd36a'; g.shadowBlur = 20*k; g.beginPath(); g.moveTo(cx - 52, ry); g.lineTo(cx + 52, ry); g.stroke(); g.restore(); }
    // Kollege (Ausschnitt aus dem Druck), Füße auf der Sprosse
    if(spr.complete){ const w = P.w*sc, h = P.h*sc, sh = wob ? Math.sin(tt*40)*6*wob : 0;
      const bob = phase === 'walk' ? Math.abs(Math.sin(walkT*9))*4 : 0;
      g.save(); g.translate(px + sh, py - bob); g.drawImage(spr, -(P.cx - P.x)*sc, -h, w, h); g.restore(); }
    if(flash > 0 && step){ const ry = RUNG[step - 1]; g.save(); g.globalAlpha = flash; g.fillStyle = '#fff3c4'; g.beginPath(); g.ellipse(lx(ry), ry, 60, 10, 0, 0, 7); g.fill(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🪜 ' + step + '/' + RUNG.length, '⏱ ' + time.toFixed(1) + ' s', 846, 156);
    if(!fin.on && phase === 'stand') hint(g, t('befoerderung.hint'), tt, 470, 30);
    if(!fin.on && phase === 'climb' && step === 0 && miss === 0) hint(g, t('befoerderung.hint2'), tt, 470, 30);
    fin.draw(g, dt, 'rgba(20,30,60,', .2);
  }
};
startCard(scene);
window.__bf = { get step(){ return step; }, get phase(){ return phase; }, get beat(){ return beat; }, get beatT(){ return beatT; } };
