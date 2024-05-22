import {
  creepCurrentRoom,
  sourceHasEnergy,
  structureWithUnfilledEnergy,
} from "filters";
import { partitionByRatio, sum } from "./utils.collection";
import { nearestPosition } from "sort";

export const run = () => {
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName]!;
    const [spawn] = room.find(FIND_MY_SPAWNS);
    if (spawn) {
      getNextWorker(spawn, room);
    }
    plan(room);
  }
};

const getNextWorker = (spawn: StructureSpawn, room: Room) => {
  // @todo insert something interesting here, like... needed energy vs current energy rate ... vs needed defense level
  const roomcreepsByRole = global.creepsByRole(room.find(FIND_MY_CREEPS));
  // @todo this should be _assigned_ to this room, not actually PRESENT in this room
  const workers = roomcreepsByRole.get("work") || [];
  // @todo strategy should compute or specify workers
  const minWorkers = 4;
  // @todo filter by spawns of this tyyype
  const activeSpawns = room
    .find(FIND_STRUCTURES)
    .filter((s) => s.structureType === "spawn" && s.spawning);
  let numWorkersToBuild = minWorkers - activeSpawns.length - workers.length;
  console.log(
    JSON.stringify({ workers: workers.length, minWorkers, numWorkersToBuild }),
  );
  if (numWorkersToBuild <= 0 || spawn.spawning) {
    return;
  }

  const parts: BodyPartConstant[] = ["move", "work", "carry"];
  const partCost = sum(parts.map((p) => BODYPART_COST[p]));

  const isSpawnReady = room.energyAvailable >= partCost;
  if (isSpawnReady) {
    const spawnR = spawn.spawnCreep(
      ["move", "work", "carry"],
      `w_${global.getNextWorkerId()}`,
    );
    switch (spawnR) {
      case OK:
        console.log(`${spawn.name} OK`);
        break;
      case ERR_NOT_OWNER:
        console.log(`${spawn.name} ERR_NOT_OWNER`);
        break;
      case ERR_NO_PATH:
        console.log(`${spawn.name} ERR_NO_PATH`);
        break;
      case ERR_BUSY:
        console.log(`${spawn.name} ERR_BUSY`);
        break;
      case ERR_NAME_EXISTS:
        console.log(`${spawn.name} ERR_NAME_EXISTS`);
        break;
      case ERR_NOT_FOUND:
        console.log(`${spawn.name} ERR_NOT_FOUND`);
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        console.log(`${spawn.name} ERR_NOT_ENOUGH_RESOURCES`);
        break;
      case ERR_NOT_ENOUGH_ENERGY:
        console.log(`${spawn.name} ERR_NOT_ENOUGH_ENERGY`);
        break;
      case ERR_INVALID_TARGET:
        console.log(`${spawn.name} ERR_INVALID_TARGET`);
        break;
      case ERR_FULL:
        console.log(`${spawn.name} ERR_FULL`);
        break;
      case ERR_NOT_IN_RANGE:
        console.log(`${spawn.name} ERR_NOT_IN_RANGE`);
        break;
      case ERR_INVALID_ARGS:
        console.log(`${spawn.name} ERR_INVALID_ARGS`);
        break;
      case ERR_TIRED:
        console.log(`${spawn.name} ERR_TIRED`);
        break;
      case ERR_NO_BODYPART:
        console.log(`${spawn.name} ERR_NO_BODYPART`);
        break;
      case ERR_NOT_ENOUGH_EXTENSIONS:
        console.log(`${spawn.name} ERR_NOT_ENOUGH_EXTENSIONS`);
        break;
      case ERR_RCL_NOT_ENOUGH:
        console.log(`${spawn.name} ERR_RCL_NOT_ENOUGH`);
        break;
      case ERR_GCL_NOT_ENOUGH:
        console.log(`${spawn.name} ERR_GCL_NOT_ENOUGH`);
        break;
    }
  }
};

function findSink(sinks: Structure[], startingI: number) {
  let i = startingI;
  let rem = sinks.length;
  while (rem > 0) {
    const sink = sinks[i % sinks.length];
    if (sink) return sink;
    ++i;
    --rem;
  }
  return null;
}

type AnyFn = (...args: any[]) => any;
type SignatureByMethodName<D extends Record<string, any>> = {
  [K in keyof D as D[K] extends AnyFn ? K : never]: [
    methodName: K,
    params: Parameters<D[K]>,
  ];
};
type Values<T> = T[keyof T];

type CreepMethod = Values<SignatureByMethodName<Creep>>;

