// A small seeded random generator (mulberry32), so the same seed always deals the same
// orders and the screenshot scenes always come out the same frame.
export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    /** An integer from 0 to `max` (exclusive). */
    int(max) {
      return Math.floor(next() * max);
    },
    /** Pick one entry from an array. */
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
  };
}
