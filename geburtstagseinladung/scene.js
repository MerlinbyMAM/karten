// Geburtstagseinladung: „Puzzle-Einladung“ – das gedruckte Partybild ist durcheinandergeraten. Zwei Teile nacheinander antippen tauscht sie. Ist das Bild wieder heil, erscheint die Einladung mit Datum und Ort.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL, cardImg } from '../core/kit.js';
const X0 = 30, Y0 = 330, TW = 180, TH = 130, Q = new URLSearchParams(location.search), WANN = (Q.get('wann') || '').trim(), WO = (Q.get('wo') || '').trim();
let fx, fin, tt, phase, pos, sel, moves, flash;
const scene = {
  title: t('geburtstagseinladung.title'), subtitle: t('geburtstagseinladung.sub'), emoji: '🧩', accent: '#7ae0e0', button: '#1a8a8a', bg: '#2a2030',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ pos = [...Array(9).keys()]; do { for(let i = 8; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [pos[i], pos[j]] = [pos[j], pos[i]]; } } while(pos.filter((p, i) => p === i).length > 1);
    phase = 'ready'; sel = -1; moves = 0; flash = Array(9).fill(0); tt = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'end') return; const c = Math.floor((x - X0)/TW), r = Math.floor((y - Y0)/TH); if(c < 0 || c > 2 || r < 0 || r > 2) return; const k = r*3 + c; phase = 'play';
    if(sel < 0){ sel = k; ctx.tone(523, 0, .06, 'triangle', .05); return; } if(sel === k){ sel = -1; return; }
    [pos[sel], pos[k]] = [pos[k], pos[sel]]; moves++; for(const q of [sel, k]) if(pos[q] === q){ flash[q] = .6; ctx.tone(880, 0, .12, 'triangle', .06); } ctx.noise(0, .06, .08, 2000); sel = -1;
    if(pos.every((p, i) => p === i)) this.finish(ctx); },
  update(dt){ tt += dt; fx.update(dt); for(let i = 0; i < 9; i++) flash[i] = Math.max(0, flash[i] - dt); },
  finish(ctx){ phase = 'end'; fx.burst(300, 525, 60, ['#ff7aa8', '#7ad3ff', '#ffd34d', '#9cf27a'], 420, 300, 6); const b = best('geburtstagseinladung', moves, false);
    const info = [WANN && t('geburtstagseinladung.wann', { w: WANN }), WO && t('geburtstagseinladung.wo', { w: WO })].filter(Boolean);
    setTimeout(() => fin.start(ctx, greeting('geburtstagseinladung'), info.length ? info : [t('geburtstagseinladung.line')], MEL.birthday), 900); },
  draw(g, ctx){ const dt = 1/60;
    if(phase !== 'end' && cardImg.complete && cardImg.naturalWidth){ const k = cardImg.naturalWidth/600;
      for(let i = 0; i < 9; i++){ const src = pos[i], sx = X0 + (src % 3)*TW, sy = Y0 + Math.floor(src/3)*TH, dx = X0 + (i % 3)*TW, dy = Y0 + Math.floor(i/3)*TH;
        g.drawImage(cardImg, sx*k, sy*k, TW*k, TH*k, dx, dy, TW, TH); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.strokeRect(dx + 1.5, dy + 1.5, TW - 3, TH - 3);
        if(flash[i] > 0){ g.fillStyle = `rgba(255,255,200,${flash[i]*.6})`; g.fillRect(dx, dy, TW, TH); }
        if(i === sel){ g.strokeStyle = '#ff5a8a'; g.lineWidth = 6; g.strokeRect(dx + 3, dy + 3, TW - 6, TH - 6); } } }
    fx.draw(g);
    if(!fin.on) hud2(g, '🧩 ' + pos.filter((p, i) => p === i).length + '/9', '👆 ' + moves, 846);
    if(!fin.on && phase === 'ready') hint(g, t('geburtstagseinladung.hint'), tt, 300, 99);
    fin.draw(g, dt, 'rgba(40,30,50,', .25); } };
startCard(scene);
window.__ei = { get phase(){ return phase; }, get pos(){ return pos; }, X0, Y0, TW, TH };
