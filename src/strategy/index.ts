/**
 * Here's how this strategy works:
 *
 * what-needs-to-be-done
 * |> who's around (good and bad)
 * |> what's everyone doing
 * |> what's the state of things of the room
 * |> plan (given what i'm doing and what's around, what shoud i do next)
 * |> execute (given the plan, attempt to do work)
 * |> correct (plan & execute for flawed individuals)
 * |> fin.
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
import { partitionByRatio, sum } from "../utils.collection";
import { nearestPosition } from "sort";
import {
  BODY_PARTS_LAME_WORKER,
  COST_LAME_WORKER,
  PlanRoleAction,
  PlanRoleActionFn,
  PlanState,
  ProposedActionByName,
  ProposedActionByRoleByName,
  defaultVisualizePathStyle,
  getBodyPartCost,
} from "strategy/common";
import { getMostNeededRole, getPercentCreepsByRole } from "strategy/balancing";
import { isPlanSettled, planActions } from "./planning/plan";
import { fustructure } from "fu-structure";

/**
 * Entrypoint for strategy
 */
export const run = () => {
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName]!;
    plan(room);
  }
};

const maybeSpawnNextWorkers = ({
  room,
  state,
}: { room: Room; state: PlanState }): PlanState => {
  if (room.energyAvailable < COST_LAME_WORKER) {
    return state;
  }
  const spawn = room.find(FIND_MY_SPAWNS, { filter: (s) => !s.spawning })[0];
  if (!spawn) {
    return state;
  }
  const percentCreepsByRole = getPercentCreepsByRole(state.collections.creeps);
  const mostNeededRole = getMostNeededRole({
    needed: state.targetState.roleAllocations,
    actual: percentCreepsByRole,
  });
  const parts: BodyPartConstant[] = getMaxBeefedUpPartsWeCanAfford(
    BODY_PARTS_LAME_WORKER,
    room.energyAvailable / 2,
  );

  const spawnR = spawn.spawnCreep(parts, `w_${global.fu.getNextWorkerId()}`, {
    memory: { current: { role: mostNeededRole as "harvester", state: "idle" } },
  });
  switch (spawnR) {
    case OK:
      console.log(`${spawn.name} OK`);
      break;
    default:
      console.log(`${spawn.name} ${spawnR}`);
      break;
  }
  return maybeSpawnNextWorkers({
    room,
    state: getState({
      room,
      /**
       * intentionally re-create state, as we've updated the base room conditions
       */
      prevState: undefined,
    }),
  });
};

const getState = ({
  room,
  prevState,
}: { room: Room; prevState?: PlanState }): PlanState => {
  const allCreeps =
    prevState?.collections.creeps.all ??
    room.find(FIND_MY_CREEPS).map((creep) => {
      // create fresh plan, that serializes to nothing, optimizing our mem usage
      creep.memory.plan = { ["toJSON" as any]: global.fu.noop };
      return creep;
    });
  const state: PlanState = prevState ?? {
    collections: {
      creeps: {
        byRole: global.fu.creepsByRole(allCreeps),
        all: allCreeps,
      },
      proposedCreeps: {
        byRole: {
          harvester: {},
          builder: {},
          upgrader: {},
        },
      },
      sinks: {
        unfilledEnergy: room.find(FIND_STRUCTURES, {
          filter: fustructure.filters.structureWithUnfilledEnergy,
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
  return state;
};

const plan = (room: Room, prevState?: PlanState): PlanState => {
  let state = getState({ room, prevState });
  state = maybeSpawnNextWorkers({ room, state });

  do {
    state.collections.proposedCreeps.byRole = planActions(state);
    ++state.iteration;
  } while (!isPlanSettled(state));

  return state;
};

const getMaxBeefedUpPartsWeCanAfford = (
  baseParts: BodyPartConstant[],
  energyMax: number,
): BodyPartConstant[] => {
  let acceptableParts = baseParts;
  let candidateParts = baseParts;
  while (getBodyPartCost(candidateParts) < energyMax) {
    acceptableParts = candidateParts;
    if (acceptableParts.length >= 50) {
      return acceptableParts;
    }
    candidateParts = global.fu.bodyPartDouble(candidateParts);
  }
  return acceptableParts;
};



//   const sink = randomElement(state.collections.sinks.unfilledEnergy);
//   if (!sink) {
//     return IDLE_RESPONSE;
//   }
//   return {
//     harvestState: "xfer",
//     method: ["transfer", [sink, RESOURCE_ENERGY]],
//   };
// };


