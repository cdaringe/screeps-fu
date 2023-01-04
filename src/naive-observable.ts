import { CreepAction, StructureAction } from "plan/mod";
import { Subject, Observable, combineLatest } from "rxjs";
import { combineLatestAll, filter } from "rxjs/operators";

type ScreepsEvent<T> = { state: T; creepId: string };
type ScreepEvent = ScreepsEvent<number>;

const upsertCreep = (creepId: string, initialState: ScreepEvent["state"]) => {
  let writeInner = (_: ScreepEvent) => {}; // establish type sig only
  const write = (state: ScreepEvent["state"]) => writeInner({ creepId, state });
  const observable = new Observable<ScreepEvent>(subscriber => {
    writeInner = subscriber.next.bind(subscriber) as unknown as any;
    write(initialState);
  });
  return { observable, write };
};

const storeOfGameCrape = {
  abc: upsertCreep("abc", 1),
  xyz: upsertCreep("xyz", 2)
};

function creeps$() {
  return new Observable(subscriber => {});
}

const initStrategy = () => {
  const creeps = Object.values(storeOfGameCrape);
  return combineLatest(creeps.map(c => c.observable)).pipe(
    filter(function settleStrategy(x) {
      console.log(`x: ${JSON.stringify(x)}`);
      const sum = x.reduce((acc, it) => acc + it.state, 0);
      const first = x[0];
      if (sum < 5 && first) {
        storeOfGameCrape[first.creepId as keyof typeof storeOfGameCrape]?.write(first.state + 1);
        return false;
      }
      return true;
    })
  );
};

initStrategy().subscribe({
  next: v => {
    console.log(`strategy: ${v}`);
  },
  complete: () => console.log("end")
});
/**
 *
 * subscribe to x/y/z, receive x/y/z lazily
 *
 */

/**
 * combine(foo, bar)
 */
