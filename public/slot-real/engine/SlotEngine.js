import { Reel } from './Reel.js';

export class SlotEngine {
  constructor(app) {
    this.app = app;
    this.symbols = ['🐯', '💰', '💎', '7️⃣', '🍀'];
    this.reels = [];
    this.isSpinning = false;
    this.finalResult = [];
    
    this.createReels();
  }
  
  createReels() {
    const reelWidth = 100;
    const reelHeight = 300;
    const startX = 50;
    const startY = 100;
    const gap = 20;
    
    for (let i = 0; i < 3; i++) {
      const reel = new Reel(
        this.app,
        startX + i * (reelWidth + gap),
        startY,
        this.symbols
      );
      this.reels.push(reel);
    }
  }
  
  spin() {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    this.finalResult = [];
    
    // Gerar resultado final
    for (let i = 0; i < 3; i++) {
      this.finalResult.push(this.symbols[Math.floor(Math.random() * this.symbols.length)]);
    }
    
    // Iniciar reels com delay
    const baseTarget = 1000;
    this.reels.forEach((reel, index) => {
      const delay = index * 300;
      const target = baseTarget + index * 500;
      reel.spin(target, delay);
    });
  }
  
  update() {
    this.reels.forEach(reel => reel.update());
    
    // Verificar se todos pararam
    if (this.isSpinning && this.reels.every(reel => !reel.isSpinning)) {
      this.isSpinning = false;
      this.setFinalSymbols();
      return true; // Spin completo
    }
    
    return false;
  }
  
  setFinalSymbols() {
    this.reels.forEach((reel, index) => {
      reel.setFinalSymbols([this.finalResult[index]]);
    });
  }
  
  checkWin() {
    if (this.finalResult[0] === this.finalResult[1] && 
        this.finalResult[1] === this.finalResult[2]) {
      return this.getMultiplier(this.finalResult[0]);
    }
    return 0;
  }
  
  getMultiplier(symbol) {
    const multipliers = {
      '🐯': 10,
      '💰': 5,
      '💎': 3,
      '7️⃣': 2,
      '🍀': 1
    };
    return multipliers[symbol] || 1;
  }
}
