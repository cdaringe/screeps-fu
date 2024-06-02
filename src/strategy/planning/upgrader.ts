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

import { fustructure } from "fu-structure";
import {
  CreepUpgradeAction,
  PlanRoleActionFn,
  PlanRoleFn,
  defaultVisualizePathStyle,
} from "strategy/common";

type UpgradePlanFields = {
  last?:
    | {
        kind: "targetStructure";
        value: AnyStructure;
      }
    | {
        kind: "energySource";
        value: AnyStructure;
      };
};
type PlanUpgradeActionFn = PlanRoleActionFn<
  CreepUpgradeAction,
  UpgradePlanFields
>;

export const planActionByRole: Record<
  UpgraderMemory["state"],
  PlanUpgradeActionFn
> = {
  idle: (opts) => {
    if (opts.creep.store.energy > 0) {
      return planActionByRole.upgrading(opts);
    }
    if (opts.creep.store.getFreeCapacity() > 0) {
      return planActionByRole.collecting_by_container(opts);
    }
    return {
      state: "idle",
      method: ["say", ["⚠️ nothing to upgrade or collect"]],
    };
  },
  upgrading: (opts) => {
    const {
      last: { value, kind } = {},
    } = opts;
    if (kind === "energySource") {
      return planActionByRole.collecting_by_container(opts);
    }
    if (kind === "targetStructure") {
      return {
        state: "upgrading",
        method: ["upgradeController", [value as StructureController]],
      };
    }
    return planActionByRole.idle(opts);
  },
  collecting_by_container: (opts) =>
    opts?.last?.kind === "energySource"
      ? {
          state: "collecting_by_container",
          method: ["transfer", [opts.last?.value, RESOURCE_ENERGY]],
        }
      : planActionByRole.upgrading(opts),
  moving: (opts) =>
    opts.last?.value
      ? opts.creep.pos.isNearTo(opts.last.value)
        ? opts.last.kind === "energySource"
          ? planActionByRole.collecting_by_container(opts)
          : planActionByRole.upgrading(opts)
        : {
            state: "moving",
            method: [
              "moveTo",
              [
                opts.last.value,
                { visualizePathStyle: defaultVisualizePathStyle },
              ],
            ],
          }
      : {
          state: "moving",
          method: [
            "moveTo",
            [
              opts.creep.room.controller!,
              { visualizePathStyle: defaultVisualizePathStyle },
            ],
          ],
        },
};

export const planUpgrade: PlanRoleFn<CreepUpgradeAction> = ({
  creep,
  state,
}) => {
  const mem = creep.memory.current as UpgraderMemory;

  const lastTargetStructure: AnyStructure | undefined =
    mem.last?.kind === "targetStructure"
      ? fustructure.getById(mem.last.id)
      : undefined;

  const lastEnergySource: AnyStructure | undefined =
    !lastTargetStructure && mem.last?.id === "energySource"
      ? fustructure.getById(mem.last.id)
      : undefined;

  return planActionByRole[mem.state]({
    creep,
    state,
    last: lastTargetStructure
      ? {
          kind: "targetStructure",
          value: lastTargetStructure,
        }
      : lastEnergySource
        ? {
            kind: "energySource",
            value: lastEnergySource,
          }
        : undefined,
  });
};
