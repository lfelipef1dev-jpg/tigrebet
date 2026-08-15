export class UI {
  constructor(app) {
    this.app = app;
    this.balance = 1000;
    this.bet = 10;
    this.win = 0;
    
    this.createBackground();
    this.createTopBar();
    this.createReelFrame();
    this.createBottomPanel();
    this.createSpinButton();
  }
  
  createBackground() {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x1a0000);
    graphics.drawRect(0, 0, 400, 600);
    graphics.endFill();
    
    // Gradiente overlay
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.3);
    overlay.drawRect(0, 0, 400, 600);
    overlay.endFill();
    
    this.app.stage.addChild(graphics);
    this.app.stage.addChild(overlay);
  }
  
  createTopBar() {
    const bar = new PIXI.Graphics();
    bar.beginFill(0x8B0000);
    bar.drawRoundedRect(10, 10, 380, 60, 10);
    bar.endFill();
    
    // Borda dourada
    const border = new PIXI.Graphics();
    border.lineStyle(3, 0xFFD700);
    border.drawRoundedRect(10, 10, 380, 60, 10);
    
    this.app.stage.addChild(bar);
    this.app.stage.addChild(border);
    
    // Saldo
    this.balanceText = new PIXI.Text(`SALDO: R$ ${this.balance}`, {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 5
    });
    this.balanceText.x = 25;
    this.balanceText.y = 30;
    this.app.stage.addChild(this.balanceText);
    
    // Ganho
    this.winText = new PIXI.Text(`GANHO: R$ ${this.win}`, {
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x00FF00,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 5
    });
    this.winText.x = 200;
    this.winText.y = 30;
    this.app.stage.addChild(this.winText);
  }
  
  createReelFrame() {
    const frame = new PIXI.Graphics();
    frame.lineStyle(5, 0xFFD700);
    frame.drawRoundedRect(30, 90, 340, 320, 15);
    
    // Fundo dos reels
    const background = new PIXI.Graphics();
    background.beginFill(0x0a0000);
    background.drawRoundedRect(35, 95, 330, 310, 12);
    background.endFill();
    
    this.app.stage.addChild(background);
    this.app.stage.addChild(frame);
  }
  
  createBottomPanel() {
    const panel = new PIXI.Graphics();
    panel.beginFill(0x8B0000);
    panel.drawRoundedRect(10, 430, 380, 80, 10);
    panel.endFill();
    
    const border = new PIXI.Graphics();
    border.lineStyle(3, 0xFFD700);
    border.drawRoundedRect(10, 430, 380, 80, 10);
    
    this.app.stage.addChild(panel);
    this.app.stage.addChild(border);
    
    // Botões de aposta
    this.createBetButton('-', 30, 445);
    this.createBetButton('+', 340, 445);
    
    // Display de aposta
    this.betText = new PIXI.Text(`R$ ${this.bet}`, {
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFD700,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 5
    });
    this.betText.anchor.set(0.5);
    this.betText.x = 200;
    this.betText.y = 470;
    this.app.stage.addChild(this.betText);
  }
  
  createBetButton(label, x, y) {
    const button = new PIXI.Graphics();
    button.beginFill(0xFFD700);
    button.drawCircle(x, y, 25);
    button.endFill();
    
    const text = new PIXI.Text(label, {
      fontSize: 28,
      fontWeight: 'bold',
      fill: 0x000000
    });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    
    this.app.stage.addChild(button);
    this.app.stage.addChild(text);
  }
  
  createSpinButton() {
    this.spinButton = new PIXI.Graphics();
    
    const drawButton = () => {
      this.spinButton.clear();
      this.spinButton.beginFill(0xFF0000);
      this.spinButton.lineStyle(4, 0xFFD700);
      this.spinButton.drawRoundedRect(50, 530, 300, 60, 15);
      this.spinButton.endFill();
    };
    
    drawButton();
    
    // Glow effect
    this.spinGlow = new PIXI.Graphics();
    this.spinGlow.beginFill(0xFF0000, 0.5);
    this.spinGlow.drawRoundedRect(50, 530, 300, 60, 15);
    this.spinGlow.endFill();
    this.spinGlow.alpha = 0;
    
    this.spinText = new PIXI.Text('SPIN', {
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 10
    });
    this.spinText.anchor.set(0.5);
    this.spinText.x = 200;
    this.spinText.y = 560;
    
    this.app.stage.addChild(this.spinGlow);
    this.app.stage.addChild(this.spinButton);
    this.app.stage.addChild(this.spinText);
    
    // Interatividade
    this.spinButton.eventMode = 'static';
    this.spinButton.cursor = 'pointer';
    
    this.spinButton.on('pointerdown', () => {
      this.onSpinClick();
    });
  }
  
  onSpinClick() {
    // Será definido externamente
  }
  
  setSpinCallback(callback) {
    this.onSpinClick = callback;
  }
  
  setSpinning(isSpinning) {
    if (isSpinning) {
      this.spinGlow.alpha = 1;
      this.spinText.text = 'GIRANDO...';
    } else {
      this.spinGlow.alpha = 0;
      this.spinText.text = 'SPIN';
    }
  }
  
  updateBalance(amount) {
    this.balance = amount;
    this.balanceText.text = `SALDO: R$ ${this.balance}`;
  }
  
  updateBet(amount) {
    this.bet = amount;
    this.betText.text = `R$ ${this.bet}`;
  }
  
  updateWin(amount) {
    this.win = amount;
    this.winText.text = `GANHO: R$ ${this.win}`;
  }
  
  showWinEffect(amount) {
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.8);
    overlay.drawRect(0, 0, 400, 600);
    overlay.endFill();
    
    const winText = new PIXI.Text(`GANHOU!\nR$ ${amount}`, {
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0xFFD700,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 15
    });
    winText.anchor.set(0.5);
    winText.x = 200;
    winText.y = 300;
    
    this.app.stage.addChild(overlay);
    this.app.stage.addChild(winText);
    
    setTimeout(() => {
      this.app.stage.removeChild(overlay);
      this.app.stage.removeChild(winText);
    }, 2000);
  }
}
