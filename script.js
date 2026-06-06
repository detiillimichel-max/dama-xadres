class DamasGame {
  constructor() {
    this.size = 8;
    this.board = [];
    this.current = 1;
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
    document.getElementById('dot-player').className = `dot ${this.playerColor}`;
    document.getElementById('dot-computer').className = `dot ${this.computerColor}`;
  }

  updateScores(){
    document.getElementById('score-player').textContent = this.capturesPlayer;
    document.getElementById('score-computer').textContent = this.capturesComputer;
  }

  updateStatus(msg){
    this.statusEl.textContent = `${msg} | Regra: ${this.rules.charAt(0).toUpperCase()+this.rules.slice(1)}`;
  }

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
        const max = Math.max(...captures.map(m=>m.captures.length));
        return captures.filter(m=>m.captures.length===max);
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
    const forward = player===1? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];

    const capDirs = isKing || this.rules==='brasileira'? dirs : forward;
    for(const [dr,dc] of capDirs){
      if(isKing && this.rules==='brasileira'){
        let nr=r+dr, nc=c+dc;
        while(this.inBounds(nr,nc) && this.board[nr][nc]===0){ nr+=dr; nc+=dc; }
        if(!this.inBounds(nr,nc)) continue;
        if(this.board[nr][nc]*player<0){
          const lr=nr+dr, lc=nc+dc;
          if(this.inBounds(lr,lc) && this.board[lr][lc]===0){
            const seq = this.simulateCapture(r,c,lr,lc,nr,nc,player,0);
            if(seq) captures.push(seq);
          }
        }
      }else{
        const mr=r+dr, mc=c+dc, lr=r+2*dr, lc=c+2*dc;
        if(this.inBounds(lr,lc) && this.board[mr][mc]*player<0 && this.board[lr][lc]===0){
          const seq = this.simulateCapture(r,c,lr,lc,mr,mc,player,0);
          if(seq) captures.push(seq);
        }
      }
    }
    if(captures.length) return {moves:[],captures};

    const moveDirs = isKing? dirs : forward;
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

  simulateCapture(fr,fc,tr,tc,cr,cc,player,depth){
    if(depth>12) return null;
    const boardCopy = this.board.map(row=>row.slice());
    const piece = boardCopy[fr][fc];
    boardCopy[fr][fc]=0;
    boardCopy[cr][cc]=0;
    let newPiece = piece;
    if(!this.isKing(piece) && ((player===1 && tr===0)||(player===-1 && tr===7))){
      newPiece = player*2;
    }
    boardCopy[tr][tc]=newPiece;
    const further = this.findFurtherCaptures(tr,tc,boardCopy,player,depth+1);
    if(further.length){
      const best = further.reduce((a,b)=>a.captures.length>=b.captures.length?a:b);
      return {
        from:[fr,fc],
        to:best.to,
        captures:[[cr,cc],...best.captures]
      };
    }
    return {from:[fr,fc],to:[tr,tc],captures:[[cr,cc]]};
  }

  findFurtherCaptures(r,c,board,player,depth){
    if(depth>12) return [];
    const piece = board[r][c];
    const isKing = this.isKing(piece);
    const dirs = isKing || this.rules==='brasileira'? [[-1,-1],[-1,1],[1,-1],[1,1]] : (player===1?[[-1,-1],[-1,1]]:[[1,-1],[1,1]]);
    const results=[];
    for(const [dr,dc] of dirs){
      if(isKing && this.rules==='brasileira'){
        let nr=r+dr, nc=c+dc;
        while(this.inBounds(nr,nc) && board[nr][nc]===0){nr+=dr;nc+=dc;}
        if(!this.inBounds(nr,nc)) continue;
        if(board[nr][nc]*player<0){
          const lr=nr+dr, lc=nc+dc;
          if(this.inBounds(lr,lc) && board[lr][lc]===0){
            const nb=board.map(row=>row.slice());
            nb[r][c]=0; nb[nr][nc]=0; nb[lr][lc]=piece;
            const deeper=this.findFurtherCaptures(lr,lc,nb,player,depth+1);
            if(deeper.length){
              results.push({to:deeper[0].to,captures:[[nr,nc],...deeper[0].captures]});
            }else{
              results.push({to:[lr,lc],captures:[[nr,nc]]});
            }
          }
        }
      }else{
        const mr=r+dr, mc=c+dc, lr=r+2*dr, lc=c+2*dc;
        if(this.inBounds(lr,lc) && board[mr][mc]*player<0 && board[lr][lc]===0){
          const nb=board.map(row=>row.slice());
          nb[r][c]=0; nb[mr][mc]=0; nb[lr][lc]=piece;
          const deeper=this.findFurtherCaptures(lr,lc,nb,player,depth+1);
          if(deeper.length){
            results.push({to:deeper[0].to,captures:[[mr,mc],...deeper[0].captures]});
          }else{
            results.push({to:[lr,lc],captures:[[mr,mc]]});
          }
        }
      }
    }
    return results;
  }

  render(){
    this.boardEl.innerHTML='';
    const allMoves = this.current===1? this.getAllMoves(1) : [];
    const mustCapture = allMoves.some(m=>m.captures.length);
    const captureFrom = new Set(allMoves.filter(m=>m.captures.length).map(m=>m.from[0]+','+m.from[1]));

    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        const sq=document.createElement('div');
        sq.className=`square ${(r+c)%2===0?'light':'dark'}`;
        if((r+c)%2===1) sq.classList.add('playable');
        const piece=this.board[r][c];
        if(piece!==0){
          const p=document.createElement('div');
          const color = piece>0? this.playerColor : this.computerColor;
          p.className=`piece ${color} ${this.isKing(piece)?'king':''}`;
          if(this.selected && this.selected[0]===r && this.selected[1]===c) p.classList.add('selected');
          if(mustCapture && piece>0 && captureFrom.has(r+','+c)) p.classList.add('selected');
          sq.appendChild(p);
        }
        const isTarget=this.legalMoves.some(m=>m.to[0]===r && m.to[1]===c);
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
    if(this.current!==1) return;
    const piece=this.board[r][c];
    if(this.selected){
      const move=this.legalMoves.find(m=>m.to[0]===r && m.to[1]===c);
      if(move){ this.makeMove(move); return; }
    }
    if(piece>0){
      this.selected=[r,c];
      const all=this.getAllMoves(1);
      const pieceMoves=all.filter(m=>m.from[0]===r && m.from[1]===c);
      this.legalMoves=pieceMoves;
      if(this.legalMoves.length===0 && all.some(m=>m.captures.length)){
        this.updateStatus('Captura obrigatória em outra peça!');
        this.selected=null;
      }
      this.render();
    }else{
      this.selected=null;
      this.legalMoves=[];
      this.render();
    }
  }

  makeMove(move){
    this.history.push({
      board:this.board.map(r=>r.slice()),
      current:this.current,
      capturesPlayer:this.capturesPlayer,
      capturesComputer:this.capturesComputer
    });
    const [fr,fc]=move.from;
    const [tr,tc]=move.to;
    const piece=this.board[fr][fc];
    this.board[fr][fc]=0;
    for(const [cr,cc] of move.captures){
      const cap=this.board[cr][cc];
      if(cap<0) this.capturesPlayer++;
      if(cap>0) this.capturesComputer++;
      this.board[cr][cc]=0;
    }
    let newPiece=piece;
    if(!this.isKing(piece) && ((piece>0 && tr===0)||(piece<0 && tr===7))){
      newPiece=piece>0?2:-2;
    }
    this.board[tr][tc]=newPiece;
    this.selected=null;
    this.legalMoves=[];
    this.current*=-1;
    this.updateScores();
    this.render();
    if(this.checkGameOver()) return;
    if(this.current===-1){
      this.updateStatus('Vez do oponente...');
      setTimeout(()=>this.computerMove(),600);
    }else{
      this.updateStatus('Sua vez!');
    }
  }

  computerMove(){
    const moves=this.getAllMoves(-1);
    if(moves.length===0){ this.updateStatus('Você venceu!'); return; }
    moves.sort((a,b)=>b.captures.length-a.captures.length);
    const best=moves.filter(m=>m.captures.length===moves[0].captures.length);
    const choice=best[Math.floor(Math.random()*best.length)];
    this.makeMove(choice);
  }

  checkGameOver(){
    const playerMoves=this.getAllMoves(1).length;
    const compMoves=this.getAllMoves(-1).length;
    if(playerMoves===0){ this.updateStatus('Oponente venceu!'); return true; }
    if(compMoves===0){ this.updateStatus('Você venceu!'); return true; }
    return false;
  }

  undo(){
    if(this.history.length===0) return;
    const last=this.history.pop();
    this.board=last.board.map(r=>r.slice());
    this.current=last.current;
    this.capturesPlayer=last.capturesPlayer;
    this.capturesComputer=last.capturesComputer;
    this.selected=null;
    this.legalMoves=[];
    this.updateScores();
    this.render();
    this.updateStatus('Jogada desfeita');
  }
}

window.addEventListener('DOMContentLoaded',()=>new DamasGame());
