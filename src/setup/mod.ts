import * as strategy from "../strategy/mod";
import * as worker from "./creep_worker";
import * as util from "./global_utilities";
import { PlanMap } from "../plan/plan-map";

export function setup() {
  strategy.onSetup();
  worker.initIds();
  resetMemory({ onSetupCreep: strategy.onSetupCreep });
  util.bind();
}

function resetMemory(opts: { onSetupCreep: (c: Creep) => void }) {
  // Automatically delete memory of missing creeps. The game engine
  // may have mutated Memory between our ticks :|
  for (const name in Memory.creeps) {
    const creepMem = Memory.creeps[name];
    if (creepMem) {
      const creep = Game.creeps[name];
      if (!creep) {
        throw new Error(`missing creep when creep mem present: ${name}`);
      }
      // const plan = creepMem.plan;
      // if (plan) {
      //   global.plan.creeps[name] = plan;
      //   throw new Error(`^^ plan currently may be in a weird format. do we need to deser?`);
      // }
      opts.onSetupCreep(creep);
    } else {
      delete Memory.creeps[name];
    }
    worker.maybeUpdateLastId(name);
  }
}

export function teardown() {
  // @todo
  throw new Error(`add custom memory serialization. see unused PlanIO::toJson`);
}
