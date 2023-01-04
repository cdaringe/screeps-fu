import { init as initStrategy, run } from "../strategy/mod";
import * as worker from "./creep_worker";
import * as util from "./global_utilities";

export function setup() {
  initStrategy();
  worker.initIds();
  resetMemory();
  util.bind();
}

function resetMemory() {
  const creepsPlan = {};
  const structuresPlan = {};
  global.plan = {
    creeps: creepsPlan,
    structures: structuresPlan
  };
  // Automatically delete memory of missing creeps. The game engine
  // may have mutated Memory between our ticks :|
  for (const name in Memory.creeps) {
    if (name in Game.creeps) {
      const creep = Memory.creeps[name];
      const plan = creep?.plan;
      if (plan) {
        global.plan.creeps[name] = plan;
        throw new Error(`^^ plan currently may be in a weird format. do we need to deser?`);
      }
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
