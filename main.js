function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
    for (let j = 0; j < arr[i].length; j++) {
      arr[i][j] = 0;
    }
  }
  return arr;
}

function withinCols(i) {
  return i >= 0 && i <= cols - 1;
}

function withinRows(j) {
  return j >= 0 && j <= rows - 1;
}

let grid;
let w = 5;
let cols, rows;
let canvas, ctx;
let mouseX, mouseY;
let mouseIsPressed = false;
let frameId = 0;

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  canvas.width = 600;
  canvas.height = 600;

  cols = canvas.width / w;
  rows = canvas.height / w;
  grid = make2DArray(cols, rows);

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      mouseX = event.offsetX;
      mouseY = event.offsetY;

      mouseIsPressed = true;
    },
    false
  );

  canvas.addEventListener(
    "pointerup",
    (event) => {
      mouseX = event.offsetX;
      mouseY = event.offsetY;

      mouseIsPressed = false;
    },
    false
  );

  canvas.addEventListener(
    "pointermove",
    (event) => {
      mouseX = event.offsetX;
      mouseY = event.offsetY;
    },
    false
  );

  frameId = requestAnimationFrame(draw);
}

function drawSand() {
  let mouseCol = Math.floor(mouseX / w);
  let mouseRow = Math.floor(mouseY / w);

  let matrix = 3;
  let extent = Math.floor(matrix / 2);

  for (let i = -extent; i <= extent; i++) {
    for (let j = -extent; j <= extent; j++) {
      if (Math.random() > 0.75) {
        let col = mouseCol + i;
        let row = mouseRow + j;

        if (withinCols(col) && withinRows(row)) {
          grid[col][row] = 1;
        }
      }
    }
  }
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] === 1) {
        ctx.fillStyle = "#fff";
        let x = i * w;
        let y = j * w;
        ctx.fillRect(x, y, w, w);
      }
    }
  }

  if (mouseIsPressed) {
    drawSand();
  }

  let nextGrid = make2DArray(cols, rows);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let state = grid[i][j];

      if (state === 1) {
        let below = grid[i][j + 1];
        let dir = 1;

        if (Math.random() < 0.5) {
          dir *= -1;
        }

        let belowA = -1;
        let belowB = -1;

        if (withinCols(i + dir)) {
          belowA = grid[i + dir][j + 1];
        }

        if (withinCols(i - dir)) {
          belowB = grid[i - dir][j + 1];
        }

        if (below === 0) {
          nextGrid[i][j + 1] = state;
        } else if (belowA === 0) {
          nextGrid[i + dir][j + 1] = state;
        } else if (belowB === 0) {
          nextGrid[i - dir][j + 1] = state;
        } else {
          nextGrid[i][j] = state;
        }
      }
    }
  }

  grid = nextGrid;

  frameId = requestAnimationFrame(draw);
}

addEventListener("DOMContentLoaded", () => {
  init();
});
