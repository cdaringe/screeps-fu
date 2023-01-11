import { BitState } from "../../src/utils/bit-state";
import test from "ava";
import { BitState30 } from "../../src/utils/bit-state-30";

test("BitState", t => {
  let bs = new BitState();
  t.is(bs.length, 0)
  t.is(JSON.stringify(bs), "[1]");
  t.deepEqual(bs.toArray(), [])

  t.throws(() => BitState.of(0));

  bs = BitState.of(1);
  t.is(bs.length, 0);
  t.is(JSON.stringify(bs), "[1]");
  t.deepEqual(BitState.ofArray([]).toJSON(), [1])
  t.deepEqual(bs.toArray(), []) // 1 => []

  bs = BitState.of(2);
  t.is(bs.length, 1);
  t.is(JSON.stringify(bs), "[2]");
  t.deepEqual(BitState.ofArray([false]).toJSON(), [2])
  t.deepEqual(bs.toArray(), [false]) // 2 => [false]

  bs = BitState.of(3);
  t.is(bs.length, 1);
  t.is(JSON.stringify(bs), "[3]");
  t.deepEqual(BitState.ofArray([true]).toJSON(), [3])
  t.deepEqual(bs.toArray(), [true]) // 3 => [true]

  const lotsDataTrue = [...new Array(31)].map(_ => true);
  bs = BitState.ofArray(lotsDataTrue);
  t.is(bs.length, 31)
  t.is(JSON.stringify(bs), "[2147483647,3]");
  t.deepEqual(bs.toArray(), lotsDataTrue)

  const megaData = [...new Array(64)].map(_ => true);
  bs = BitState.ofArray(megaData);
  t.is(bs.length, 64)
  t.is(JSON.stringify(bs), "[2147483647,2147483647,31]");
  t.deepEqual(bs.toArray(), megaData);
});
