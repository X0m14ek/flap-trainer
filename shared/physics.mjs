// Deterministic 60 Hz simulation. Same rules, constants, hitboxes and column generation as the original game.
// No clock, rendering, network or random globals.
export const COMMON_RULES = 24;

const FIELD_TOP = 52;
const FIELD_BOTTOM = 917;
const FLIGHT_SCALE = (FIELD_BOTTOM - FIELD_TOP) / 640;
const FLAPPY_SCALE = (FIELD_BOTTOM - FIELD_TOP) / 400;
const FLAPPY_START_Y = 246;
const GRAVITY_PER_TICK = Math.fround(0.3);
const FLAP_PER_TICK = -5;
const TERMINAL_PER_TICK = 8;
const ROTATION_PER_FLAP = -10;
const ROTATION_ACCELERATION = Math.fround(0.4);
const RADIANS_PER_DEGREE = Math.PI / 180;
const GAP_HEIGHT_SCALE = 0.85;
const OPENING_GAP = 236;
const FINAL_GAP = 208;
const UNIT = 1024;

export const CONFIG = Object.freeze({
  VERSION: 23,
  WIDTH: 412,
  HEIGHT: 917,
  FIELD_TOP,
  FIELD_BOTTOM,
  TICK_RATE: 60,
  STEP_MS: 1000 / 60,
  MAX_TICKS: 60 * 60 * 10,
  MIN_FLAP_TICKS: 1,
  BIRD_X: 110 * FLIGHT_SCALE,
  BIRD_RADIUS: 16,
  BIRD_SPRITE_SIZE: 150,
  START_Y: (FIELD_TOP + FIELD_BOTTOM) / 2,
  BIRD_MIN_ANGLE: -5,
  BIRD_MAX_ANGLE: 5,
  DEATH_TURN_VELOCITY: 600 * FLIGHT_SCALE,
  DEATH_VELOCITY_X: -55 * FLIGHT_SCALE,
  DEATH_VELOCITY_Y: -220 * FLIGHT_SCALE,
  DEATH_GRAVITY: 1400 * FLIGHT_SCALE * 1.33,
  DEATH_TERMINAL_VELOCITY: 700 * FLIGHT_SCALE,
  START_SPEED: 412.5,
  MAX_SPEED: 480,
  ACCELERATION_START_TICK: 60 * 10,
  ACCELERATION_END_TICK: 60 * 60,
  OBSTACLE_WIDTH: 72,
  MIN_OBSTACLE_SPACING: 310,
  MAX_OBSTACLE_SPACING: 558,
  FIRST_OBSTACLE_X: 582,
  MIN_GAP_CENTER_CHANGE: 40,
  MAX_GAP_CENTER_CHANGE: 150,
  GAP_EDGE_MARGIN: 56,
  BONUS_POINTS: 10,
});

