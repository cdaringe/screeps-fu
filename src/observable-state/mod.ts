import { Subject, Observable, combineLatest } from "rxjs";
import { combineLatestAll, filter } from "rxjs/operators";

const DEFAULT_CREEP_WRITER = (_: CreepEvent) => {}; // establish type sig only

type ScreepsEvent<T> = { state: T; creepId: string };
export type CreepEvent = ScreepsEvent<Creep>;

export const creep = (creepId: string, initialState: CreepEvent["state"]) => {
  let writeInner = DEFAULT_CREEP_WRITER;
  const write = (state: CreepEvent["state"]) => writeInner({ creepId, state });
  const observable = new Observable<CreepEvent>(subscriber => {
    writeInner = subscriber.next.bind(subscriber) as unknown as any;
    write(initialState);
  });
  return { observable, write };
};

export type OCreep = ReturnType<typeof creep>;
