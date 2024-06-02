import { sourceHasEnergy } from "filters";
import { fustructure } from "fu-structure";
import { nearestPosition } from "sort";
import {
  CreepHarvestAction,
  PlanRoleActionFn,
  PlanRoleFn,
  defaultVisualizePathStyle,
} from "strategy/common";
import { randomElement } from "utils.collection";

const IDLE_RESPONSE: CreepHarvestAction = {
  state: "idle",
  method: ["say", ["⚠️ no sources available"]],
};

type HarvestPlanFields = {
  freeEnergyStorage: number;
  lastTargetStructure?: AnyStructure;
};
type PlanHarvestActionFn = PlanRoleActionFn<
  CreepHarvestAction,
  HarvestPlanFields
>;

export const planActionByRole: Record<
  HarvestorMemory["state"],
  PlanHarvestActionFn
> = {
  idle: (opts) => planActionByRole.harvesting(opts),
  harvesting: ({ creep, state, lastTargetStructure, freeEnergyStorage }) => {
    // case: filled up, move to to energy sink
    if (freeEnergyStorage === 0) {
      const sink = randomElement(state.collections.sinks.unfilledEnergy);
      if (!sink) {
        return IDLE_RESPONSE;
      }
      return {
        state: "moving",
        method: [
          "moveTo",
          [sink, { visualizePathStyle: defaultVisualizePathStyle }],
        ],
      };
    }
    const source =
      lastTargetStructure &&
      lastTargetStructure instanceof Source &&
      sourceHasEnergy(lastTargetStructure)
        ? lastTargetStructure
        : creep.room
            .find(FIND_SOURCES, { filter: sourceHasEnergy })
            .sort(nearestPosition)[0];

    if (!source) {
      return IDLE_RESPONSE;
    }
    return { state: "harvesting", method: ["harvest", [source]] };
  },
  xfer: (opts) =>
    opts.lastTargetStructure
      ? {
          state: "xfer",
          method: ["transfer", [opts.lastTargetStructure, RESOURCE_ENERGY]],
        }
      : planActionByRole.harvesting(opts),
  moving: (opts) =>
    opts.lastTargetStructure
      ? {
          state: "moving",
          method: [
            "moveTo",
            [
              opts.lastTargetStructure,
              { visualizePathStyle: defaultVisualizePathStyle },
            ],
          ],
        }
      : planActionByRole.harvesting(opts),
};

export const planHarvest: PlanRoleFn<CreepHarvestAction> = ({
  creep,
  state,
}) => {
  const total = creep.store.getCapacity();
  const used = creep.store.getUsedCapacity();
  const freeEnergyStorage = total - used;
  if ((Game.time + (creep.ticksToLive ?? 0)) % 10) {
    creep.say(`(${used}/${total})`);
  }
  const mem = creep.memory.current as HarvestorMemory;
  /**
   * @warn is not really lastTargetStructure, but is "last target if valid"
   */
  const lastTargetStructure: AnyStructure | undefined = mem.targetId
    ? (() => {
        const maybeValidStructure = Game.getObjectById(mem.targetId);
        return fustructure.filters.isStructure(maybeValidStructure)
          ? maybeValidStructure
          : undefined;
      })()
    : undefined;
  return planActionByRole[mem.state]({
    creep,
    state,
    freeEnergyStorage,
    lastTargetStructure,
  });
};
