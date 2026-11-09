// Der Tagesbote: Die Zeitung erwacht – die Bilder bewegen sich (Video in Schleife),
// unten im freien Feld tippt eine magische Schreibfeder die persönliche
// Meldung (?name=, ?text=). Antippen = goldene Funken + Glöckchen.
import { startCard, t, bigText, wrapText, rnd, LANG } from '../core/card.js';
const CLIP = ['en','fr','it','es','nl','pl','tr'].includes(LANG) ? 'clip_' + LANG + '.mp4' : 'clip.mp4';
import { BOX } from './data.js';   // freies Pergament-Feld unten {x,y,w,h} in 600x900

const P = new URLSearchParams(location.search);
const NAME = P.get('name');
const HEAD = NAME ? t('zeitung.headN', {name: NAME}) : t('zeitung.head');
const TEXT = P.get('text') || t('zeitung.text');

let t0, sparks, chars, lastTick;

const scene = {
  title: t('zeitung.title'), subtitle: t('zeitung.sub'), emoji: '📜',
  accent: '#e9c46a', button: '#6b4226', bg: '#3b2a1a',
  video: true, firstVideo: CLIP,
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    t0 = ctx.t; sparks = []; chars = 0; lastTick = 0;
    if(ctx.vid){ ctx.vid.loop = true; ctx.vid.currentTime = 0; ctx.playVideo(CLIP); }
    ctx.tone(1567, .1, .6, 'sine', .05); ctx.tone(2093, .25, .8, 'sine', .04);
  },
  onFound(ctx){ if(ctx.vid && ctx.vid.paused) ctx.playVideo(); },
  onLost(ctx){ if(ctx.vid) ctx.vid.pause(); },
  onTap(x, y, ctx){
    for(let i=0;i<22;i++){ const a = rnd(0, 6.28), v = rnd(40, 180); sparks.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: rnd(.6, 1.2) }); }
    ctx.tone(rnd(1800, 2600), 0, .5, 'sine', .04); ctx.tone(rnd(2600, 3300), .07, .4, 'sine', .03);
  },
  update(dt, ctx){
    const el = ctx.t - t0 - 1.5;
    const total = HEAD.length + TEXT.length;
    if(el > 0 && chars < total){
      chars = Math.min(total, Math.floor(el*18));
      if(chars !== lastTick && chars % 2 === 0){ lastTick = chars; ctx.noise(0, .025, .05, 2500); }
      if(chars >= total){ ctx.melody([['G5',.5],['B5',.5],['D6',1],['G6',2]], 160, 'sine', .07); setTimeout(() => ctx.showAgain(true), 2500); }
    }
    for(const s of sparks){ s.x += s.vx*dt; s.y += s.vy*dt; s.vy += 40*dt; s.life -= dt; }
    sparks = sparks.filter(s => s.life > 0);
  },
  draw(g, ctx){
    const total = HEAD.length + TEXT.length;
    const h = HEAD.slice(0, chars), b = TEXT.slice(0, Math.max(0, chars - HEAD.length));
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#2b1a0e';
    let fs = 32; g.font = `bold ${fs}px Georgia, serif`; while(g.measureText(HEAD).width > BOX.w - 20 && fs > 14){ fs--; g.font = `bold ${fs}px Georgia, serif`; }
    g.fillText(h, BOX.x + BOX.w/2, BOX.y + 18);
    g.font = `italic 21px Georgia, serif`; g.fillStyle = '#3d2814';
    wrapText(g, b, BOX.x + BOX.w/2, BOX.y + 52, BOX.w - 16, 25);
    // Schreibfeder folgt dem Text
    if(chars < total && ctx.t - t0 > 1.5){
      g.font = '40px serif'; g.fillText('🪶', BOX.x + BOX.w*.5 + Math.sin(ctx.t*14)*BOX.w*.3, BOX.y + (chars < HEAD.length ? 10 : 60) + Math.sin(ctx.t*30)*3);
    }
    for(const s of sparks){ g.globalAlpha = Math.max(0, s.life); g.fillStyle = '#ffd166'; g.font = '16px serif'; g.fillText('✦', s.x, s.y); }
    g.globalAlpha = 1;
  }
};
startCard(scene);
