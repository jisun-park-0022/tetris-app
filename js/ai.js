class TetrisAI {
  getBestMove(board, piece) {
    let bestScore = -Infinity;
    let bestRotations = 0;
    let bestX = piece.x;

    const candidate = piece.clone();

    for (let rotations = 0; rotations < 4; rotations++) {
      const pieceWidth = candidate.shape[0].length;

      for (let x = 0; x <= COLS - pieceWidth; x++) {
        candidate.x = x;
        candidate.y = 0;

        if (!board.isValid(candidate)) continue;

        const result = this._simulate(board, candidate);
        if (!result) continue;

        const score = this._evaluate(result.grid, result.linesCleared);
        if (score > bestScore) {
          bestScore = score;
          bestRotations = rotations;
          bestX = x;
        }
      }

      candidate.rotate();
    }

    return { rotations: bestRotations, x: bestX };
  }

  _simulate(board, piece) {
    const p = piece.clone();

    while (board.isValid(p)) p.y++;
    p.y--;

    if (p.y < 0) return null;

    const grid = board.grid.map(row => [...row]);

    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue;
        const ny = p.y + r;
        const nx = p.x + c;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
          grid[ny][nx] = p.color;
        }
      }
    }

    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every(cell => cell !== 0)) {
        linesCleared++;
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(0));
        r++;
      }
    }

    return { grid, linesCleared };
  }

  _evaluate(grid, linesCleared) {
    const heights = this._columnHeights(grid);
    const aggregateHeight = heights.reduce((a, b) => a + b, 0);
    const holes = this._holes(grid, heights);
    const bumpiness = this._bumpiness(heights);
    return linesCleared * 0.76 - aggregateHeight * 0.51 - holes * 0.36 - bumpiness * 0.18;
  }

  _columnHeights(grid) {
    const heights = Array(COLS).fill(0);
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (grid[r][c]) {
          heights[c] = ROWS - r;
          break;
        }
      }
    }
    return heights;
  }

  _holes(grid, heights) {
    let holes = 0;
    for (let c = 0; c < COLS; c++) {
      const topRow = ROWS - heights[c];
      for (let r = topRow + 1; r < ROWS; r++) {
        if (!grid[r][c]) holes++;
      }
    }
    return holes;
  }

  _bumpiness(heights) {
    let bumpiness = 0;
    for (let i = 0; i < heights.length - 1; i++) {
      bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    return bumpiness;
  }
}