/**
 * what-needs-to-be-done (this is the strategy)
 * |> who's around (good and bad)
 * |> what's everyone doing
 * |> what's the state of things of the room
 * |> whatToDoNext
 *
 * What to do next should generally do the following:
 * - keep doing what you're doing unless there are good reasons to change
 * - if you're not doing anything, find something to do
 * - test for key thresholds and act accordingly (score 0-100)
 * - Generally, we have the following priorities:
 *  - defend yourself, defend your areas with walls
 *  - scale up energies
 *  - ensure basic defenses are in place, proportional to the room's value
 *  - upgrade the room, then the creeps
 *    - if creeps gonna die soon, don't upgrade them
 *  -
 */

type ProposedActionByName = Record<string, CreepMethod>;

type PlanState = {
  collections: {
    creeps: {
      byRole: CreepsByRole;
      all: Creep[];
    };
    actionsByCreepName: ProposedActionByName;
    sinks: {
      unfilledEnergy: Structure[];
    };
  };
  targetState: {
    roleAllocations: Record<CreepRole, number>;
  };
  iteration: number;
};

const plan = (room: Room, prevState?: PlanState): PlanState => {
  const allCreeps =
    prevState?.collections.creeps.all ?? room.find(FIND_MY_CREEPS);
  const state: PlanState = prevState ?? {
    collections: {
      creeps: {
        byRole: global.creepsByRole(allCreeps),
        all: allCreeps,
      },
      actionsByCreepName: {},
      sinks: {
        unfilledEnergy: room.find(FIND_STRUCTURES, {
          filter: structureWithUnfilledEnergy,
        }),
      },
    },
    iteration: 0,
    targetState: {
      /**
       * @warn This ratio should not be static, but change based on the current
       * state of the room
       */
      roleAllocations: {
        harvester: 0.5,
        upgrader: 0.25,
        builder: 0.25,
      },
    },
  };

  // @todo check for attackers

  state.collections.actionsByCreepName = planActions(state);
  ++state.iteration;

  if (isPlanSettled(state)) {
    return state;
  }
  return plan(room, state);
};

/**
 * @todo figure out if we need to iterate again
 */
const isPlanSettled = (state: PlanState) => {
  if (state.iteration > 2) {
    return true;
  }
  const overallocatedCreeps = state.collections.creeps.all.filter(
    (creep) => creep.memory.current.isOverallocatedRole,
  );
  if (overallocatedCreeps.length > 0) {
    // rebalance creeps
    console.log("@todo rebalcance creeps");
    return true;
  }
  return true;
};

const planActions = (state: PlanState): ProposedActionByName => {
  const prevProposed = state.collections.actionsByCreepName;
  const nextProposed: ProposedActionByName = {};
  const creepsByRole = state.collections.creeps.byRole;
  const nextProposedByRole: Record<CreepRole, ProposedActionByName> = {
    harvester: {},
    upgrader: {},
    builder: {},
  };
  const priortizedRolesDescending = Object.entries(
    state.targetState.roleAllocations,
  )
    .sort(([, aWeight], [, bWeight]) => bWeight - aWeight)
    .map(([role]) => role as CreepRole);
  for (const role of priortizedRolesDescending) {
    const creepsByName = creepsByRole[role];
    for (const name in creepsByName) {
      const creep = creepsByName[name]!;
      const role = creep.memory.current.role;
      creep.memory.current.isOverallocatedRole =
        Object.keys(nextProposedByRole[role]).length >
        state.targetState.roleAllocations[role];
      nextProposed[creep.name] = (() => {
        const input: PlanRoleAction = { state, nextProposed, creep };
        switch (role) {
          case "harvester":
            return planCreepHarvesterAction(input);
          case "upgrader":
            return planCreepUpgraderAction(input);
          case "builder":
            return planCreepBuilderAction(input);
          default:
            global.nev(role);
            throw new Error(`unhandled role ${role}`);
        }
      })();
    }
  }

  // workersByType.upgrade.forEach((c, ci) => {
  //   const [rlc] = room.find(FIND_STRUCTURES, {
  //     filter: (s) => s.structureType === STRUCTURE_CONTROLLER,
  //   });
  //   const controller = c.room.controller;
  //   if (rlc && controller) {
  //     if (c.store[RESOURCE_ENERGY] == 0) {
  //       const [source0] = c.room.find(FIND_SOURCES);
  //       if (!source0) throw new Error(`mising source`);
  //       if (c.harvest(source0) == ERR_NOT_IN_RANGE) {
  //         c.moveTo(source0);
  //       }
  //     } else {
  //       if (c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
  //         c.moveTo(controller);
  //       }
  //     }
  //   } else {
  //     console.log(`${c.name} no (rlc, controller) (${rlc}, ${controller})`);
  //   }
  // });

  // workersByType.build.forEach((c, ci) => {
  //   c.memory.role = "build";
  //   const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
  //   // @todo refil resources
  //   const site = sites[ci % sites.length];
  //   if (site) {
  //     const buildR = c.build(site);
  //     switch (buildR) {
  //       case OK:
  //         return;
  //       case ERR_NOT_OWNER:
  //         throw new Error("not owner");
  //       case ERR_BUSY:
  //         break;
  //       case ERR_NOT_ENOUGH_RESOURCES:
  //         console.log(`${c.id} not enough resources to build`);
  //       case ERR_INVALID_TARGET:
  //         console.log(`tried to build invalid`);
  //         break;
  //       case ERR_NOT_IN_RANGE:
  //         c.moveTo(site.pos);
  //         break;
  //       case ERR_NO_BODYPART:
  //         c.suicide();
  //         break;
  //       case ERR_RCL_NOT_ENOUGH:
  //         console.log("RCL not enough");
  //     }
  //   }
  // });

  return nextProposed;
};

