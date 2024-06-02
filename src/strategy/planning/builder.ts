import { fusite } from "fu-site";
import { fustructure } from "fu-structure";
import {
  CreepBuildAction,
  PlanRoleActionFn,
  PlanRoleFn,
  defaultVisualizePathStyle,
} from "strategy/common";

type BuilderPlanFields = {
  last?:
    | {
        kind: "targetStructure";
        value: ConstructionSite;
      }
    | {
        kind: "energySource";
        value: AnyStructure;
      };
};

type PlanBuilderActionFn = PlanRoleActionFn<
  CreepBuildAction,
  BuilderPlanFields
>;

export const planActionByRole: Record<
  BuilderMemory["state"],
  PlanBuilderActionFn
> = {
  idle: (opts) => {
    /**
     * @todo what does building cost? energy or prob other resources?
     */
    if (opts.creep.store.energy > 0) {
      return planActionByRole.building(opts);
    }
    if (opts.creep.store.getFreeCapacity() > 0) {
      return planActionByRole.collecting_by_container(opts);
    }
    return {
      state: "idle",
      method: ["say", ["⚠️ nothing to build or collect"]],
    };
  },
  building: (opts) => {
    const {
      last: { value, kind } = {},
    } = opts;
    if (kind === "energySource") {
      return planActionByRole.collecting_by_container(opts);
    }
    if (kind === "targetStructure" && value) {
      return {
        state: "building",
        method: ["build", [value]],
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
      : planActionByRole.building(opts),
  moving: (opts) =>
    opts.last?.value
      ? opts.creep.pos.isNearTo(opts.last.value)
        ? opts.last.kind === "energySource"
          ? planActionByRole.collecting_by_container(opts)
          : planActionByRole.building(opts)
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

export const planBuilder: PlanRoleFn<CreepBuildAction> = ({ creep, state }) => {
  const mem = creep.memory.current as BuilderMemory;

  const lastTargetConstructionSite: ConstructionSite | undefined =
    mem.last?.kind === "targetStructure"
      ? fusite.getById(mem.last.id)
      : undefined;

  const lastEnergySource: AnyStructure | undefined =
    !lastTargetConstructionSite && mem.last?.id === "energySource"
      ? fustructure.getById(mem.last.id)
      : undefined;

  return planActionByRole[mem.state]({
    creep,
    state,
    last: lastTargetConstructionSite
      ? {
          kind: "targetStructure",
          value: lastTargetConstructionSite,
        }
      : lastEnergySource
        ? {
            kind: "energySource",
            value: lastEnergySource,
          }
        : undefined,
  });
};
