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
type PlanUpgradeActionFn = PlanRoleActionFn<UpgraderMemory, UpgradePlanFields>;

export const planActionByRole: Record<
  UpgraderMemory["state"],
  PlanUpgradeActionFn
> = {
  idle: (opts) => {
    const { creep } = opts;
    if (creep.store.energy > 0) {
      return planActionByRole.upgrading(opts);
    }
    if (creep.store.getFreeCapacity() > 0) {
      return planActionByRole.collecting_by_container(opts);
    }
    return fu.act(
      creep.say("⚠️ nothing to upgrade or collect"),
      () => fu.set(creep, "memory", { state: "idle", role: "upgrader" }),
      (_code) => fu.set(creep, "memory", { state: "idle", role: "upgrader" }),
    );
  },
  upgrading: (opts) => {
    const {
      creep,
      last: { value, kind } = {},
    } = opts;
    if (kind === "energySource") {
      return planActionByRole.collecting_by_container(opts);
    }
    if (kind === "targetStructure") {
      return fu.act(
        creep.upgradeController(value as StructureController),
        () => fu.set(creep.memory, "state", "upgrading"),
        (code) => {
          creep.say(`⚠️ upgrade failed ${code}`);
          return planActionByRole.idle(opts);
        },
      );
    }
    return planActionByRole.idle(opts);
  },
  collecting_by_container: (opts) => {
    const {
      creep,
      last: { value, kind } = {},
    } = opts;
    return value && kind === "energySource"
      ? fu.act(
          creep.withdraw(value, RESOURCE_ENERGY),
          () => fu.set(creep.memory, "state", "collecting_by_container"),
          (_code) => planActionByRole.idle(opts),
        )
      : planActionByRole.upgrading(opts);
  },
  moving: (opts) => {
    const {
      creep,
      last: { value, kind } = {},
    } = opts;
    return value
      ? creep.pos.isNearTo(value)
        ? kind === "energySource"
          ? planActionByRole.collecting_by_container(opts)
          : planActionByRole.upgrading(opts)
        : fu.act(
            creep.moveTo(value, {
              visualizePathStyle: defaultVisualizePathStyle,
            }),
            () => undefined,
            (code) => {
              creep.say(`⚠️ move failed ${code}`);
              return planActionByRole.idle(opts);
            },
          )
      : fu.act(
          creep.moveTo(creep.room.controller!),
          () => undefined,
          (code) => {
            creep.say(`⚠️ move failed ${code}`);
            return planActionByRole.idle(opts);
          },
        );
  },
};

export const planUpgrade: PlanRoleFn = ({ creep, state }) => {
  const mem = creep.memory as UpgraderMemory;

  const lastTargetStructure: AnyStructure | undefined =
    mem.last?.kind === "targetStructure"
      ? fustructure.getById(mem.last.id)
      : undefined;

  const lastEnergySource: AnyStructure | undefined =
    !lastTargetStructure && mem.last?.id === "energySource"
      ? fustructure.getById(mem.last.id)
      : undefined;

  return planActionByRole[mem.state]({
    creep: creep as any,
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
