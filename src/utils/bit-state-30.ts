/**
 * Stores 0-30 true/false values, encoded in a number
 * JS bitwise operations are on signed ints (1 bit),
 * and a leading bit is always used as a sigil to prevent
 * all false states yielding a value of 0.
 */
export class BitState30 {
  static MAX_SIZE = 30;
  private v = 1;
  protected len = 0;

  static of(v: number) {
    const bs = new BitState30();
    if (v <= 0) {
      throw new Error('invalid value')
    }
    let rem = v;
    let q: boolean[] = [];
    while (rem - 1) {
      const isOne = rem % 2 !== 0;
      q.push(isOne);
      rem = rem >>> 1;
    }
    q.reverse().forEach(bit => bs.push(bit));
    return bs;
  }

  static ofArray(v: boolean[]) {
    const bs = new BitState30();
    v.reverse().forEach(bool => bs.push(bool));
    return bs;
  }

  get length() {
    return this.len;
  }

  push(bool: boolean) {
    if (this.len === BitState30.MAX_SIZE) {
      throw new Error("bit overflow");
    }
    this.len = this.len + 1;
    const toAdd = bool ? 1 : 0;
    const nextV = (this.v << 1) | toAdd;
    this.v = nextV;
  }

  pop() {
    const anded = 1 & this.v;
    const ret = anded % 2 === 1;
    this.v = this.v >>> 1;
    this.len -= 1;
    return ret;
  }

  toArray() {
    const bs = BitState30.of(this.v);
    let rem = bs.length;
    const states: boolean[] = [];
    while (rem) {
      states.unshift(bs.pop());
      --rem;
    }
    return states;
  }

  toJSON() {
    return this.v;
  }
}
