import { find } from "lodash";
import { partitionByRatio } from "utils/collection";

const getNextWorker = (spawn: StructureSpawn, room: Room) => {
  // @todo insert something interesting here, like... needed energy vs current energy rate ... vs needed defense level
  const roomCreepsByType = global.creepsByType(room.find(FIND_MY_CREEPS));
  // @todo this should be _assigned_ to this room, not actually PRESENT in this room
  const workers = roomCreepsByType.get("work") || [];
  // @todo strategy should compute or specify workers
  const minWorkers = 4;
  // @todo filter by spawns of this tyyype
  const activeSpawns = room.find(FIND_STRUCTURES).filter( s => s.structureType === STRUCTURE_SPAWN && s.spawning);
  let numWorkersToBuild = minWorkers - activeSpawns.length - workers.length;
  console.log(JSON.stringify({ workers: workers.length, minWorkers, numWorkersToBuild }));
  if (numWorkersToBuild <= 0 || spawn.spawning) {
    //
  } else {
    const spawnR = spawn.spawnCreep(["move", "work", "carry"], `w_${global.getNextWorkerId()}`);
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

const assignRoomWorkerTasks = (room: Room) => {
  // @todo insert something interesting here, like... needed energy vs current energy rate ... vs needed defense level
  const roomCreepsByType = global.creepsByType(room.find(FIND_MY_CREEPS, { filter: c => !c.spawning }));
  // @todo this should be _assigned_ to this room, not actually PRESENT in this room
  const workers = roomCreepsByType.get("work") || [];
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
  function findSink (sinks: Structure[], startingI: number) {
      let i = startingI;
      let rem = sinks.length;
      while (rem > 0) {
          const sink = sinks[i % sinks.length]
          if (sink) return sink
          ++i
          --rem
      }
      return null
  }

  workersByType.upgrade.forEach((c, ci) => {
    const [rlc] =  room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTROLLER})
    const controller = c.room.controller;
    if (rlc && controller) {
	    if(c.store[RESOURCE_ENERGY] == 0) {
        const [source0] = c.room.find(FIND_SOURCES);
        if (!source0) throw new Error(`mising source`)
        if(c.harvest(source0) == ERR_NOT_IN_RANGE) {
            c.moveTo(source0);
        }
      } else {
          if(c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
              c.moveTo(controller);
          }
      }
    } else {
      console.log(`${c.name} no (rlc, controller) (${rlc}, ${controller})`)
    }
  })

  workersByType.harvest.forEach((c, ci) => {
    const total = c.store.getCapacity();
    const used = c.store.getUsedCapacity()
    const free = total - used
    c.say(`(${used}/${total})`)
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
                console.log("snap, i cannot do this job ERR_NO_BODYPART")
                break
            case ERR_TIRED:
                console.warn("dang, im tired bro")
                break;
            case ERR_NOT_FOUND:
              console.warn("source not found");
              break;
            case ERR_NOT_ENOUGH_RESOURCES:
                console.log(`not enough resources`)
              // @todo try next resource until all exhausted, otherwise... turn into something else
              break;
            default:
              global.nev(harvestR);
          }
        }
        assignSource(source)
      } else {
        console.log(`${c.id}, no sources`)
      }
    } else {
        const sink = findSink(sinks, ci % sinks.length)
        if (sink) {
            const tResult = c.transfer(sink, RESOURCE_ENERGY)
            switch (tResult) {
                case OK:
                  break;
                case ERR_NOT_OWNER:
                  console.warn("not owner :(")
                  c.suicide()
                  break;
                case ERR_NO_PATH:
                  console.warn("no path to structure")
                  break;
                case ERR_BUSY:
                  console.warn("busy")
                  break;
                case ERR_NAME_EXISTS:
                  console.log(`${c.id} ERR_NAME_EXISTS`)
                  break;
                case ERR_NOT_FOUND:
                  console.log(`${c.id} ERR_NOT_FOUND`)
                  break;
                case ERR_NOT_ENOUGH_RESOURCES:
                  console.log(`${c.id} ERR_NOT_ENOUGH_RESOURCES`)
                  break;
                case ERR_NOT_ENOUGH_ENERGY:
                  console.log(`${c.id} ERR_NOT_ENOUGH_ENERGY`)
                  break;
                case ERR_INVALID_TARGET:
                  console.log(`${c.id} ERR_INVALID_TARGET`)
                  break;
                case ERR_FULL:
                  console.log(`${c.name} ERR_FULL`)
                  break;
                case ERR_NOT_IN_RANGE:
                  c.moveTo(sink.pos)
                  break;
                case ERR_INVALID_ARGS:
                  throw new Error("ERR_INVALID_ARGS")
                  break;
                case ERR_TIRED:
                  console.log(`${c.id} ERR_TIRED`)
                  break;
                case ERR_NO_BODYPART:
                  throw new Error(`${c.id} ERR_NO_BODYPART`)
                  break;
                case ERR_NOT_ENOUGH_EXTENSIONS:
                  throw new Error(`${c.id} ERR_NOT_ENOUGH_EXTENSIONS`)
                case ERR_RCL_NOT_ENOUGH:
                  console.log(`${c.id} ERR_RCL_NOT_ENOUGH`)
                  break;
                case ERR_GCL_NOT_ENOUGH:
                  console.log(`${c.id} ERR_GCL_NOT_ENOUGH`)
                  break;
                default:
                    global.nev(tResult)
            }
        } else {
            console.warn("bummer, i cant deposit anything?")
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

export const run = () => {
  for (const [_roomName, room] of Object.entries(Game.rooms)) {
    const [spawn] = room.find(FIND_MY_SPAWNS);
    if (spawn) getNextWorker(spawn, room);
    assignRoomWorkerTasks(room);
  }
};
