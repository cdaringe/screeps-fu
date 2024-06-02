import {
  PlanRoleAction,
  PlanState,
  ProposedActionByRoleByName,
} from "../common";
import { planBuilder } from "./builder";
import { planHarvest } from "./harvester";
import { planUpgrade } from "./upgrader";

export const planActions = (state: PlanState): ProposedActionByRoleByName => {
  const creepsByRole = state.collections.creeps.byRole;
  const nextProposedByRole: ProposedActionByRoleByName = state.collections
    .proposedCreeps.byRole ?? {
    harvester: {},
    upgrader: {},
    builder: {},
  };

  const priortizedRolesDescending = Object.entries(
    state.targetState.roleAllocations,
  )
    .sort(([, aWeight], [, bWeight]) => bWeight - aWeight)
    .map(([role]) => role as CreepRole);

  for (const roleName of priortizedRolesDescending) {
    const creepsByName = creepsByRole[roleName];
    for (const name in creepsByName) {
      const creep = creepsByName[name]!;
      const proposedAction = nextProposedByRole[roleName][name];
      nextProposedByRole[roleName][creep.name] =
        proposedAction ??
        ((): CreepAction<any> => {
          const input: PlanRoleAction = { state, creep };
          switch (roleName) {
            case "harvester":
              return planHarvest(input);
            case "upgrader":
              return planUpgrade(input);
            case "builder":
              return planBuilder(input);
            default:
              global.fu.nev(roleName);
              throw new Error(`unknown role ${roleName}`);
          }
        })();
    }
  }

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

  return nextProposedByRole;
};

/**
 * @todo figure out if we need to iterate again
 */
export const isPlanSettled = (state: PlanState) => {
  let isSettled = true;

  if (state.iteration > 2) {
    return true;
  }
  const overallocatedCreeps = state.collections.creeps.all.filter(
    (creep) => creep.memory.plan?.isOverallocatedRole,
  );
  if (overallocatedCreeps.length > 0) {
    // @todo rebalance creeps
    console.log("@todo rebalcance creeps");

    // @todo
    isSettled = false;
  }

  const numCreeps = state.collections.creeps.all.length;
  for (const role in state.targetState.roleAllocations) {
    const roleAlloc = state.targetState.roleAllocations[role as CreepRole];
    const atLeast = Math.floor(roleAlloc * numCreeps);
    const currentNum = Object.keys(
      state.collections.proposedCreeps.byRole[role as CreepRole],
    ).length;
    if (currentNum < atLeast) {
      console.log(`rebalanced need to increase ${role}s`);
      isSettled = false;
    }
  }
  if (overallocatedCreeps.length > 0) {
    // @todo rebalance creeps
    console.log("@todo rebalcance creeps");

    // @todo
    isSettled = false;
  }
  return isSettled;
};
