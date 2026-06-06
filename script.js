class DamasGame {
  constructor() {
    this.size = 8;
    this.board = [];
    this.current = 1; // 1 = red (player), -1 = black (computer)
    this.selected = null;
    this.legalMoves = [];
    this.history = [];
    this.rules = 'brasileira'; // 'brasileira' or 'americana'
    this.capturesRed = 0;
    this.capturesBlack = 0;

    this.boardEl = document.getElementById('board');
    this.statusEl = document.getElementById('status');
    this.scoreRedEl = document.getElementById('score-red');
    this.scoreBlackEl = document.getElementById('score-black');

    document.getElementById('btn-new').onclick = () => this.newGame();
    document.getElementById('btn-rule').onclick = () => this.toggleRule();
    document.getElementById('btn-undo').onclick = () => this.undo();

    this.newGame();
  }

  newGame() {
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
    this.capturesRed = 0;
    this.capturesBlack = 0;
    this.updateScores();
    this.render();
    this.updateStatus('Sua vez!');
  }

  toggleRule(){
    this.rules = this.rules==='brasileira'? 'americana' : 'brasileira';
    document.getElementById('btn-rule').textContent = `Regra: ${this.rules.charAt(0).toUpperCase()+this.rules.slice(1)}`;
    this.updateStatus(`Regra alterada para ${this.rules}. Sua vez!`);
    this.selected = null;
    this.legalMoves = [];
    this.render();
  }

  inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }

  isKing(p){ return Math.abs(p)===2; }

  getAllMoves(player){
    const moves = [];
    const captures = [];
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        if(this.board[r][c]*player>0){
          const res = this.getPieceMoves(r,c);
          if(res.captures.length) captures.push(...res.captures);
          else moves.push(...res.moves);
        }
      }
    }
    if(captures.length){
      if(this.rules==='brasileira'){
        const maxCap = Math.max(...captures.map(m=>m.captures.length));
        return captures.filter(m=>m.captures.length===maxCap);
      }
      return captures;
    }
    return moves;
  }

  getPieceMoves(r,c){
    const piece = this.board[r][c];
    if(!piece) return {moves:[],captures:[]};
    const player = Math.sign(piece);
    const isKing = this.isKing(piece);
    const moves = [];
    const captures = [];

    const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
    const forwardDirs = player===1? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];

    // Captures
    const capDirs = isKing || this.rules==='brasileira'? dirs : forwardDirs;
    for(const [dr,dc] of capDirs){
      if(isKing && this.rules==='brasileira'){
        // flying king capture
        let nr=r+dr, nc=c+dc;
        while(this.inBounds(nr,nc) && this.board[nr][nc]===0){ nr+=dr; nc+=dc; }
        if(!this.inBounds(nr,nc)) continue;
        if(this.board[nr][nc]*player<0){
          let lr=nr+dr, lc=nc+dc;
          while(this.inBounds(lr,lc) && this.board[lr][lc]===0){
            const seq = this.exploreCapture(r,c,lr,lc,nr,nc,player);
            if(seq) captures.push(seq);
            lr+=dr; lc+=dc;
          }
        }
      }else{
        const mr=r+dr, mc=c+dc, lr=r+2*dr, lc=c+2*dc;
        if(this.inBounds(lr,lc) && this.board[mr][mc]*player<0 && this.board[lr][lc]===0){
          const seq = this.exploreCapture(r,c,lr,lc,mr,mc,player);
          if(seq) captures.push(seq);
        }
      }
    }

    if(captures.length) return {moves:[],captures};

    // Simple moves
    const moveDirs = isKing? dirs : forwardDirs;
    for(const [dr,dc] of moveDirs){
      if(isKing && this.rules==='brasileira'){
        let nr=r+dr, nc=c+dc;
        while(this.inBounds(nr,nc) && this.board[nr][nc]===0){
          moves.push({from:[r,c],to:[nr,nc],captures:[]});
          nr+=dr; nc+=dc;
        }
      }else{
        const nr=r+dr, nc=c+dc;
        if(this.inBounds(nr,nc) && this.board[nr][nc]===0){
          moves.push({from:[r,c],to:[nr,nc],captures:[]});
        }
      }
    }
    return {moves,captures};
  }

  exploreCapture(fr,fc,tr,tc,cr,cc,player){
    // Simulate one capture and continue chain
    const boardCopy = this.board.map(row=>row.slice());
    const piece = boardCopy[fr][fc];
    boardCopy[fr][fc]=0;
    boardCopy[cr][cc]=0;
    let newPiece = piece;
    if(!this.isKing(piece) && ((player===1 && tr===0) || (player===-1 && tr===7))){
      newPiece = player*2;
    }
    boardCopy[tr][tc]=newPiece;

    const further = this.findFurtherCaptures(tr,tc,boardCopy,player);
    if(further.length){
      // prepend current capture
      return {
        from:[fr,fc],
        to:further[0].to,
        captures:[[cr,cc],...further[0].captures],
        sequence:true
      };
    }
    return {from:[fr,fc],to:[tr,tc],captures:[[cr,cc]]};
  }

  findFurtherCaptures(r,c,board,player){
    const piece = board[r][c];
    const isKing = this.isKing(piece);
    const dirs = isKing || this.rules==='brasileira'? [[-1,-1],[-1,1],[1,-1],[1,1]] : (player===1?[[-1,-1],[-1,1]]:[[1,-1],[1,1]]);
    const caps=[];
    for(const [dr,dc] of dirs){
      if(isKing && this.rules==='brasileira'){
        let nr=r+dr, nc=c+dc;
        while(this.inBounds(nr,nc) && board[nr][nc]===0){nr+=dr;nc+=dc;}
        if(!this.inBounds(nr,nc)) continue;
        if(board[nr][nc]*player<0){
          let lr=nr+dr, lc=nc+dc;
          while(this.inBounds(lr,lc) && board[lr][lc]===0){
            const nb = board.map(row=>row.slice());
            nb[r][c]=0; nb[nr][nc]=0; nb[lr][lc]=piece;
            const deeper = this.findFurtherCaptures(lr,lc,nb,player);
            if(deeper.length){
              caps.push({to:deeper[0].to,captures:[[nr,nc],...deeper[0].captures]});
            }else{
              caps.push({to:[lr,lc],captures:[[nr,nc]]});
            }
            lr+=dr; lc+=dc;
          }
        }
      }else{
        const mr=r+dr, mc=c+dc, lr=r+2*dr, lc=c+2*dc;
        if(this.inBounds(lr,lc) && board[mr][mc]*player<0 && board[lr][lc]===0){
          const nb = board.map(row=>row.slice());
          nb[r][c]=0; nb[mr][mc]=0; nb[lr][lc]=piece;
          const deeper = this.findFurtherCaptures(lr,lc,nb,player);
          if(deeper.length){
            caps.push({to:deeper[0].to,captures:[[mr,mc],...deeper[0].captures]});
          }else{
            caps.push({to:[lr,lc],captures:[[mr,mc]]});
          }
        }
      }
    }
    return caps;
  }

  render(){
    this.boardEl.innerHTML='';
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const sq=document.createElement('div');
        sq.className=`square ${ (r+c)%2===0?'light':'dark' }`;
        if((r+c)%2===1) sq.classList.add('playable');
        sq.dataset.r=r; sq.dataset.c=c;
        const piece=this.board[r][c];
        if(piece!==0){
          const p=document.createElement('div');
          p.className=`piece ${piece>0?'red':'black'} ${this.isKing(piece)?'king':''}`;
          sq.appendChild(p);
        }
        if(this.selected && this.selected[0]===r && this.selected[1]===c){
          sq.querySelector('.piece')?.classList.add('selected');
        }
        const isTarget = this.legalMoves.some(m=>m.to[0]===r && m.to[1]===c);
        if(isTarget){
          sq.classList.add('highlight');
          if(this.legalMoves.find(m=>m.to[0]===r && m.to[1]===c && m.captures.length)) sq.classList.add('capture');
        }
        sq.onclick=()=>this.onSquareClick(r,c);
        this.boardEl.appendChild(sq);
      }
    }
  }

  onSquareClick(r,c){
    if(this.current!==-1){ // player turn only
      const piece=this.board[r][c];
      if(this.selected){
        const move=this.legalMoves.find(m=>m.to[0]===r && m.to[1]===c);
        if(move){
          this.makeMove(move);
          return;
        }
      }
      if(piece>0){
        this.selected=[r,c];
        const all = this.getAllMoves(1);
        const pieceMoves = all.filter(m=>m.from[0]===r && m.from[1]===c);
        this.legalMoves = pieceMoves.length? pieceMoves : [];
        // If no piece-specific moves but captures exist elsewhere, force capture
        if(this.legalMoves.length===0 && all.some(m=>m.captures.length)){
          this.legalMoves=[];
          this.selected=null;
          this.updateStatus('Captura obrigatória em outra peça!');
        }
        this.render();
      }else{
        this.selected=null;
        this.legalMoves=[];
        this.render();
      }
    }
  }

  makeMove(move){
    this.history.push({
      board:this.board.map(r=>r.slice()),
      current:this.current,
      capturesRed:this.capturesRed,
      capturesBlack:this.capturesBlack
    });
    const [fr,fc]=move.from;
    const [tr,tc]=move.to;
    const piece=this.board[fr][fc];
    this.board[fr][fc]=0;
    // remove captured
    for(const [cr,cc] of move.captures){
      const cap=this.board[cr][cc];
      if(cap<0) this.capturesRed++;
      if(cap>0) this.capturesBlack++;
      this.board[cr][cc]=0;
    }
    let newPiece=piece;
    if(!this.isKing(piece) && ((piece>0 && tr===0) || (piece<0 && tr===7))){
      newPiece=piece>0?2:-2;
    }
    this.board[tr][tc]=newPiece;
    this.selected=null;
    this.legalMoves=[];
    this.current*=-1;
    this.updateScores();
    this.render();
    this.checkGameOver();
    if(this.current===-1){
      this.updateStatus('Vez do computador...');
      setTimeout(()=>this.computerMove(),600);
    }else{
      this.updateStatus('Sua vez!');
    }
  }

  computerMove(){
    const moves=this.getAllMoves(-1);
    if(moves.length===0){ this.updateStatus('Você venceu!'); return; }
    // Prefer captures with most pieces
    moves.sort((a,b)=>b.captures.length-a.captures.length);
    const bestCap = moves[0].captures.length;
    const best = moves.filter(m=>m.captures.length===bestCap);
    const choice = best[Math.floor(Math.random()*best.length)];
    this.makeMove(choice);
  }

  checkGameOver(){
    const redMoves=this.getAllMoves(1).length;
    const blackMoves=this.getAllMoves(-1).length;
    if(redMoves===0){ this.updateStatus('Computador venceu!'); }
    if(blackMoves===0){ this.updateStatus('Você venceu!'); }
  }

  updateScores(){
    this.scoreRedEl.textContent=this.capturesRed;
    this.scoreBlackEl.textContent=this.capturesBlack;
  }

  updateStatus(msg){
    this.statusEl.textContent=`${msg} | Regra: ${this.rules.charAt(0).toUpperCase()+this.rules.slice(1)}`;
  }

  undo(){
    if(this.history.length===0) return;
    const last=this.history.pop();
    this.board=last.board.map(r=>r.slice());
    this.current=last.current;
    this.capturesRed=last.capturesRed;
    this.capturesBlack=last.capturesBlack;
    this.selected=null;
    this.legalMoves=[];
    this.updateScores();
    this.render();
    this.updateStatus('Jogada desfeita');
  }
}

window.addEventListener('DOMContentLoaded',()=>new DamasGame());
