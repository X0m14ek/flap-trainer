// Taps are timestamped in the requestAnimationFrame clock. A tap counts for the tick whose end is after it;
// several taps inside one tick merge, taps across a delayed frame stay separate.
export class FlapQueue {
  times = [];

  add(time) {
    const next = this.times.findIndex(value => value > time);
    if (next === -1) this.times.push(time);
    else this.times.splice(next, 0, time);
  }

  takeBefore(end) {
    let count = 0;
    while (count < this.times.length && this.times[count] < end) count++;
    if (count) this.times.splice(0, count);
    return count > 0;
  }

  phase(start, step) {
    const time = this.times[0];
    return time === undefined || time >= start + step ? null : Math.max(0, (time - start) / step);
  }

  clear() { this.times.length = 0; }
}

export function eventTime(stamp, now, origin) {
  const value = stamp > 1e12 ? stamp - origin : stamp;
  return Number.isFinite(value) && value > 0 ? Math.min(now, value) : now;
}
