const SCALE = 2;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const WIDTH = CANVAS_WIDTH / SCALE;
const HEIGHT = CANVAS_HEIGHT / SCALE;

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const WOOD = 3;

const colors = {
  [EMPTY]: [0, 0, 0],
  [SAND]: [246, 215, 176],
  [WATER]: [64, 164, 223],
  [WOOD]: [38, 30, 22],
};

const SAND_STEPS = 3;
const WATER_STEPS = 3;

const MAX_STEP_SAND = 3;
const MAX_STEP_WATER = 3;

const grid = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));
const fallDist = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));

let canvas, ctx;
let buffer, bctx;
let imageData, pixels;
let mouseX, mouseY;

let mouseIsPressed = false;
let frameId = 0;
let currentMaterial = SAND;
let flip = false;

const isEmpty = (x, y) => {
  return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && grid[x][y] === EMPTY;
};

function updateSandPos(x, y) {
  if (isEmpty(x, y + 1)) {
    return [x, y + 1];
  }

  if (isEmpty(x - 1, y + 1)) {
    return [x - 1, y + 1];
  }

  if (isEmpty(x + 1, y + 1)) {
    return [x + 1, y + 1];
  }

  return [x, y];
}

function updateWaterPos(x, y) {
  if (isEmpty(x, y + 1)) {
    return [x, y + 1];
  }

  const dir = Math.random() < 0.5 ? -1 : 1;

  if (isEmpty(x + dir, y + 1)) {
    return [x + dir, y + 1];
  }

  if (isEmpty(x - dir, y + 1)) {
    return [x - dir, y + 1];
  }

  if (isEmpty(x + dir, y)) {
    return [x + dir, y];
  }

  if (isEmpty(x - dir, y)) {
    return [x - dir, y];
  }

  return [x, y];
}

function stepSand() {
  for (let y = HEIGHT - 1; y >= 0; y--) {
    for (let x = 0; x < WIDTH; x++) {
      if (grid[x][y] === SAND) {
        let updatedX = x;
        let updatedY = y;
        let steps = Math.min(fallDist[x][y], MAX_STEP_SAND);

        for (let s = 0; s < steps; s++) {
          const [newX, newY] = updateSandPos(updatedX, updatedY);

          if (newX === updatedX && newY === updatedY) {
            break;
          }

          updatedX = newX;
          updatedY = newY;
        }

        grid[x][y] = EMPTY;
        grid[updatedX][updatedY] = SAND;

        if (updatedX === x && updatedY === y) {
          fallDist[x][y] = 1;
        } else {
          fallDist[updatedX][updatedY] = fallDist[x][y] + 1;
        }
      }
    }
  }
}

function stepWater() {
  flip = !flip;

  const xStart = flip ? 0 : WIDTH - 1;
  const xEnd = flip ? WIDTH : -1;
  const xStep = flip ? 1 : -1;

  for (let y = HEIGHT - 1; y >= 0; y--) {
    for (let x = xStart; x !== xEnd; x += xStep) {
      if (grid[x][y] === WATER) {
        let updatedX = x;
        let updatedY = y;
        let steps = Math.min(fallDist[x][y], MAX_STEP_WATER);

        for (let s = 0; s < steps; s++) {
          const [newX, newY] = updateWaterPos(updatedX, updatedY);

          if (newX === updatedX && newY === updatedY) {
            break;
          }

          updatedX = newX;
          updatedY = newY;
        }

        grid[x][y] = EMPTY;
        grid[updatedX][updatedY] = WATER;

        if (updatedX === x && updatedY === y) {
          fallDist[x][y] = 1;
        } else {
          fallDist[updatedX][updatedY] = fallDist[x][y] + 1;
        }
      }
    }
  }
}

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

  frameId = requestAnimationFrame(loop);
}

function emitParticles() {
  if (mouseX < 0 || mouseX >= WIDTH || mouseY < 0 || mouseY >= HEIGHT) {
    return;
  }

  let radius = 2;

  if (currentMaterial === WATER) {
    radius = 5;
  }

  if (currentMaterial === WOOD) {
    radius = 7;
  }

  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      if ([SAND, WATER].includes(currentMaterial) && Math.random() < 0.75) {
        continue;
      }

      const x = mouseX + i;
      const y = mouseY + j;

      if (i * i + j * j <= radius * radius) {
        if (
          grid[x] !== undefined &&
          grid[x] !== null &&
          currentMaterial !== EMPTY &&
          currentMaterial !== undefined &&
          currentMaterial !== null
        ) {
          if (grid[x][y] === EMPTY) {
            grid[x][y] = currentMaterial;
          }
        }
      }
    }
  }
}

function update() {
  for (let i = 0; i < WATER_STEPS; i++) {
    stepWater();
  }

  for (let i = 0; i < SAND_STEPS; i++) {
    stepSand();
  }

  if (mouseIsPressed) {
    emitParticles();
  }
}

function draw() {
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

  bctx.putImageData(imageData, 0, 0);
  ctx.drawImage(buffer, 0, 0, WIDTH * SCALE, HEIGHT * SCALE);
}

function loop() {
  update();
  draw();
  frameId = requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "1":
      currentMaterial = SAND;
      break;
    case "2":
      currentMaterial = WATER;
      break;
    case "3":
      currentMaterial = WOOD;
      break;
    case "0":
      currentMaterial = EMPTY;
      break;
  }
});

addEventListener("DOMContentLoaded", () => {
  init();
});