// Hitbox circles [x, y, radius] for each character, relative to the sprite pivot.
export const BIRD_COLLIDERS = Object.freeze({
  buster: [[8,-40,23],[-2,12,18],[-2,34,11],[10,-18,13],[-16,0,9],[-22,34,6],[8,14,13],[-8,48,6],[10,-36,23],[14,-44,19],[2,2,12]],
  leva: [[14,-38,23],[0,10,16],[-4,32,12],[16,-24,18],[22,-42,19],[-8,46,6],[-14,30,8],[6,0,10],[24,-6,5],[10,-44,18],[2,10,16]],
  sasavot: [[14,-36,24],[0,12,19],[12,-12,18],[-6,32,11],[10,20,14],[-4,46,8],[32,-52,9],[-22,34,6],[-10,52,7],[22,-22,15],[-14,-4,5]],
  korya: [[14,-40,24],[0,6,17],[-2,30,12],[14,-22,18],[-2,46,8],[4,12,16],[20,-42,21],[26,-22,10],[12,-36,23],[0,2,16],[26,-6,4]],
  deepins02: [[16,-40,21],[18,-18,17],[0,6,12],[4,24,10],[24,18,8],[-6,36,8],[14,30,7],[22,-44,17],[-6,44,6],[14,-46,17],[12,-36,18]],
  bratishkinoff: [[14,-40,24],[0,12,18],[8,34,18],[0,-8,15],[20,-14,9],[12,20,13],[10,-40,22],[6,42,13],[28,-22,7],[-14,-8,5],[26,-6,4]],
  dmitry_lixxx: [[12,-40,24],[0,12,19],[8,-10,14],[-4,40,9],[-16,4,12],[-22,32,6],[12,-36,24],[18,16,7],[-10,50,5],[0,14,19],[-26,40,4]],
  gaechkatm: [[16,-38,25],[-2,4,19],[0,28,13],[12,-18,16],[18,-38,25],[-6,44,5],[8,42,5],[6,12,13],[0,-4,16],[24,-6,4],[26,-24,12]],
  ramzes: [[12,-34,27],[-2,10,16],[-12,32,11],[12,-16,18],[2,32,8],[22,22,5],[28,-48,11],[-16,46,5],[28,16,5],[26,0,5],[22,-26,18]],
  "5opka": [[20,-36,23],[6,12,19],[4,32,15],[24,-22,20],[2,44,10],[2,6,16],[22,26,5],[-8,50,5],[-4,30,10],[22,-16,17],[20,10,8]],
  rostislav_999: [[10,-34,28],[0,14,16],[16,-32,28],[2,26,13],[12,-24,25],[-14,8,10],[-4,44,7],[-22,34,6],[16,-38,26],[-16,56,5],[-8,50,6]],
  anarabdullaev: [[14,-38,24],[0,12,19],[0,34,10],[10,-6,11],[-10,8,14],[10,10,15],[16,-30,21],[-6,44,5],[10,-44,19],[-22,36,4],[0,22,15]],
  strogo: [[14,-38,24],[2,14,18],[0,38,11],[16,-12,10],[-10,4,10],[20,-42,20],[28,-4,5],[6,12,16],[6,-22,11],[-4,44,8],[18,-36,22]],
  gensyxa: [[16,-34,24],[0,4,18],[0,30,8],[16,-24,19],[4,18,11],[-22,34,5],[26,-40,16],[0,36,7],[-2,-2,15],[8,10,12],[6,-32,16]],
});

// Solid strips of the column tip, measured from the end facing the opening: [start depth, end depth, left, right].
export const COLUMN_TIP = [
  [3, 8, 42, 47], [8, 13, 37, 48], [13, 18, 30, 53],
  [18, 24, 23, 57], [24, 30, 14, 63], [30, 37, 10, 65],
  [37, 44, 4, 65],
];

// Shared flight contour for rules v24: rows are [y, left, right].
export const FLIGHT_SECTIONS = [[-53,7.49,13.11],[-50,-0.67,27.3],[-47,-5.09,30.51],[-44,-8.16,33.59],[-41,-9.77,34.66],[-38,-10.84,35.06],[-35,-11.37,35.73],[-32,-13.25,35.6],[-29,-13.25,34.93],[-26,-13.78,34.12],[-23,-13.65,33.72],[-20,-13.25,32.38],[-17,-11.11,31.98],[-14,-11.64,32.92],[-11,-12.58,31.58],[-8,-15.52,30.11],[-5,-19.81,28.77],[-2,-21.95,27.17],[1,-23.28,27.83],[4,-24.49,21.28],[7,-23.82,21.41],[10,-24.09,22.62],[13,-24.36,23.02],[16,-25.02,21.95],[19,-27.3,23.95],[22,-31.72,22.75],[25,-34.26,21.95],[28,-35.73,21.01],[31,-33.72,17.13],[34,-34.53,17.26],[37,-35.06,14.59],[40,-35.33,10.57],[43,-35.33,6.42],[46,-21.41,-0.94],[49,-21.01,-4.68],[52,-19.94,-5.75],[55,-18.87,-12.58],[57,-16.59,-14.99]];

export const PICKUP = Object.freeze({ size: 96, duration: 15 * CONFIG.TICK_RATE, shrinkScale: 0.7, shrinkTransitionTicks: 21 });
export const STATUE = Object.freeze({ size: 128, angle: -20 * Math.PI / 180, halfAxis: 44, radius: 19, pickupBirdRadius: 22 * FLIGHT_SCALE });

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const statueCos = Math.cos(STATUE.angle);
const statueSin = Math.sin(STATUE.angle);

function distanceToSegmentSquared(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSquared, 0, 1) : 0;
  return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
}

