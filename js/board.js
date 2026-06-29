const COLS = 10;
const ROWS = 20;

class Board {
  constructor() {
    this.grid = this._empty();
  }

  _empty() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  reset() {
    this.grid = this._empty();
  }

  isValid(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const nx = piece.x + c;
        const ny = piece.y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny >= 0 && this.grid[ny][nx]) return false;
      }
    }
    return true;
  }

  lock(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const ny = piece.y + r;
        const nx = piece.x + c;
        if (ny < 0) return false; // locked above board = game over
        this.grid[ny][nx] = piece.color;
      }
    }
    return true;
  }

  clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== 0)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(0));
        cleared++;
        r++; // re-check same row index after splice
      }
    }
    return cleared;
  }
}
