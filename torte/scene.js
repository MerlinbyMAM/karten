// Geburtstagstorte: Kerzen flackern, durch Antippen auspusten -> Konfetti + Happy Birthday
import { startCard, confetti, drawConfetti, bigText, rnd } from '../core/card.js';
import { CANDLES } from './data.js';          // Flammen-Positionen (aus dem Kartenbild ermittelt)

let flames, smoke, conf, done, doneT;
const name = new URLSearchParams(location.search).get('name');

const scene = {
  title: 'Happy Birthday!', subtitle: 'Wünsch dir was – und puste die Kerzen aus!', emoji: '🎂',
  accent: '#f3c98b', button: '#d9718f', bg: '#5a3a44',
  images: { off: 'kerzen_aus.png' },          // Kartenbild ohne Flammen (nur Kerzenbereich)
  init(ctx){ this.restart(ctx); },
  restart(ctx){
    flames = CANDLES.map(c => ({...c, on: true, ph: rnd(0, 6)}));
    smoke = []; conf = []; done = false; doneT = 0;
    ctx.tone(660, 0, .15); ctx.tone(880, .1, .2);
  },
  onTap(x, y, ctx){
    if(done) return;
    for(const f of flames){
      if(f.on && Math.abs(x - f.x) < 34 && y > f.y - 60 && y < f.y + 90){
        f.on = false;
        for(let i=0;i<10;i++) smoke.push({x:f.x+rnd(-4,4), y:f.y, vx:rnd(-12,12), vy:rnd(-55,-30), r:rnd(4,8), a:.55});
        ctx.noise(0, .35, .22, 1200);                 // Pusten
        ctx.tone(rnd(500,700), .05, .15, 'sine', .06);
        if(flames.every(f => !f.on)){
          done = true; doneT = 0; conf = confetti(160);
          // Happy Birthday (gemeinfrei)
          ctx.melody([['G4',.75],['G4',.25],['A4',1],['G4',1],['C5',1],['B4',2],['G4',.75],['G4',.25],['A4',1],['G4',1],['D5',1],['C5',2],['G4',.75],['G4',.25],['G5',1],['E5',1],['C5',1],['B4',1],['A4',2],['F5',.75],['F5',.25],['E5',1],['C5',1],['D5',1],['C5',2.5]], 180, 'triangle', .14, .4);
          setTimeout(() => ctx.showAgain(true), 2500);
        }
        return;
      }
    }
  },
  onDrag(x, y, ctx){ this.onTap(x, y, ctx); },     // Wischen über die Kerzen pustet auch aus
  update(dt){
    for(const s of smoke){ s.x += s.vx*dt; s.y += s.vy*dt; s.r += 10*dt; s.a -= .35*dt; }
    smoke = smoke.filter(s => s.a > 0);
    if(done) doneT += dt;
  },
  draw(g, ctx){
    // Flammenbereich der Karte abdecken (Kerzen ohne Flammen) und eigene, lebendige Flammen malen
    if(ctx.img.off) g.drawImage(ctx.img.off, CANDLES.box.x, CANDLES.box.y, CANDLES.box.w, CANDLES.box.h);
    for(const f of flames){
      if(!f.on) continue;
      const t = ctx.t*9 + f.ph, fl = 1 + Math.sin(t)*.08 + Math.sin(t*2.3)*.05;
      const h = f.h*fl, w = f.w*(1 + Math.sin(t*1.7)*.06);
      const gl = g.createRadialGradient(f.x, f.y - h*.35, 1, f.x, f.y - h*.35, h*1.6);
      gl.addColorStop(0, 'rgba(255,220,140,.55)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(f.x, f.y - h*.35, h*1.6, 0, 7); g.fill();
      const gr = g.createLinearGradient(0, f.y - h, 0, f.y);
      gr.addColorStop(0, 'rgba(255,250,220,.95)'); gr.addColorStop(.55, 'rgba(255,190,60,.95)'); gr.addColorStop(1, 'rgba(255,120,30,.9)');
      g.fillStyle = gr; g.beginPath();
      g.moveTo(f.x + Math.sin(t*1.3)*w*.25, f.y - h);
      g.quadraticCurveTo(f.x + w*.55, f.y - h*.35, f.x, f.y);
      g.quadraticCurveTo(f.x - w*.55, f.y - h*.35, f.x + Math.sin(t*1.3)*w*.25, f.y - h);
      g.fill();
    }
    for(const s of smoke){ g.fillStyle = `rgba(230,230,235,${s.a})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }
    if(!done && ctx.t < 6){
      g.save(); g.globalAlpha = Math.min(1, ctx.t*1.5) * Math.min(1, (6-ctx.t));
      bigText(g, 'Tippe die Kerzen aus!', 300, 820, 40, '#fff', 'rgba(150,60,90,.85)'); g.restore();
    }
    if(done){
      g.fillStyle = `rgba(40,20,30,${Math.min(.35, doneT*.3)})`; g.fillRect(0,0,600,900);
      drawConfetti(g, conf, 1/60);
      const s = 1 + Math.sin(ctx.t*4)*.03;
      g.save(); g.translate(300, 470); g.scale(s, s);
      bigText(g, name ? 'Alles Gute,' : 'Alles Gute', 0, -40, 66);
      bigText(g, name ? name + '!' : 'zum Geburtstag!', 0, 40, name ? 72 : 52);
      g.restore();
    }
  }
};
startCard(scene);