function touchesStatue(xBefore, yBefore, xAfter, yAfter, birdScale = 1) {
  const ax = xBefore * statueCos + yBefore * statueSin, ay = yBefore * statueCos - xBefore * statueSin;
  const bx = xAfter * statueCos + yAfter * statueSin, by = yAfter * statueCos - xAfter * statueSin;
  const axis = STATUE.halfAxis;
  if (ax !== bx) {
    const t = ax / (ax - bx);
    if (t >= 0 && t <= 1 && Math.abs(ay + (by - ay) * t) <= axis) return true;
  }
  const reach = STATUE.radius + STATUE.pickupBirdRadius * birdScale;
  return Math.min(
    distanceToSegmentSquared(ax, ay, 0, -axis, 0, axis),
    distanceToSegmentSquared(bx, by, 0, -axis, 0, axis),
    distanceToSegmentSquared(0, -axis, ax, ay, bx, by),
    distanceToSegmentSquared(0, axis, ax, ay, bx, by),
  ) <= reach * reach;
}

function randomUint32(state) {
  let value = state.rngState;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.rngState = value >>> 0;
  return state.rngState;
}

const nextBonusGap = state => 3 + randomUint32(state) % 4;

function nextObstacleX(state, previousX) {
  const min = CONFIG.MIN_OBSTACLE_SPACING * UNIT, max = CONFIG.MAX_OBSTACLE_SPACING * UNIT;
  return previousX + min + randomUint32(state) % (max - min + 1);
}

export function difficultyAt(tick) {
  const duration = CONFIG.ACCELERATION_END_TICK - CONFIG.ACCELERATION_START_TICK;
  const progress = clamp(tick - CONFIG.ACCELERATION_START_TICK, 0, duration);
  const speedFixed = Math.round((CONFIG.START_SPEED * duration +
    (CONFIG.MAX_SPEED - CONFIG.START_SPEED) * progress) * UNIT / (duration * CONFIG.TICK_RATE));
  const gapHeight = (OPENING_GAP - Math.floor((OPENING_GAP - FINAL_GAP) * progress / duration)) * GAP_HEIGHT_SCALE;
  return { speed: speedFixed * CONFIG.TICK_RATE / UNIT, speedFixed, gapHeight };
}

function addObstacle(state, xFixed) {
  const { gapHeight } = difficultyAt(state.tick);
  const minimum = CONFIG.FIELD_TOP + CONFIG.GAP_EDGE_MARGIN + gapHeight / 2;
  const maximum = CONFIG.FIELD_BOTTOM - CONFIG.GAP_EDGE_MARGIN - gapHeight / 2;
  const previous = state.obstacles.at(-1);
  const spacing = previous ? (xFixed - previous.xFixed) / UNIT : CONFIG.MAX_OBSTACLE_SPACING;
  const spacingProgress = clamp((spacing - CONFIG.MIN_OBSTACLE_SPACING) /
    (CONFIG.MAX_OBSTACLE_SPACING - CONFIG.MIN_OBSTACLE_SPACING), 0, 1);
  const heightChange = 65 + (CONFIG.MAX_GAP_CENTER_CHANGE - 65) * spacingProgress;
  const low = Math.ceil(Math.max(minimum, state.lastGapY - heightChange));
  const high = Math.floor(Math.min(maximum, state.lastGapY + heightChange));
  const before = Math.max(0, Math.floor(state.lastGapY - CONFIG.MIN_GAP_CENTER_CHANGE) - low + 1);
  const after = Math.max(0, high - Math.ceil(state.lastGapY + CONFIG.MIN_GAP_CENTER_CHANGE) + 1);
  const position = randomUint32(state) % (before + after);
  const gapY = position < before ? low + position : high - after + 1 + (position - before);
  state.lastGapY = gapY;
  const id = state.nextObstacleId++;
  let bonus = null, effect = null;
  if (id === state.nextBonusObstacle) {
    const pickup = { x: xFixed / UNIT + CONFIG.OBSTACLE_WIDTH / 2, y: gapY, collected: false };
    state.nextBonusObstacle += nextBonusGap(state);
    state.slotsUntilEffect--;
    if (state.slotsUntilEffect === 0) { effect = pickup; state.slotsUntilEffect = 8; }
    else bonus = pickup;
  }
  state.obstacles.push({ id, xFixed, x: xFixed / UNIT, width: CONFIG.OBSTACLE_WIDTH, gapY, gapHeight, passed: false, bonus, effect });
}

