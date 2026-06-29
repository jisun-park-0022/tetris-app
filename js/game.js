const BLOCK_SIZE = 30;
const DROP_INTERVAL = 500;

class Game {
  constructor() {
    this.canvas = document.getElementById('board');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('next');
    this.nextCtx = this.nextCanvas.getContext('2d');
    this.scoreEl = document.getElementById('score');
    this.overlay = document.getElementById('overlay');

    this.canvas.width = COLS * BLOCK_SIZE;
    this.canvas.height = ROWS * BLOCK_SIZE;

    this.board = new Board();
    this.score = 0;
    this.current = null;
    this.next = null;
    this.gameOver = false;
    this.lastTime = 0;
    this.dropCounter = 0;
    this.animId = null;

    this.startOverlay = document.getElementById('start-overlay');
    this.audio = new AudioManager();

    document.addEventListener('keydown', e => this._onKey(e));
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startOverlay.classList.add('hidden');
      this.reset();
    });

    const muteBtn = document.getElementById('muteBtn');
    muteBtn.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      muteBtn.textContent = isMuted ? '🔇 Music' : '🔊 Music';
    });
  }

  reset() {
    this.board.reset();
    this.score = 0;
    this.scoreEl.textContent = '0';
    this.gameOver = false;
    this.dropCounter = 0;
    this.lastTime = 0;
    this.overlay.classList.add('hidden');
    this.audio.start();
    this.next = this._spawn();
    this._nextPiece();
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame(ts => this._loop(ts));
  }

  _spawn() {
    const type = PIECES[Math.floor(Math.random() * PIECES.length)];
    const p = new Piece(type);
    p.x = Math.floor((COLS - p.shape[0].length) / 2);
    p.y = 0;
    return p;
  }

  _nextPiece() {
    this.current = this.next;
    this.next = this._spawn();
    if (!this.board.isValid(this.current)) {
      this._endGame();
    }
    this._drawNext();
  }

  _loop(timestamp) {
    if (this.gameOver) return;
    if (this.lastTime === 0) this.lastTime = timestamp;
    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.dropCounter += delta;
    if (this.dropCounter >= DROP_INTERVAL) {
      this._drop();
      this.dropCounter = 0;
    }
    this._render();
    this.animId = requestAnimationFrame(ts => this._loop(ts));
  }

  _drop() {
    this.current.y++;
    if (!this.board.isValid(this.current)) {
      this.current.y--;
      this._lock();
    }
  }

  _lock() {
    const ok = this.board.lock(this.current);
    if (!ok) { this._endGame(); return; }
    const lines = this.board.clearLines();
    if (lines > 0) {
      this.score += lines * 100;
      this.scoreEl.textContent = this.score;
    }
    this._nextPiece();
  }

  _hardDrop() {
    while (this.board.isValid(this.current)) {
      this.current.y++;
    }
    this.current.y--;
    this._lock();
    this.dropCounter = 0;
  }

  _ghostY() {
    const ghost = this.current.clone();
    while (this.board.isValid(ghost)) ghost.y++;
    ghost.y--;
    return ghost.y;
  }

  _onKey(e) {
    if (this.gameOver) return;
    switch (e.code) {
      case 'ArrowLeft':
        this.current.x--;
        if (!this.board.isValid(this.current)) this.current.x++;
        break;
      case 'ArrowRight':
        this.current.x++;
        if (!this.board.isValid(this.current)) this.current.x--;
        break;
      case 'ArrowDown':
        this._drop();
        this.dropCounter = 0;
        break;
      case 'ArrowUp': {
        this.current.rotate();
        if (!this.board.isValid(this.current)) {
          // wall kick: try shifting left/right
          this.current.x--;
          if (!this.board.isValid(this.current)) {
            this.current.x += 2;
            if (!this.board.isValid(this.current)) {
              this.current.x--;
              // undo rotate
              for (let i = 0; i < 3; i++) this.current.rotate();
            }
          }
        }
        break;
      }
      case 'Space':
        e.preventDefault();
        this._hardDrop();
        break;
    }
  }

  _drawIdleBoard() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  _endGame() {
    this.gameOver = true;
    this.audio.stop();
    this.overlay.classList.remove('hidden');
    document.getElementById('finalScore').textContent = this.score;
  }

  _render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }

    // locked blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.board.grid[r][c]) {
          this._drawBlock(ctx, c, r, this.board.grid[r][c]);
        }
      }
    }

    // ghost piece
    const ghostY = this._ghostY();
    for (let r = 0; r < this.current.shape.length; r++) {
      for (let c = 0; c < this.current.shape[r].length; c++) {
        if (!this.current.shape[r][c]) continue;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(
          (this.current.x + c) * BLOCK_SIZE + 1,
          (ghostY + r) * BLOCK_SIZE + 1,
          BLOCK_SIZE - 2, BLOCK_SIZE - 2
        );
      }
    }

    // current piece
    for (let r = 0; r < this.current.shape.length; r++) {
      for (let c = 0; c < this.current.shape[r].length; c++) {
        if (!this.current.shape[r][c]) continue;
        this._drawBlock(ctx, this.current.x + c, this.current.y + r, this.current.color);
      }
    }
  }

  _drawBlock(ctx, col, row, color) {
    const x = col * BLOCK_SIZE;
    const y = row * BLOCK_SIZE;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x + 1, y + BLOCK_SIZE - 5, BLOCK_SIZE - 2, 4);
  }

  _drawNext() {
    const ctx = this.nextCtx;
    const s = 24;
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    const p = this.next;
    const offsetX = Math.floor((this.nextCanvas.width / s - p.shape[0].length) / 2);
    const offsetY = Math.floor((this.nextCanvas.height / s - p.shape.length) / 2);
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        ctx.fillStyle = p.color;
        ctx.fillRect((offsetX + c) * s + 1, (offsetY + r) * s + 1, s - 2, s - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect((offsetX + c) * s + 1, (offsetY + r) * s + 1, s - 2, 3);
      }
    }
  }
}

window.addEventListener('load', () => {
  const game = new Game();
  game._drawIdleBoard();
});