type PlanRoleAction = {
  state: PlanState;
  nextProposed: ProposedActionByName;
  creep: Creep;
};

type PlanRoleActionFn = (_: PlanRoleAction) => CreepMethod;

const planCreepHarvesterAction: PlanRoleActionFn = ({
  creep,
  nextProposed,
  state,
}: PlanRoleAction): CreepMethod => {
  const total = creep.store.getCapacity();
  const used = creep.store.getUsedCapacity();
  const free = total - used;
  creep.say(`(${used}/${total})`);
  if (free > 0) {
    const mem = creep.memory.current as HarvestorMemory;

    const source = room
      .find(FIND_SOURCES, { filter: sourceHasEnergy })
      .sort(nearestPosition)[0];

    if (!source) {
      return;
    }
    if (source) {
      function assignSource(source: Source) {
        const harvestR = c.harvest(source);
        switch (harvestR) {
          case OK:
            break;
          case ERR_NOT_OWNER:
          case ERR_INVALID_TARGET:
            throw new Error("not owner or bad target");
          case ERR_BUSY:
            console.log("busy");
            break;
          case ERR_NOT_IN_RANGE:
            c.moveTo(source.pos);
            break;
          case ERR_NO_BODYPART:
            c.suicide();
            console.log("snap, i cannot do this job ERR_NO_BODYPART");
            break;
          case ERR_TIRED:
            console.log("dang, im tired bro");
            break;
          case ERR_NOT_FOUND:
            console.log("source not found");
            break;
          case ERR_NOT_ENOUGH_RESOURCES:
            console.log(`not enough resources`);
            // @todo try next resource until all exhausted, otherwise... turn into something else
            break;
          default:
            global.nev(harvestR);
        }
      }
      assignSource(source);
    } else {
      console.log(`${c.id}, no sources`);
    }
  } else {
    const sink = findSink(sinks, ci % sinks.length);
    if (sink) {
      const tResult = c.transfer(sink, RESOURCE_ENERGY);
      switch (tResult) {
        case OK:
          break;
        case ERR_NOT_OWNER:
          console.log("not owner :(");
          c.suicide();
          break;
        case ERR_NO_PATH:
          console.log("no path to structure");
          break;
        case ERR_BUSY:
          console.log("busy");
          break;
        case ERR_NAME_EXISTS:
          console.log(`${c.id} ERR_NAME_EXISTS`);
          break;
        case ERR_NOT_FOUND:
          console.log(`${c.id} ERR_NOT_FOUND`);
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          console.log(`${c.id} ERR_NOT_ENOUGH_RESOURCES`);
          break;
        case ERR_NOT_ENOUGH_ENERGY:
          console.log(`${c.id} ERR_NOT_ENOUGH_ENERGY`);
          break;
        case ERR_INVALID_TARGET:
          console.log(`${c.id} ERR_INVALID_TARGET`);
          break;
        case ERR_FULL:
          console.log(`${c.name} ERR_FULL`);
          break;
        case ERR_NOT_IN_RANGE:
          c.moveTo(sink.pos);
          break;
        case ERR_INVALID_ARGS:
          throw new Error("ERR_INVALID_ARGS");
          break;
        case ERR_TIRED:
          console.log(`${c.id} ERR_TIRED`);
          break;
        case ERR_NO_BODYPART:
          throw new Error(`${c.id} ERR_NO_BODYPART`);
          break;
        case ERR_NOT_ENOUGH_EXTENSIONS:
          throw new Error(`${c.id} ERR_NOT_ENOUGH_EXTENSIONS`);
        case ERR_RCL_NOT_ENOUGH:
          console.log(`${c.id} ERR_RCL_NOT_ENOUGH`);
          break;
        case ERR_GCL_NOT_ENOUGH:
          console.log(`${c.id} ERR_GCL_NOT_ENOUGH`);
          break;
        default:
          global.nev(tResult);
      }
    } else {
      console.log("bummer, i cant deposit anything?");
    }
  }

  type WithCreepProposed = {
    proposedActionByName: ProposedActionByName;
  };
};