export function createGame(seed, streamerId = 'gensyxa', version = CONFIG.VERSION) {
  if (version !== CONFIG.VERSION && version !== COMMON_RULES) throw new RangeError('Unsupported rules');
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('Seed must be a uint32');
  const effectSeed = { rngState: (seed ^ 0x9e3779b9) >>> 0 || 1 };
  const state = {
    version, seed, rngState: seed || 0x6d2b79f5,
    tick: 0, alive: true, endedReason: null, score: 0, passedCount: 0, bonusesCollected: 0,
    distanceFixed: 0, distance: 0, speed: CONFIG.START_SPEED,
    lastFlapTick: -CONFIG.MIN_FLAP_TICKS, lastGapY: CONFIG.START_Y,
    effects: { shrinkUntil: 0 },
    slotsUntilEffect: (randomUint32(effectSeed) & 1) ? 7 : 3,
    effectThisTick: false,
    nextObstacleId: 0, flapped: false, scoredThisTick: 0, bonusThisTick: 0,
    passedWithoutBonusThisTick: false,
    bird: {
      x: CONFIG.BIRD_X, y: CONFIG.START_Y, vy: 0,
      radius: CONFIG.BIRD_RADIUS, originalY: FLAPPY_START_Y, originalVy: 0,
      angle: 0, angleVelocity: 0, rotation: 0, streamerId,
    },
    obstacles: [],
  };
  state.nextBonusObstacle = nextBonusGap(state) - 1;
  let xFixed = CONFIG.FIRST_OBSTACLE_X * UNIT;
  for (let index = 0; index < 3; index++) {
    if (index > 0) xFixed = nextObstacleX(state, xFixed);
    addObstacle(state, xFixed);
  }
  return state;
}

function circleIntersectsColumn(x, depth, radius) {
  if (depth <= -radius) return false;
  const side = x - clamp(x, 2, CONFIG.OBSTACLE_WIDTH - 3);
  if (side ** 2 + Math.max(0, 44 - depth) ** 2 < radius ** 2) return true;
  return COLUMN_TIP.some(([start, end, left, right]) => {
    const dx = x - clamp(x, left, right);
    const dy = depth - clamp(depth, start, end);
    return dx * dx + dy * dy < radius * radius;
  });
}

export const collidersFor = id => Object.hasOwn(BIRD_COLLIDERS, id) ? BIRD_COLLIDERS[id] : BIRD_COLLIDERS.buster;

function touchesObstacle(bird, obstacle, scale) {
  const reach = CONFIG.BIRD_SPRITE_SIZE / 2 * scale;
  const x = bird.x - obstacle.x;
  if (x + reach < 0 || x - reach > obstacle.width) return false;
  const gapTop = obstacle.gapY - obstacle.gapHeight / 2, gapBottom = obstacle.gapY + obstacle.gapHeight / 2;
  const cos = Math.cos(bird.rotation), sin = Math.sin(bird.rotation);
  return collidersFor(bird.streamerId).some(([cx, cy, radius]) => {
    const centerX = x + Math.round((cx * cos - cy * sin) * scale * UNIT) / UNIT;
    const centerY = bird.y + Math.round((cx * sin + cy * cos) * scale * UNIT) / UNIT;
    return circleIntersectsColumn(centerX, gapTop - centerY, radius * scale) ||
      circleIntersectsColumn(centerX, centerY - gapBottom, radius * scale);
  });
}

// Rules v24: one shared contour, cut into trapezoids and tested with separating axes.
const poses = new Map();
function pose(rotation) {
  if (poses.has(rotation)) return poses.get(rotation);
  const cos = Math.cos(rotation), sin = Math.sin(rotation);
  const rotate = (x, y) => [x * cos - y * sin, x * sin + y * cos];
  const rows = FLIGHT_SECTIONS.map(([y, left, right]) => [rotate(left, y), rotate(right, y)]);
  const strips = rows.slice(1).map(([left, right], i) => {
    const points = [rows[i][0], rows[i][1], right, left];
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const axes = points.map(([x, y], j) => {
      const next = points[(j + 1) % 4];
      const nx = next[1] - y, ny = x - next[0];
      const projection = points.map(p => p[0] * nx + p[1] * ny);
      return [nx, ny, Math.min(...projection), Math.max(...projection)];
    });
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys), axes };
  });
  const result = {
    strips,
    left: Math.min(...strips.map(s => s.left)), right: Math.max(...strips.map(s => s.right)),
    top: Math.min(...strips.map(s => s.top)), bottom: Math.max(...strips.map(s => s.bottom)),
  };
  poses.set(rotation, result);
  return result;
}

