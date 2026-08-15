export class Reel {
  constructor(app, x, y, symbols) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    
    this.symbols = symbols;
    this.position = 0;
    this.targetPosition = 0;
    this.speed = 0;
    this.isSpinning = false;
    this.blur = new PIXI.filters.BlurFilter();
    this.blur.blurY = 0;
    this.container.filters = [this.blur];
    
    this.symbolContainers = [];
    this.createSymbols();
    
    app.stage.addChild(this.container);
  }
  
  createSymbols() {
    const symbolHeight = 100;
    const numSymbols = 5;
    
    for (let i = 0; i < numSymbols; i++) {
      const symbolContainer = new PIXI.Container();
      symbolContainer.y = i * symbolHeight;
      
      const text = new PIXI.Text(this.symbols[Math.floor(Math.random() * this.symbols.length)], {
        fontSize: 60,
        fontWeight: 'bold',
        fill: 0xFFD700,
        stroke: 0xFFA500,
        strokeThickness: 2,
        dropShadow: true,
        dropShadowColor: 0x000000,
        dropShadowBlur: 10
      });
      text.anchor.set(0.5);
      text.x = 50;
      
      symbolContainer.addChild(text);
      this.symbolContainers.push(symbolContainer);
      this.container.addChild(symbolContainer);
    }
  }
  
  spin(targetPosition, delay) {
    setTimeout(() => {
      this.isSpinning = true;
      this.targetPosition = this.position + targetPosition;
      this.speed = 0;
    }, delay);
  }
  
  update() {
    if (this.isSpinning) {
      // Acelerar
      if (this.speed < 30) {
        this.speed += 2;
      }
      
      this.position += this.speed;
      this.blur.blurY = this.speed * 0.5;
      
      // Verificar se atingiu o alvo
      if (this.position >= this.targetPosition) {
        this.position = this.targetPosition;
        this.speed = 0;
        this.isSpinning = false;
        this.blur.blurY = 0;
        this.snapToPosition();
      }
      
      // Atualizar posição dos símbolos
      this.updateSymbolPositions();
    }
  }
  
  updateSymbolPositions() {
    const symbolHeight = 100;
    const totalHeight = this.symbolContainers.length * symbolHeight;
    
    this.symbolContainers.forEach((container, index) => {
      let y = (this.position + index * symbolHeight) % totalHeight;
      
      // Wrap around
      if (y < 0) y += totalHeight;
      
      container.y = y;
      
      // Mudar símbolo quando passa pela posição inicial
      if (y < symbolHeight && this.isSpinning) {
        const text = container.getChildAt(0);
        text.text = this.symbols[Math.floor(Math.random() * this.symbols.length)];
      }
    });
  }
  
  snapToPosition() {
    const symbolHeight = 100;
    const index = Math.floor(this.position / symbolHeight) % this.symbolContainers.length;
    
    this.symbolContainers.forEach((container, i) => {
      container.y = i * symbolHeight;
      const text = container.getChildAt(0);
      text.text = this.symbols[(index + i) % this.symbols.length];
    });
    
    this.position = 0;
  }
  
  setFinalSymbols(symbols) {
    this.symbolContainers.forEach((container, index) => {
      const text = container.getChildAt(0);
      if (index < 3) {
        text.text = symbols[index];
      }
    });
  }
}
