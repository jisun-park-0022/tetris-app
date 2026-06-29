const PIECES = [
  { shape: [[1,1,1,1]], color: '#00f0f0' },           // I
  { shape: [[1,1],[1,1]], color: '#f0f000' },           // O
  { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },       // T
  { shape: [[0,1,1],[1,1,0]], color: '#00f000' },       // S
  { shape: [[1,1,0],[0,1,1]], color: '#f00000' },       // Z
  { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },       // J
  { shape: [[0,0,1],[1,1,1]], color: '#f0a000' },       // L
];

class Piece {
  constructor(type) {
    this.shape = type.shape.map(row => [...row]);
    this.color = type.color;
    this.x = 0;
    this.y = 0;
  }

  rotate() {
    const rows = this.shape.length;
    const cols = this.shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = this.shape[r][c];
      }
    }
    this.shape = rotated;
  }

  clone() {
    const p = new Piece({ shape: this.shape, color: this.color });
    p.x = this.x;
    p.y = this.y;
    return p;
  }
}