function overlaps(model, left, top, right, bottom) {
  return model.strips.some(strip => {
    if (strip.right < left || strip.left > right || strip.bottom < top || strip.top > bottom) return false;
    return strip.axes.every(([nx, ny, low, high]) => {
      const x1 = nx * left, x2 = nx * right, y1 = ny * top, y2 = ny * bottom;
      return Math.max(x1, x2) + Math.max(y1, y2) >= low && Math.min(x1, x2) + Math.min(y1, y2) <= high;
    });
  });
}

function commonCollision(bird, scale, obstacles) {
  const model = pose(bird.rotation);
  if (bird.y + scale * model.top <= CONFIG.FIELD_TOP) return 'ceiling';
  if (bird.y + scale * model.bottom >= CONFIG.FIELD_BOTTOM) return 'floor';
  for (const obstacle of obstacles) {
    const x = (obstacle.x - bird.x) / scale;
    if (x > model.right || x + obstacle.width / scale < model.left) continue;
    const upper = (obstacle.gapY - obstacle.gapHeight / 2 - bird.y) / scale;
    const lower = (obstacle.gapY + obstacle.gapHeight / 2 - bird.y) / scale;
    if (model.top > upper && model.bottom < lower) continue;
    const rect = (l, t, r, b) => t <= b && overlaps(model, x + l / scale, t, x + r / scale, b);
    if (rect(2, model.top, obstacle.width - 3, upper - 44 / scale) ||
        rect(2, lower + 44 / scale, obstacle.width - 3, model.bottom)) return 'collision';
    for (const [start, end, left, right] of COLUMN_TIP) {
      if (rect(left, upper - end / scale, right, upper - start / scale) ||
          rect(left, lower + start / scale, right, lower + end / scale)) return 'collision';
    }
  }
  return null;
}

export function birdScaleAt(state, tick = state.tick) {
  const remaining = state.effects.shrinkUntil - tick;
  const progress = clamp(Math.min(remaining, PICKUP.duration - remaining) / PICKUP.shrinkTransitionTicks, 0, 1);
  const eased = progress * progress * (3 - 2 * progress);
  return 1 - (1 - PICKUP.shrinkScale) * eased;
}

function endGame(state, reason) {
  state.alive = false;
  state.endedReason = reason;
}

const nextVerticalSpeed = vy => Math.min(TERMINAL_PER_TICK, Math.fround(vy + GRAVITY_PER_TICK));
const nextVerticalPosition = (y, vy) => Math.trunc(Math.fround(y + vy));
const fieldY = y => CONFIG.START_Y + (y - FLAPPY_START_Y) * FLAPPY_SCALE;

function advanceBird(bird, flap) {
  if (flap) {
    bird.originalVy = FLAP_PER_TICK;
    bird.angleVelocity = ROTATION_PER_FLAP;
  }
  bird.originalVy = nextVerticalSpeed(bird.originalVy);
  bird.originalY = nextVerticalPosition(bird.originalY, bird.originalVy);
  bird.y = fieldY(bird.originalY);
  bird.vy = bird.originalVy * FLAPPY_SCALE * CONFIG.TICK_RATE;
  bird.angle = clamp(Math.fround(bird.angle + bird.angleVelocity), CONFIG.BIRD_MIN_ANGLE, CONFIG.BIRD_MAX_ANGLE);
  bird.angleVelocity = Math.fround(bird.angleVelocity + ROTATION_ACCELERATION);
  bird.rotation = Math.trunc(bird.angle) * RADIANS_PER_DEGREE;
}

