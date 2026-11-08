// Gamer: „Level Up!“ Auf dem gedruckten Arcade-Bildschirm läuft Breakout – genau mit den gedruckten Ziegeln und dem Schläger.
// Finger schiebt den Schläger, alle Ziegel abräumen. 3 Leben, Rekord.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const SCR = { x0: 176, x1: 426, y0: 371, y1: 559 }, BR = { x0: 195, x1: 408, y0: 389, h: 14, rows: 3, cols: 9 }, COLS = [["#ec2ac2", "#e7216e", "#ea2f29", "#f46710", "#f4c50c", "#79cf1b", "#09cb56", "#01d4e1", "#0b5de7"], ["#ed27ba", "#e8265d", "#ef451b", "#f6c00e", "#cdcf17", "#1cca45", "#01cde6", "#0187e9", "#2c29e5"], ["#e924ad", "#e72941", "#ee4a19", "#f6c60d", "#81cf1d", "#16c351", "#01cbe4", "#028be9", "#3321e1"]];
const PW = 89, PY = 526, PH = 7;
let bricks, ball, pad, lives, score, phase, fx, fin, tt;
const scene = {
  title: t('gamer.title'), subtitle: t('gamer.sub'), emoji: '🕹️', accent: '#ff5ae0', button: '#5a1a8a', bg: '#1a0a2a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ bricks = []; const bw = (BR.x1 - BR.x0)/BR.cols; for(let r = 0; r < BR.rows; r++) for(let c = 0; c < BR.cols; c++) bricks.push({ x: BR.x0 + c*bw + 1, y: BR.y0 + r*BR.h + 1, w: bw - 2, h: BR.h - 2, col: COLS[r][c], on: true });
    pad = { x: 301.5 }; lives = 3; score = 0; phase = 'ready'; tt = 0; this.serve(); fx.clear(); fin.stop(); },
  serve(){ ball = { x: pad.x, y: PY - 6, vx: 0, vy: 0, stuck: true }; },
  onTap(x, y, ctx){ if(phase === 'over') return; pad.x = Math.max(SCR.x0 + PW/2, Math.min(SCR.x1 - PW/2, x));
    if(ball.stuck){ ball.stuck = false; const a = -Math.PI/2 + (Math.random() - .5)*.8; ball.vx = Math.cos(a)*230; ball.vy = Math.sin(a)*230; phase = 'play'; ctx.tone(660, 0, .05, 'square', .05); } },
  onDrag(x){ pad.x = Math.max(SCR.x0 + PW/2, Math.min(SCR.x1 - PW/2, x)); },
  update(dt, ctx){ tt += dt; fx.update(dt); if(ball.stuck){ ball.x = pad.x; return; } if(phase !== 'play') return;
    const steps = 3; for(let k = 0; k < steps; k++){ const d = dt/steps; ball.x += ball.vx*d; ball.y += ball.vy*d;
      if(ball.x < SCR.x0 + 3){ ball.x = SCR.x0 + 3; ball.vx = Math.abs(ball.vx); ctx.tone(330, 0, .03, 'square', .03); }
      if(ball.x > SCR.x1 - 3){ ball.x = SCR.x1 - 3; ball.vx = -Math.abs(ball.vx); ctx.tone(330, 0, .03, 'square', .03); }
      if(ball.y < SCR.y0 + 3){ ball.y = SCR.y0 + 3; ball.vy = Math.abs(ball.vy); }
      if(ball.vy > 0 && ball.y > PY - 3 && ball.y < PY + PH && Math.abs(ball.x - pad.x) < PW/2 + 3){ const o = (ball.x - pad.x)/(PW/2), sp = Math.min(380, Math.hypot(ball.vx, ball.vy)*1.02), a = -Math.PI/2 + o*1.05;
        ball.vx = Math.cos(a)*sp; ball.vy = Math.sin(a)*sp; ball.y = PY - 3; ctx.tone(520, 0, .04, 'square', .05); }
      for(const b of bricks){ if(!b.on) continue; if(ball.x > b.x - 2 && ball.x < b.x + b.w + 2 && ball.y > b.y - 2 && ball.y < b.y + b.h + 2){ b.on = false; score++;
        const ox = Math.min(ball.x - b.x, b.x + b.w - ball.x), oy = Math.min(ball.y - b.y, b.y + b.h - ball.y); if(ox < oy) ball.vx = -ball.vx; else ball.vy = -ball.vy;
        ctx.tone(880 + (2 - Math.floor((b.y - BR.y0)/BR.h))*220, 0, .05, 'square', .05); fx.burst(b.x + b.w/2, b.y + b.h/2, 8, [b.col, '#ffffff'], 120, 200, 3);
        if(score === bricks.length){ phase = 'over'; this.finish(ctx, true); } break; } }
      if(ball.y > SCR.y1 - 2){ lives--; ctx.tone(150, 0, .3, 'sawtooth', .07); if(lives <= 0){ phase = 'over'; this.finish(ctx, false); } else { phase = 'ready'; this.serve(); } break; } } },
  finish(ctx, win){ const b = best('gamer', score, true);
    if(win) ctx.melody([['C5', .125], ['E5', .125], ['G5', .125], ['C6', .125], ['G5', .125], ['C6', .5]], 220, 'square', .06);
    setTimeout(() => fin.start(ctx, greeting('gamer'), [t(win ? 'gamer.win' : 'gamer.line'), t('gamer.score', { n: score }) + (b.isNew && score ? '  ★' : '') + '  ·  ' + t('gamer.best', { n: b.best })], win ? MEL.birthday : null), 900); },
  draw(g, ctx){ const dt = 1/60;
    // gedruckte Ziegel/Schläger überdecken und live neu zeichnen
    g.fillStyle = '#030306'; g.fillRect(BR.x0 - 2, BR.y0 - 2, BR.x1 - BR.x0 + 4, BR.rows*BR.h + 4); g.fillRect(SCR.x0 + 2, PY - 3, SCR.x1 - SCR.x0 - 4, PH + 6);
    for(const b of bricks){ if(!b.on) continue; g.fillStyle = b.col; g.fillRect(b.x, b.y, b.w, b.h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(b.x, b.y, b.w, 2); }
    g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 8; g.fillStyle = '#f0f0f0'; for(let k = 0; k < 5; k++) g.fillRect(pad.x - PW/2 + k*18, PY, 16, PH);
    g.fillRect(ball.x - 3, ball.y - 3, 6, 6); g.restore();
    for(let k = 0; k < lives; k++){ g.fillStyle = '#ff5ae0'; g.fillRect(SCR.x1 - 14 - k*12, SCR.y1 - 12, 8, 8); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🧱 ' + score + '/' + bricks.length, '♥ ' + lives, 846);
    if(!fin.on && phase === 'ready' && score === 0) hint(g, t('gamer.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(20,5,40,', .25); } };
startCard(scene);
window.__gm = { get score(){ return score; }, get phase(){ return phase; }, get ball(){ return ball; }, SCR, PY };
