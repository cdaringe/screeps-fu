import { combineLatest, Observable } from "rxjs";
import { partitionByRatio } from "utils/collection";
import { difference } from "set-fns";
import * as ostate from "../../observable-state/mod";
import * as plan from "../../plan/mod";
import { PlanMap } from "plan/plan-map";

declare global {
  namespace NodeJS {
    interface Global {
      state$: {
        lastCreeps$: Observable<ostate.CreepEvent[]>;
        lastCreep$ByName: Dictionary<ostate.OCreep>;
      };
    }
  }
}

const ENERGY_AVAILABILITY_SCALAR = 3;
const MAX_ROOM_WORKERS = 50;

const workerTraitsCurve = _.times(6).map((_, i) => Math.min(30, Math.max(2, Math.pow(2, i) + 2)));

const getHarvesterParts = (numParts: number): BodyPartConstant[] => {
  if (numParts < 3) throw new Error(`must have >= 3 parts`);
  const movePer = Math.max(1 / 30, (18 - numParts) / 30);
  const workCarryPer = (1 - movePer) / 2;
  return (
    [
      { per: workCarryPer, part: CARRY },
      { per: workCarryPer, part: WORK },
      { per: movePer, part: MOVE }
    ]
      /**
       * order ascending to ensure small ratios get at least one
       */
      .sort((a, b) => (a.per > b.per ? 1 : -1))
      .reduce<{ parts: BodyPartConstant[]; remPercent: number }>(
        (acc, it) => {
          const { parts: accParts, remPercent } = acc;
          const { per, part } = it;
          const actualPer = per < remPercent ? per : remPercent;
          const nParts = Math.min(1, Math.floor(actualPer * numParts));
          const itParts = _.times(nParts).map(_ => part);
          return {
            parts: [...accParts, ...itParts],
            remPercent: remPercent - nParts / numParts
          };
        },
        { parts: [], remPercent: 1 }
      ).parts
  );
};

const planNextHarvesters = (mySpawns: StructureSpawn[], room: Room) => {
  const mySpawnable = mySpawns.filter(s => !s.isActive() && s.store[RESOURCE_ENERGY] > 0);
  const spawn = mySpawnable[0];
  if (!spawn) {
    return console.warn(`no spawn available`);
  }
  const availableEnergy = room.unharvestedEnergy();
  if (availableEnergy <= 0) {
    return console.warn(`out of energy`);
  }
  const creepsByType = global.creepsByType(room.find(FIND_MY_CREEPS));
  const workers = (creepsByType.get("work") || []).sort((a, b) => (a.body.length > b.body.length ? 1 : -1));
  // @todo insert something interesting here, like... needed energy vs current energy rate ... vs needed defense level
  // @todo this should be _assigned_ to this room, not actually PRESENT in this room
  // @todo strategy should compute or specify workers
  // 100 energy * 0.5 energy/tick * 3 scalar = 150
  const targetNumWorkers = Math.min(
    mySpawnable.length,
    MAX_ROOM_WORKERS,
    Math.max(1, Math.floor((availableEnergy / 1_000) * room.getRecentEnergyRate() * ENERGY_AVAILABILITY_SCALAR))
  );
  let numWorkersToBuild = targetNumWorkers - mySpawnable.length - workers.length;
  if (numWorkersToBuild <= 0) {
    console.log(
      JSON.stringify({ workers: workers.length, mySpawnable: mySpawnable.length, targetNumWorkers, numWorkersToBuild })
    );
  } else {
    _.times(numWorkersToBuild)
      .reduce((workersParts, _) => {
        const workerPartCounts = workers.map(w => w.body.length).concat(workersParts.map(wp => wp.length));
        const numParts = [...difference(workerPartCounts, workerTraitsCurve)][0] || MAX_CREEP_SIZE;
        const parts = getHarvesterParts(numParts);
        return [...workersParts, parts];
      }, [] as BodyPartConstant[][])
      .forEach(parts => room.plan.add(spawn.id, spawn, "structure_spawn", { kind: "spawn", data: { parts } }));
  }
};

