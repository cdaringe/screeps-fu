import { init as initStrategy, run } from "./strategy";

export function setup() {
  initStrategy();
  global.lastWorkerId = 0;
  global.getNextWorkerId = function getNextWorkerId() {
    ++global.lastWorkerId;
    return global.lastWorkerId;
  };
  resetMemory();
  global.nev = (p: never) => {};

  /**
   * @warn it's ugly, but it's fast
   */
  global.creepsByRole = (creeps) => {
    var byType: Partial<Record<CreepRole, Record<string, Creep>>> = {};
    for (var i in creeps) {
      var creep = creeps[i]!;
      var type = creep.memory.current.role!;
      const roleCreepsById = byType[type] ?? {};
      roleCreepsById[creep.name] = creep;
      byType[type] = roleCreepsById;
    }
    return byType;
  };

  global.STRUCTURE_MAPS = {
    ENERGY_CONSUMING: new Set([
      STRUCTURE_SPAWN,
      STRUCTURE_EXTENSION,
      STRUCTURE_TOWER,
      STRUCTURE_LINK,
      STRUCTURE_LAB,
      STRUCTURE_POWER_SPAWN,
      STRUCTURE_NUKER,
      STRUCTURE_FACTORY,
      STRUCTURE_STORAGE,
      STRUCTURE_TERMINAL,
    ]),
  };
}

function maybeUpdateLastWorkerId(name: string) {
  const [_, idString] = name.match(/(\d+)$/) || [];
  if (idString) {
    const id = parseInt(idString, 10);
    global.lastWorkerId = Math.max(id, global.lastWorkerId);
  }
}

function resetMemory() {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
    maybeUpdateLastWorkerId(name);
  }
}
