const SCALE = 2;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const WIDTH = CANVAS_WIDTH / SCALE;
const HEIGHT = CANVAS_HEIGHT / SCALE;

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const WOOD = 3;
const FIRE = 4;
const GAS = 5;

const colors = {
  [EMPTY]: [0, 0, 0],
  [SAND]: [246, 215, 176],
  [WATER]: [64, 164, 223],
  [WOOD]: [58, 50, 42],
  [FIRE]: [242, 125, 12],
  [GAS]: [216, 216, 216],
};

const SAND_STEPS = 2;
const WATER_STEPS = 2;
const FIRE_STEPS = 2;
const GAS_STEPS = 1;

const MAX_STEP_SAND = 3;
const MAX_STEP_WATER = 3;

const grid = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));
const fallDist = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));

const burnLife = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));
const fireLife = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));
const gasLife = Array.from({ length: WIDTH }, () => new Uint8Array(HEIGHT));

const GAS_MIN_ALPHA = 20;
const GAS_MAX_LIFE = 40;

let canvas, ctx;
let buffer, bctx;
let imageData, pixels;
let mouseX, mouseY;

let mouseIsPressed = false;
let frameId = 0;
let currentMaterial = SAND;
let flip = false;

const isFlammable = (type) => type === SAND || type === WOOD;

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

function updateFirePos(x, y) {
  if (isEmpty(x, y - 1)) {
    return [x, y - 1];
  }

  if (Math.random() < 0.5) {
    if (isEmpty(x - 1, y - 1)) {
      return [x - 1, y - 1];
    }

    if (isEmpty(x + 1, y - 1)) {
      return [x + 1, y - 1];
    }
  } else {
    if (isEmpty(x + 1, y - 1)) {
      return [x + 1, y - 1];
    }

    if (isEmpty(x - 1, y - 1)) {
      return [x - 1, y - 1];
    }
  }

  // Flicker sideways
  if (Math.random() < 0.3) {
    if (isEmpty(x - 1, y)) {
      return [x - 1, y];
    }

    if (isEmpty(x + 1, y)) {
      return [x + 1, y];
    }
  }

  return [x, y];
}

function updateGasPos(x, y) {
  if (isEmpty(x, y - 1)) {
    return [x, y - 1];
  }

  if (Math.random() < 0.5) {
    if (isEmpty(x - 1, y - 1)) {
      return [x - 1, y - 1];
    }

    if (isEmpty(x + 1, y - 1)) {
      return [x + 1, y - 1];
    }
  } else {
    if (isEmpty(x + 1, y - 1)) {
      return [x + 1, y - 1];
    }

    if (isEmpty(x - 1, y - 1)) {
      return [x - 1, y - 1];
    }
  }

  // Diffuse
  if (Math.random() < 0.6) {
    if (isEmpty(x - 1, y)) {
      return [x - 1, y];
    }

    if (isEmpty(x + 1, y)) {
      return [x + 1, y];
    }
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

function stepGas() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (grid[x][y] === GAS) {
        gasLife[x][y] -= 0.0001;

        if (gasLife[x][y] <= 0) {
          grid[x][y] = EMPTY;
          continue;
        }

        const [updatedX, updatedY] = updateGasPos(x, y);

        if (updatedX !== x || updatedY !== y) {
          grid[x][y] = EMPTY;
          grid[updatedX][updatedY] = GAS;
          gasLife[updatedX][updatedY] = gasLife[x][y];
        } else {
          grid[updatedX][updatedY] = EMPTY;
        }
      }
    }
  }
}

function burn(x, y) {
  const neighbors = [
    [x, y + 1],
    [x, y - 1],
    [x - 1, y],
    [x + 1, y],
  ];

  for (const [nx, ny] of neighbors) {
    if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) {
      continue;
    }

    if (isFlammable(grid[nx][ny]) && burnLife[nx][ny] === 0) {
      if (Math.random() < 0.06) {
        // Ignite
        burnLife[nx][ny] = 30 + Math.random() * 30;
      }

      // Extinguish
      if (Math.random() < 0.05 && isEmpty(x, y - 1)) {
        grid[x][y - 1] = GAS;
        gasLife[x][y - 1] = 40;
      }
    }
  }
}

const stepBurning = () => {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (burnLife[x][y] > 0) {
        burnLife[x][y]--;

        // Flicker
        if (Math.random() < 0.1) {
          grid[x][y] = FIRE;
          fireLife[x][y] = 15;
        }

        // Burn out
        if (burnLife[x][y] === 0) {
          grid[x][y] = EMPTY;
        }
      }
    }
  }
};

const stepFire = () => {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (grid[x][y] === FIRE) {
        fireLife[x][y]--;

        if (fireLife[x][y] <= 0) {
          grid[x][y] = EMPTY;
          continue;
        }

        burn(x, y);

        const [updatedX, updatedY] = updateFirePos(x, y);

        if (updatedX !== x || updatedY !== y) {
          grid[x][y] = EMPTY;
          grid[updatedX][updatedY] = FIRE;
          fireLife[updatedX][updatedY] = fireLife[x][y];
        }
      }
    }
  }
};

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

  let radius = 4;

  if (currentMaterial === WATER) {
    radius = 5;
  }

  if (currentMaterial === WOOD) {
    radius = 7;
  }

  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      if (
        [SAND, WATER, FIRE, GAS].includes(currentMaterial) &&
        Math.random() < 0.75
      ) {
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

            if (currentMaterial == FIRE) {
              fireLife[x][y] = 20 + Math.random() * 20;
            }

            if (currentMaterial == GAS) {
              gasLife[x][y] = 20 + Math.random() * 20;
            }
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

  for (let i = 0; i < FIRE_STEPS; i++) {
    stepBurning();
    stepFire();
  }

  for (let i = 0; i < GAS_STEPS; i++) {
    stepGas();
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

      if (type === GAS) {
        const life = gasLife[i][j];
        const alpha = Math.max(GAS_MIN_ALPHA, (life / GAS_MAX_LIFE) * 255);
        pixels[idx + 3] = alpha;
      } else {
        pixels[idx + 3] = color[3] ?? 255;
      }
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
    case "4":
      currentMaterial = FIRE;
      break;
    case "5":
      currentMaterial = GAS;
      break;
    case "0":
      currentMaterial = EMPTY;
      break;
  }
});

addEventListener("DOMContentLoaded", () => {
  init();
});
