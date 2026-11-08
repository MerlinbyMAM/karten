// Rubbellos: Über dem Feld liegt eine silberne Rubbelschicht. Mit dem Finger
// freirubbeln -> darunter die Überraschung (?text=, ?text2=). Ab 60 % frei:
// Rest fällt ab, Konfetti, Fanfare.
import { startCard, bigText, wrapText, rnd, confetti, drawConfetti } from '../core/card.js';
import { FIELD } from './data.js';   // {x,y,w,h} des Rubbelfelds in 600x900

const P = new URLSearchParams(location.search);
const TEXT = P.get('text') || 'Du hast gewonnen:';
const TEXT2 = P.get('text2') || 'Einen Tag ganz nach deinen Wünschen!';

let layer, lg, cleared, lastP, conf, done, doneT, checkT;

function makeLayer(){
  layer = document.createElement('canvas'); layer.width = FIELD.w; layer.height = FIELD.h;
  lg = layer.getContext('2d', {willReadFrequently: true});
  const gr = lg.createLinearGradient(0, 0, FIELD.w, FIELD.h);
  gr.addColorStop(0, '#b8b8c0'); gr.addColorStop(.5, '#eceef2'); gr.addColorStop(1, '#a4a6ae');
  lg.fillStyle = gr; lg.fillRect(0, 0, FIELD.w, FIELD.h);
  for(let i=0;i<900;i++){ lg.fillStyle = `rgba(255,255,255,${Math.random()*.25})`; lg.fillRect(Math.random()*FIELD.w, Math.random()*FIELD.h, 2, 2); }
  lg.fillStyle = 'rgba(90,90,100,.55)'; lg.font = `bold ${Math.round(FIELD.h*.16)}px system-ui, sans-serif`;
  lg.textAlign = 'center'; lg.textBaseline = 'middle';
  lg.fillText('★ HIER RUBBELN ★', FIELD.w/2, FIELD.h/2);
}

const scene = {
  title: 'Dein Rubbellos', subtitle: 'Rubbel das Feld mit dem Finger frei – was steckt dahinter?', emoji: '🎟️',
  accent: '#ffd166', button: '#d62828', bg: '#5a189a',
  init(ctx){ this.restart(ctx); },
  restart(ctx){ makeLayer(); cleared = 0; lastP = null; conf = null; done = false; checkT = 0; },
  scratch(x, y, ctx){
    if(done) return;
    const lx = x - FIELD.x, ly = y - FIELD.y;
    lg.globalCompositeOperation = 'destination-out'; lg.lineCap = 'round'; lg.lineWidth = 46;
    lg.beginPath(); if(lastP) lg.moveTo(lastP[0], lastP[1]); else lg.moveTo(lx - .1, ly);
    lg.lineTo(lx, ly); lg.stroke(); lg.globalCompositeOperation = 'source-over';
    if(lx > -20 && ly > -20 && lx < FIELD.w + 20 && ly < FIELD.h + 20 && Math.random() < .5) ctx.noise(0, .05, .05, 2500 + Math.random()*2000);
    lastP = [lx, ly];
  },
  onTap(x, y, ctx){ lastP = null; this.scratch(x, y, ctx); },
  onDrag(x, y, ctx){ this.scratch(x, y, ctx); },
  onRelease(){ lastP = null; },
  update(dt, ctx){
    checkT -= dt;
    if(!done && checkT <= 0){
      checkT = .3;
      const d = lg.getImageData(0, 0, FIELD.w, FIELD.h).data; let clear = 0, n = 0;
      for(let i=3;i<d.length;i+=64){ n++; if(d[i] < 40) clear++; }
      cleared = clear/n;
      if(cleared > .6){
        done = true; doneT = ctx.t; conf = confetti(150);
        ctx.melody([['G4',.5],['C5',.5],['E5',.5],['G5',1],['E5',.5],['G5',2]], 140, 'square', .08);
        ctx.noise(0, .6, .12, 2000);
        setTimeout(() => ctx.showAgain(true), 3000);
      }
    }
  },
  draw(g, ctx){
    // Gewinn-Fläche
    g.fillStyle = '#fff8e1'; g.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
    g.strokeStyle = '#d4a017'; g.lineWidth = 4; g.strokeRect(FIELD.x + 6, FIELD.y + 6, FIELD.w - 12, FIELD.h - 12);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#9d0208'; let fs = Math.round(FIELD.h*.13); g.font = `italic bold ${fs}px Georgia, serif`;
    while(g.measureText(TEXT).width > FIELD.w - 40 && fs > 14){ fs--; g.font = `italic bold ${fs}px Georgia, serif`; }
    g.fillText(TEXT, FIELD.x + FIELD.w/2, FIELD.y + FIELD.h*.26);
    g.fillStyle = '#370617'; g.font = `bold ${Math.round(FIELD.h*.105)}px Georgia, serif`;
    wrapText(g, TEXT2, FIELD.x + FIELD.w/2, FIELD.y + FIELD.h*.55, FIELD.w - 40, FIELD.h*.15);
    // Rubbelschicht (fällt am Ende ab)
    if(!done) g.drawImage(layer, FIELD.x, FIELD.y);
    else { const k = (ctx.t - doneT); if(k < 1){ g.globalAlpha = 1 - k; g.drawImage(layer, FIELD.x, FIELD.y + k*k*400); g.globalAlpha = 1; } }
    if(conf) drawConfetti(g, conf, 1/60);
    if(!done && cleared < .05 && ctx.t > 1){ g.globalAlpha = .6 + .4*Math.sin(ctx.t*4); bigText(g, '👆 Rubbeln!', FIELD.x + FIELD.w/2, FIELD.y + FIELD.h + 50, 38, '#fff', 'rgba(60,10,90,.85)'); g.globalAlpha = 1; }
  }
};
startCard(scene);