const planCurrentWorkerTasks = (room: Room) => {
  // @todo insert something interesting here, like... needed energy vs current energy rate ... vs needed defense level
  const creepsByType = global.creepsByType(room.find(FIND_MY_CREEPS, { filter: c => !c.spawning }));
  // @todo this should be _assigned_ to this room, not actually PRESENT in this room
  const workers = creepsByType.get("work") || [];
  const orderedActivityRatios = {
    harvest: 0.5,
    upgrade: 0.25,
    build: 0.25
  };
  const workersByType = partitionByRatio(orderedActivityRatios, workers);
  const sinks = room.find(FIND_STRUCTURES, {
    // @todo  what structures can take energy?
    filter: s => s.isActive() && s.structureType === STRUCTURE_SPAWN
  });
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

  workersByType.upgrade.forEach((c, ci) => {
    const [rlc] = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTROLLER });
    const controller = c.room.controller;
    if (rlc && controller) {
      if (c.store[RESOURCE_ENERGY] == 0) {
        const [source0] = c.room.find(FIND_SOURCES);
        if (!source0) throw new Error(`mising source`);
        if (c.harvest(source0) == ERR_NOT_IN_RANGE) {
          c.moveTo(source0);
        }
      } else {
        if (c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
          c.moveTo(controller);
        }
      }
    } else {
      console.log(`${c.name} no (rlc, controller) (${rlc}, ${controller})`);
    }
  });

  workersByType.harvest.forEach((c, ci) => {
    const total = c.store.getCapacity();
    const used = c.store.getUsedCapacity();
    const free = total - used;
    c.say(`(${used}/${total})`);
    if (free > 0) {
      const sources = room.find(FIND_SOURCES);
      const source = sources[ci % sources.length];
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
              console.warn("busy");
              break;
            case ERR_NOT_IN_RANGE:
              c.moveTo(source.pos);
              break;
            case ERR_NO_BODYPART:
              c.suicide();
              console.log("snap, i cannot do this job ERR_NO_BODYPART");
              break;
            case ERR_TIRED:
              console.warn("dang, im tired bro");
              break;
            case ERR_NOT_FOUND:
              console.warn("source not found");
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
            console.warn("not owner :(");
            c.suicide();
            break;
          case ERR_NO_PATH:
            console.warn("no path to structure");
            break;
          case ERR_BUSY:
            console.warn("busy");
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
        console.warn("bummer, i cant deposit anything?");
      }
    }
  });
  workersByType.build.forEach((c, ci) => {
    c.memory.role = "build";
    const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    // @todo refil resources
    const site = sites[ci % sites.length];
    if (site) {
      const buildR = c.build(site);
      switch (buildR) {
        case OK:
          return;
        case ERR_NOT_OWNER:
          throw new Error("not owner");
        case ERR_BUSY:
          break;
        case ERR_NOT_ENOUGH_RESOURCES:
          console.warn(`${c.id} not enough resources to build`);
        case ERR_INVALID_TARGET:
          console.warn(`tried to build invalid`);
          break;
        case ERR_NOT_IN_RANGE:
          c.moveTo(site.pos);
          break;
        case ERR_NO_BODYPART:
          c.suicide();
          break;
        case ERR_RCL_NOT_ENOUGH:
          console.warn("RCL not enough");
      }
    }
  });
};

export const onSetup = () => {
  global.state$ = {
    get lastCreeps$() {
      const creeps = Object.values(global.state$.lastCreep$ByName).map(v => v.observable);
      return combineLatest(creeps);
    },
    lastCreep$ByName: {}
  };
};

export const onSetupCreep = (creep: Creep) => {
  const cbn = global.state$.lastCreep$ByName;
  cbn[creep.name] = ostate.creep(creep.name, creep);
};

const resolvePlan = (room: Room) => {
  // @todo naive plan implemented
  room.plan.forEach((entityPlan, gameObjectId) => {
    const { kind, entity, data } = entityPlan;
    switch (kind) {
      case "creep": {
        return plan.creep.process(entity, data);
      }
      case "structure_spawn": {
        return plan.structureSpawn.process(entity, data);
      }
      default:
        return global.nev(kind, `unhandled plan kind: ${kind}`);
    }
  });
};

export const runRoom = ({ room, name }: { room: Room; name: string }) => {
  // initialize room data
  room.updateEnergyRateHistory();

  // plan
  const mySpawns = room.find(FIND_MY_SPAWNS);
  if (mySpawns.length) {
    planNextHarvesters(mySpawns, room);
  }
  planCurrentWorkerTasks(room);

  // resolve
  resolvePlan(room);
};

export const run = () => {
  for (const [name, room] of Object.entries(Game.rooms)) {
    room.plan = new PlanMap();
    runRoom({ name, room });
  }
};