/** Render only the current fractional tick; collisions and pickups stay in stepGame. */
export function projectFlight(state, fraction, tapPhase, view) {
  const bird = state.bird;
  const projected = Object.assign(view.bird, bird);
  const flap = tapPhase !== null && tapPhase < fraction &&
    state.tick - state.lastFlapTick >= CONFIG.MIN_FLAP_TICKS;
  advanceBird(projected, flap);
  let y = bird.y;
  let motion = fraction;
  if (flap) {
    const noTapY = fieldY(nextVerticalPosition(bird.originalY, nextVerticalSpeed(bird.originalVy)));
    y += (noTapY - y) * tapPhase;
    motion = (fraction - tapPhase) / (1 - tapPhase);
  }
  projected.y = y + (projected.y - y) * motion;
  projected.rotation = bird.rotation + (projected.rotation - bird.rotation) * motion;
  view.tick = state.tick + fraction;
  view.scroll = difficultyAt(state.tick).speedFixed * fraction / UNIT;
}

/** A flap at input tick t is applied BEFORE advancing state.tick from t to t + 1. */
export function stepGame(state, flap = false) {
  if (!state.alive) return state;
  state.flapped = false;
  state.scoredThisTick = 0;
  state.bonusThisTick = 0;
  state.effectThisTick = false;
  state.passedWithoutBonusThisTick = false;
  const bird = state.bird;
  const previousBirdY = bird.y;
  const birdScale = birdScaleAt(state);
  if (flap && state.tick - state.lastFlapTick >= CONFIG.MIN_FLAP_TICKS) {
    state.lastFlapTick = state.tick;
    state.flapped = true;
  }
  advanceBird(bird, state.flapped);

  const { speed, speedFixed } = difficultyAt(state.tick);
  state.speed = speed;
  state.distanceFixed += speedFixed;
  state.distance = state.distanceFixed / UNIT;
  for (const obstacle of state.obstacles) {
    obstacle.xFixed -= speedFixed;
    obstacle.x = obstacle.xFixed / UNIT;
    const pickup = obstacle.bonus ?? obstacle.effect;
    if (pickup) pickup.x = obstacle.x + obstacle.width / 2;
  }
  state.tick++;

  if (state.version === COMMON_RULES) {
    const contact = commonCollision(bird, birdScaleAt(state), state.obstacles);
    if (contact) endGame(state, contact);
  } else if (bird.y - bird.radius * birdScale <= CONFIG.FIELD_TOP) endGame(state, 'ceiling');
  else if (bird.y + bird.radius * birdScale >= CONFIG.FIELD_BOTTOM) endGame(state, 'floor');
  else if (state.obstacles.some(obstacle => touchesObstacle(bird, obstacle, birdScale))) endGame(state, 'collision');

  if (state.alive) {
    for (const obstacle of state.obstacles) {
      const bonus = obstacle.bonus;
      if (bonus && !bonus.collected && touchesStatue(
        bird.x - bonus.x - speedFixed / UNIT, previousBirdY - bonus.y,
        bird.x - bonus.x, bird.y - bonus.y, birdScale,
      )) {
        bonus.collected = true;
        state.score += CONFIG.BONUS_POINTS;
        state.scoredThisTick += CONFIG.BONUS_POINTS;
        state.bonusesCollected++;
        state.bonusThisTick++;
      }
      const effect = obstacle.effect;
      if (effect && !effect.collected && distanceToSegmentSquared(effect.x, effect.y,
        bird.x - speedFixed / UNIT, previousBirdY, bird.x, bird.y,
      ) <= (PICKUP.size * 0.28 + STATUE.pickupBirdRadius * birdScale) ** 2) {
        effect.collected = true;
        state.effects.shrinkUntil = state.tick + PICKUP.duration;
        state.effectThisTick = true;
      }
      if (!obstacle.passed && obstacle.x + obstacle.width < bird.x - bird.radius) {
        obstacle.passed = true;
        state.score++;
        state.passedCount++;
        state.scoredThisTick++;
        if (!(bonus ?? effect)?.collected) state.passedWithoutBonusThisTick = true;
      }
    }
    if (state.tick >= CONFIG.MAX_TICKS) endGame(state, 'timeout');
  }

  // Keep only nearby columns; the client always holds three.
  state.obstacles = state.obstacles.filter(obstacle => obstacle.x + obstacle.width >= -32);
  while (state.obstacles.length < 3) addObstacle(state, nextObstacleX(state, state.obstacles.at(-1).xFixed));
  return state;
}
