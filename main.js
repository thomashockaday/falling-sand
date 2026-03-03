const isEmpty = (x, y) => {
  return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && grid[x][y] === EMPTY;
};

const SCALE = 2;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const WIDTH = CANVAS_WIDTH / SCALE;
const HEIGHT = CANVAS_HEIGHT / SCALE;

const EMPTY = 0;
const SAND = 1;

const colors = {
  [EMPTY]: [0, 0, 0],
  [SAND]: [246, 215, 176],
};

const MAX_STEP_SAND = 3;

const grid = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));

let canvas, ctx;
let buffer, bctx;
let imageData, pixels;
let mouseX, mouseY;
let mouseIsPressed = false;
let frameId = 0;

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  buffer = document.createElement("canvas");
  buffer.width = WIDTH;
  buffer.height = HEIGHT;
  bctx = buffer.getContext("2d");

  imageData = ctx.createImageData(WIDTH, HEIGHT);
  pixels = imageData.data;

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      mouseX = Math.floor(mx / SCALE);
      mouseY = Math.floor(my / SCALE);

      mouseIsPressed = true;
    },
    false,
  );

  canvas.addEventListener(
    "pointerup",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      mouseX = Math.floor(mx / SCALE);
      mouseY = Math.floor(my / SCALE);

      mouseIsPressed = false;
    },
    false,
  );

  canvas.addEventListener(
    "pointermove",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      mouseX = Math.floor(mx / SCALE);
      mouseY = Math.floor(my / SCALE);
    },
    false,
  );

  frameId = requestAnimationFrame(draw);
}

function drawSand() {
  if (mouseX < 0 || mouseX >= WIDTH || mouseY < 0 || mouseY >= HEIGHT) {
    return;
  }

  let extent = 2;

  for (let i = -extent; i <= extent; i++) {
    for (let j = -extent; j <= extent; j++) {
      if (Math.random() > 0.75) {
        const x = mouseX + i;
        const y = mouseY + j;

        if (i * i + j * j <= extent * extent) {
          if (grid[x] !== undefined && grid[x] !== null) {
            if (grid[x][y] === EMPTY) {
              grid[x][y] = SAND;
            }
          }
        }
      }
    }
  }
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < WIDTH; i++) {
    for (let j = 0; j < HEIGHT; j++) {
      const type = grid[i][j];
      const color = colors[type];
      const idx = (j * WIDTH + i) * 4;

      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = color[3] ?? 255;
    }
  }

  if (mouseIsPressed) {
    drawSand();
  }

  for (let y = HEIGHT - 1; y >= 0; y--) {
    for (let x = 0; x < WIDTH; x++) {
      if (grid[x][y] === SAND) {
        let updatedX = x;
        let updatedY = y;
        const steps = MAX_STEP_SAND;

        for (let s = 0; s < steps; s++) {
          let newX = x;
          let newY = y;

          if (isEmpty(x, y + 1)) {
            newX = x;
            newY = y + 1;
          } else if (isEmpty(x - 1, y + 1)) {
            newX = x - 1;
            newY = y + 1;
          } else if (isEmpty(x + 1, y + 1)) {
            newX = x + 1;
            newY = y + 1;
          }

          if (newX === updatedX && newY === updatedY) {
            break;
          }

          updatedX = newX;
          updatedY = newY;
        }

        grid[x][y] = EMPTY;
        grid[updatedX][updatedY] = SAND;
      }
    }
  }

  bctx.putImageData(imageData, 0, 0);
  ctx.drawImage(buffer, 0, 0, WIDTH * SCALE, HEIGHT * SCALE);

  frameId = requestAnimationFrame(draw);
}

addEventListener("DOMContentLoaded", () => {
  init();
});
