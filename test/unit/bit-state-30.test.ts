import test from "ava";
import { BitState30 } from "../../src/utils/bit-state-30";

test("BitState30", t => {
  t.throws(() => BitState30.of(0));
  let bs = BitState30.of(1);
  t.is(bs.length, 0);
  t.is(JSON.stringify(bs), "1");
  t.is(bs.length, 0);
  bs = BitState30.of(2);
  t.is(bs.length, 1);
  t.is(JSON.stringify(bs), "2");
  t.deepEqual(bs.toArray(), [false]);
  const maxDataTrue = [...new Array(BitState30.MAX_SIZE)].map(_ => true);
  bs = BitState30.ofArray(maxDataTrue);
  t.is(JSON.stringify(bs), "2147483647");
  t.deepEqual(bs.toArray(), maxDataTrue);
  bs = BitState30.of(2147483647);
  t.deepEqual(bs.toArray(), maxDataTrue);
  const overrunData = [...maxDataTrue, false]; // should be ignored, 32nd bit
  t.throws(() => BitState30.ofArray(overrunData));
  bs = BitState30.ofArray([false, false])
  t.deepEqual(bs.toJSON(), 4);
});
