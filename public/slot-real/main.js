import { SlotEngine } from './engine/SlotEngine.js';
import { UI } from './ui/UI.js';

const app = new PIXI.Application({
  width: 400,
  height: 600,
  backgroundColor: 0x1a0000,
  antialias: true
});

document.body.appendChild(app.view);

const engine = new SlotEngine(app);
const ui = new UI(app);

let balance = 1000;
let bet = 10;

ui.setSpinCallback(() => {
  if (engine.isSpinning) return;
  if (balance < bet) {
    alert('Saldo insuficiente!');
    return;
  }
  
  balance -= bet;
  ui.updateBalance(balance);
  ui.setSpinning(true);
  
  engine.spin();
});

// Game loop
app.ticker.add(() => {
  engine.update();
  
  // Verificar se o spin terminou
  if (!engine.isSpinning && ui.spinText.text === 'GIRANDO...') {
    ui.setSpinning(false);
    
    const winMultiplier = engine.checkWin();
    if (winMultiplier > 0) {
      const winAmount = bet * winMultiplier;
      balance += winAmount;
      ui.updateBalance(balance);
      ui.updateWin(winAmount);
      ui.showWinEffect(winAmount);
    } else {
      ui.updateWin(0);
    }
  }
});

// Animação de glow no botão spin
let glowIntensity = 0;
app.ticker.add(() => {
  glowIntensity += 0.05;
  ui.spinGlow.alpha = 0.3 + Math.sin(glowIntensity) * 0.2;
});

console.log('TIGERBET Slot Real carregado!');
