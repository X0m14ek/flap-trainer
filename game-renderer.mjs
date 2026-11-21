import { birdScaleAt, collidersFor, COLUMN_TIP, COMMON_RULES, CONFIG, FLIGHT_SECTIONS, PICKUP, projectFlight, STATUE, STRICT_RULES } from './shared/physics.mjs';

const COLORS = {
  stone: '#4b4163', stoneLight: '#6c5d8c', stoneDark: '#2a2238',
  bird: '#ff7b3a', birdLine: 'rgba(255,255,255,.28)', dead: '#ff4d6d',
  bonus: '#f2c14e', bonusText: '#3a2a05', effect: '#4fd6e8', effectGlow: 'rgba(79,214,232,.18)', effectText: '#05282d',
  edge: 'rgba(255,123,58,.35)', sprite: 'rgba(241,236,248,.3)',
};
const statueCos = Math.cos(STATUE.angle), statueSin = Math.sin(STATUE.angle);

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: true });
    this.flight = { bird: {} };
    this.showSprite = false;
  }

  // Same projection as the game: one world unit scale from the height, extra width reveals more course ahead.
  resize(width, height, scale, left, top) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2, 1450 / height, 1600 / width);
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (pixelWidth !== this.canvas.width || pixelHeight !== this.canvas.height) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    const pixelScale = scale * pixelHeight / height;
    const x = left * pixelScale / scale;
    const y = top * pixelScale / scale;
    this.visibleLeft = -x / pixelScale;
    this.visibleWidth = pixelWidth / pixelScale;
    this.visibleTop = -y / pixelScale;
    this.visibleBottom = (pixelHeight - y) / pixelScale;
    this.context.setTransform(pixelScale, 0, 0, pixelScale, x, y);
  }

  drawFlight(state, fraction, tapPhase) {
    projectFlight(state, fraction, tapPhase, this.flight);
    this.draw(state, this.flight);
  }

  drawColumn(x, gapTop, gapBottom) {
    const ctx = this.context, top = this.visibleTop, bottom = this.visibleBottom;
    const upperEnd = gapTop - 44, lowerStart = gapBottom + 44;
    ctx.fillStyle = COLORS.stone;
    if (upperEnd > top) ctx.fillRect(x + 2, top, 67, upperEnd - top);
    if (bottom > lowerStart) ctx.fillRect(x + 2, lowerStart, 67, bottom - lowerStart);
    for (const [start, end, left, right] of COLUMN_TIP) {
      ctx.fillRect(x + left, gapTop - end, right - left, end - start);
      ctx.fillRect(x + left, gapBottom + start, right - left, end - start);
    }
    ctx.fillStyle = COLORS.stoneLight;
    if (upperEnd > top) ctx.fillRect(x + 6, top, 6, upperEnd - top);
    if (bottom > lowerStart) ctx.fillRect(x + 6, lowerStart, 6, bottom - lowerStart);
    ctx.fillStyle = COLORS.stoneDark;
    if (upperEnd > top) ctx.fillRect(x + 61, top, 8, upperEnd - top);
    if (bottom > lowerStart) ctx.fillRect(x + 61, lowerStart, 8, bottom - lowerStart);
  }

  drawBird(bird, scale, version, dead) {
    const ctx = this.context;
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    ctx.scale(scale, scale);
    ctx.fillStyle = dead ? COLORS.dead : COLORS.bird;
    if (version === COMMON_RULES || version === STRICT_RULES) {
      ctx.beginPath();
      FLIGHT_SECTIONS.forEach(([y, left], i) => i ? ctx.lineTo(left, y) : ctx.moveTo(left, y));
      for (let i = FLIGHT_SECTIONS.length - 1; i >= 0; i--) ctx.lineTo(FLIGHT_SECTIONS[i][2], FLIGHT_SECTIONS[i][0]);
      ctx.closePath();
      ctx.fill();
    }
    if (version !== COMMON_RULES) {
      const circles = collidersFor(bird.streamerId);
      for (const [cx, cy, r] of circles) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = COLORS.birdLine;
      ctx.lineWidth = 1 / scale;
      for (const [cx, cy, r] of circles) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (this.showSprite) {
      ctx.strokeStyle = COLORS.sprite;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5 / scale;
      const half = CONFIG.BIRD_SPRITE_SIZE / 2;
      ctx.strokeRect(-half, -half, half * 2, half * 2);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  draw(state, flight = null) {
    const ctx = this.context;
    ctx.clearRect(this.visibleLeft, this.visibleTop, this.visibleWidth, this.visibleBottom - this.visibleTop);
    const right = this.visibleLeft + this.visibleWidth;
    const scroll = flight ? flight.scroll : 0;
    for (const obstacle of state.obstacles) {
      const x = obstacle.x - scroll;
      if (obstacle.effect && !obstacle.effect.collected) {
        const cx = x + obstacle.width / 2, y = obstacle.effect.y;
        ctx.fillStyle = COLORS.effectGlow;
        ctx.beginPath(); ctx.arc(cx, y, PICKUP.size / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.effect;
        ctx.beginPath(); ctx.arc(cx, y, PICKUP.size * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.font = '700 13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.effectText; ctx.fillText('×0.7', cx, y);
      }
      if (x >= right || x + obstacle.width <= this.visibleLeft) continue;
      this.drawColumn(x, obstacle.gapY - obstacle.gapHeight / 2, obstacle.gapY + obstacle.gapHeight / 2);
      if (obstacle.bonus && !obstacle.bonus.collected) {
        const cx = x + obstacle.width / 2, cy = obstacle.bonus.y, a = STATUE.halfAxis;
        ctx.strokeStyle = COLORS.bonus; ctx.lineCap = 'round'; ctx.lineWidth = STATUE.radius * 2;
        ctx.beginPath(); ctx.moveTo(cx + a * statueSin, cy - a * statueCos); ctx.lineTo(cx - a * statueSin, cy + a * statueCos); ctx.stroke();
        ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.bonusText; ctx.fillText('+10', cx, cy);
      }
    }
    ctx.fillStyle = COLORS.edge;
    ctx.fillRect(this.visibleLeft, CONFIG.FIELD_TOP - 1, this.visibleWidth, 1);
    ctx.fillRect(this.visibleLeft, CONFIG.FIELD_BOTTOM - 1, this.visibleWidth, 1);
    const bird = flight ? flight.bird : state.bird;
    const tick = flight ? flight.tick : state.tick;
    this.drawBird(bird, birdScaleAt(state, tick), state.version, !state.alive);
  }
}
