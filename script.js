class DamasGame {
  constructor() {
    this.size = 8;
    this.board = [];
    this.current = 1; // 1 = player, -1 = computer
    this.selected = null;
    this.legalMoves = [];
    this.history = [];
    this.rules = 'brasileira';
    this.playerColor = 'red';
    this.computerColor = 'blue';
    this.capturesPlayer = 0;
    this.capturesComputer = 0;

    this.boardEl = document.getElementById('board');
    this.statusEl = document.getElementById('status');

    document.getElementById('btn-new').onclick = () => this.newGame();
    document.getElementById('btn-rule').onclick = () => this.toggleRule();
    document.getElementById('btn-undo').onclick = () => this.undo();
    document.getElementById('color-player').onchange = e => { this.playerColor = e.target.value; this.updateDots(); this.render(); };
    document.getElementById('color-computer').onchange = e => { this.computerColor = e.target.value; this.updateDots(); this.render(); };

    this.updateDots();
    this.newGame();
  }

  newGame(){
    this.board = Array.from({length:8},()=>Array(8).fill(0));
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        if((r+c)%2===1){
          if(r<3) this.board[r][c] = -1;
          else if(r>4) this.board[r][c] = 1;
        }
      }
    }
    this.current = 1;
    this.selected = null;
    this.legalMoves = [];
    this.history = [];
    this.capturesPlayer = 0;
    this.capturesComputer = 0;
    this.updateScores();
    this.render();
    this.updateStatus('Sua vez!');
  }

  toggleRule(){
    this.rules = this.rules==='brasileira'? 'americana' : 'brasileira';
    document.getElementById('btn-rule').textContent = `Regra: ${this.rules.charAt(0).toUpperCase()+this.rules.slice(1)}`;
    this.selected = null;
    this.legalMoves = [];
    this.render();
    this.updateStatus('Regra alterada. Sua vez!');
  }

  inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
  isKing(p){ return Math.abs(p)===2; }

  updateDots(){
    document.get
