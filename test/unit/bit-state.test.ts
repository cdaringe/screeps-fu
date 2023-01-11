import { BitState } from "../../src/utils/bit-state";
import test from "ava";
import { BitState30 } from "../../src/utils/bit-state-30";

test("BitState", t => {
  t.throws(() => BitState.of(0));
  let bs = BitState.of(1);
  t.deepEqual(bs.toArray(), []) // 1 => []
  t.is(JSON.stringify(bs), "[1]");
  t.is(bs.length, 0);
  bs = BitState.of(2); // 2 => [false]
  t.deepEqual(bs.toArray(), [false]) // 1 => []
  t.is(bs.length, 1);
  t.is(JSON.stringify(bs), "[2]");
  t.deepEqual(bs.toArray(), [false]);
  const lotsDataTrue = [...new Array(31)].map(_ => true);
  bs = BitState.ofArray(lotsDataTrue);
  t.deepEqual(bs.toArray(), lotsDataTrue)
  t.is(JSON.stringify(bs), "[2147483647,3]");
  const megaData = [...new Array(64)].map(_ => true);
  bs = BitState.ofArray(megaData);
  t.is(JSON.stringify(bs), "[2147483647,2147483647,31]");
  t.deepEqual(bs.toArray(), megaData);
});
