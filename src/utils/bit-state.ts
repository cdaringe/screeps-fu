import { BitState30 } from "./bit-state-30";

export class BitState {
  private state: BitState30[] = [];

  get length() {
    return this.state.reduce((tot, bs) => tot + bs.length, 0);
  }

  static fromNumbers(vs: number[]) {
    const bs = new BitState();
    vs.forEach(v => bs.state.push(BitState30.of(v)));
    return bs;
  }

  static of(v: number) {
    if (v > 2147483647) throw new Error(`exceeded max int. try fromNumbers instead`);
    return BitState.fromNumbers([v]);
  }

  static ofArray(xs: boolean[]) {
    const bs = new BitState();
    xs.forEach((x, i) => {
      if (i % BitState30.MAX_SIZE === 0) {
        bs.state.push(new BitState30());
      }
      const bs3 = bs.state[bs.state.length - 1]!;
      bs3.push(x);
    });
    return bs;
  }

  push(v: boolean) {
    let open = this.state.find(bs => bs.length <= BitState30.MAX_SIZE);
    if (!open) {
      open = new BitState30();
      this.state.push(open);
    }
    return open.push(v);
  }
  pop() {
    const last = this.state[this.state.length - 1];
    if (!last) throw new Error("empty bitstate");
    const ret = last.pop();
    if (last.length === 0) this.state.pop();
    return ret;
  }

  toArray() {
    return this.state.reduce((acc, it) => acc.concat(it.toArray()), [] as boolean[]);
  }

  toJSON() {
    return this.state;
  }
}
