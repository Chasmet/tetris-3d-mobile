const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const downBtn = document.getElementById("downBtn");
const rotateBtn = document.getElementById("rotateBtn");

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

const COLORS = [
  null,
  "#00f5ff",
  "#ffe600",
  "#b84dff",
  "#4dff88",
  "#ff5c5c",
  "#4da6ff",
  "#ff9f1c",
];

const SHAPES = [
  [],
  [[1, 1, 1, 1]],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
  ],
  [
    [0, 4, 4],
    [4, 4, 0],
  ],
  [
    [5, 5, 0],
    [0, 5, 5],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
  ],
  [
    [0, 0, 7],
    [7, 7, 7],
  ],
];

let board = [];
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let score = 0;
let lines = 0;
let level = 1;
let dropInterval = 700;
let dropCounter = 0;
let lastTime = 0;
let isRunning = false;
let animationId = null;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  return SHAPES[type].map(row => [...row]);
}

function resetPiece() {
  currentPiece = randomPiece();
  currentY = 0;
  currentX = Math.floor((COLS - currentPiece[0].length) / 2);

  if (collides(board, currentPiece, currentX, currentY)) {
    isRunning = false;
    cancelAnimationFrame(animationId);
    alert("Partie terminée");
  }
}

function drawCell(x, y, value) {
  ctx.fillStyle = COLORS[value];
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = "#0b1220";
  ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
}

function drawBoard() {
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] !== 0) {
        drawCell(x, y, board[y][x]);
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.strokeRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
      }
    }
  }
}

function drawPiece(piece, offsetX, offsetY) {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x] !== 0) {
        drawCell(x + offsetX, y + offsetY, piece[y][x]);
      }
    }
  }
}

function collides(board, piece, offsetX, offsetY) {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (
        piece[y][x] !== 0 &&
        (
          board[y + offsetY] === undefined ||
          board[y + offsetY][x + offsetX] === undefined ||
          board[y + offsetY][x + offsetX] !== 0
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function merge(board, piece, offsetX, offsetY) {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x] !== 0) {
        board[y + offsetY][x + offsetX] = piece[y][x];
      }
    }
  }
}

function rotate(piece) {
  const rows = piece.length;
  const cols = piece[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = piece[y][x];
    }
  }
  return rotated;
}

function clearLines() {
  let cleared = 0;

  outer: for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }

    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    cleared++;
    y++;
  }

  if (cleared > 0) {
    lines += cleared;
    score += cleared * 100;
    level = Math.floor(lines / 5) + 1;
    dropInterval = Math.max(150, 700 - (level - 1) * 50);
    updateStats();
  }
}

function updateStats() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function moveDown() {
  if (!isRunning) return;

  currentY++;
  if (collides(board, currentPiece, currentX, currentY)) {
    currentY--;
    merge(board, currentPiece, currentX, currentY);
    clearLines();
    resetPiece();
  }
  draw();
}

function moveLeft() {
  if (!isRunning) return;

  currentX--;
  if (collides(board, currentPiece, currentX, currentY)) {
    currentX++;
  }
  draw();
}

function moveRight() {
  if (!isRunning) return;

  currentX++;
  if (collides(board, currentPiece, currentX, currentY)) {
    currentX--;
  }
  draw();
}

function rotateCurrent() {
  if (!isRunning) return;

  const rotated = rotate(currentPiece);
  if (!collides(board, rotated, currentX, currentY)) {
    currentPiece = rotated;
  }
  draw();
}

function draw() {
  drawBoard();
  if (currentPiece) {
    drawPiece(currentPiece, currentX, currentY);
  }
}

function update(time = 0) {
  if (!isRunning) return;

  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  if (dropCounter > dropInterval) {
    moveDown();
    dropCounter = 0;
  }

  draw();
  animationId = requestAnimationFrame(update);
}

function startGame() {
  if (isRunning) return;

  isRunning = true;
  lastTime = 0;
  dropCounter = 0;

  if (!currentPiece) {
    resetPiece();
  }

  update();
}

function resetGame() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 700;
  currentPiece = null;
  currentX = 0;
  currentY = 0;
  isRunning = false;
  cancelAnimationFrame(animationId);
  updateStats();
  draw();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowDown") moveDown();
  if (e.key === "ArrowUp") rotateCurrent();
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
leftBtn.addEventListener("click", moveLeft);
rightBtn.addEventListener("click", moveRight);
downBtn.addEventListener("click", moveDown);
rotateBtn.addEventListener("click", rotateCurrent);

resetGame();
