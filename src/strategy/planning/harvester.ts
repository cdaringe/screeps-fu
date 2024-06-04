import { sourceHasEnergy } from "filters";
import { fustructure } from "fu-structure";
import { nearestPosition } from "sort";
import {
  PlanRoleActionFn,
  PlanRoleFn,
  defaultVisualizePathStyle,
} from "strategy/common";
import { randomElement } from "utils.collection";

type MoveDestination =
  | {
      kind: "targetStructure";
      value: AnyStructure;
    }
  | {
      kind: "source";
      value: Source;
    };

const actIdle = (creep: Creep): CreepActionTag =>
  fu.act(
    creep.say("⚠️ no sources available"),
    () => fu.set(creep.memory as HarvestorMemory, "state", "idle"),
    () => fu.set(creep.memory as HarvestorMemory, "state", "idle"),
  );

type HarvestPlanFields = {
  freeEnergyStorage: number;
  lastTargetStructure?: AnyStructure;
};

const idle: PlanRoleActionFn<HarvestorMemory, {}> = (opts) =>
  fu.actions.creep.retryOnceElse(
    opts.creep,
    () => {
      const total = opts.creep.store.getCapacity();
      const used = opts.creep.store.getUsedCapacity();
      const freeEnergyStorage = total - used;

      // case: filled up, move to to energy sink
      if (freeEnergyStorage === 0) {
        const sink = randomElement(opts.state.collections.sinks.unfilledEnergy);
        if (sink) {
          return fu.act(
            opts.creep.moveTo(sink, {
              visualizePathStyle: defaultVisualizePathStyle,
            }),
            () =>
              fu.set(opts.creep, "memory", {
                state: "moving",
                role: "harvester",
                targetId: sink.id,
              }),
            () => {
              opts.creep.say(`⚠️ no path to sink ${sink}`);
              return idle(opts);
            },
          );
        }
      }

      // case: can harvest
      const source = opts.creep.room
        .find(FIND_SOURCES, { filter: sourceHasEnergy })
        .sort(nearestPosition)[0];

      if (source) {
        return harvesting({
          ...opts,
          source,
        });
      }
      return idle(opts);
    },
    () =>
      fu.act(
        opts.creep.say("⚠️ nothing to harvest or collect"),
        () =>
          fu.set(opts.creep, "memory", { role: "harvester", state: "idle" }),
        (code) => void opts.creep.say(`⚠️ idle failed ${code}`),
      ),
  );

const harvesting: PlanRoleActionFn<HarvestorMemory, { source: Source }> = (
  opts,
) => {
  const source = sourceHasEnergy(opts.source) ? opts.source : undefined;

  if (!source) {
    return idle(opts);
  }
  return fu.act(
    opts.creep.harvest(source),
    () =>
      fu.set(opts.creep, "memory", {
        state: "harvesting",
        role: "harvester",
        targetId: source.id,
      }),
    (code) => {
      opts.creep.say(`⚠️ harvest ${source} failed ${code}`);
      return idle(opts);
    },
  );
};

const xfer: PlanRoleActionFn<
  HarvestorMemory,
  { targetStructure: AnyStructure }
> = (opts) => {
  const { creep, targetStructure } = opts;
  return targetStructure
    ? fu.act(
        creep.transfer(targetStructure, RESOURCE_ENERGY),
        () =>
          fu.set(creep, "memory", {
            state: "xfer",
            role: "harvester",
            targetId: targetStructure.id,
          }),
        (code) => {
          creep.say(`⚠️ transfer to ${targetStructure} failed ${code}`);
          return idle(opts);
        },
      )
    : idle(opts);
};

const moving: PlanRoleActionFn<
  HarvestorMemory,
  { destination: MoveDestination }
> = (opts) => {
  const {
    creep,
    destination: { kind, value },
  } = opts;
  return creep.pos.isNearTo(value)
    ? kind === "source"
      ? harvesting({ ...opts, source: value })
      : xfer({ ...opts, targetStructure: value })
    : fu.act(
        creep.moveTo(value, {
          visualizePathStyle: defaultVisualizePathStyle,
        }),
        () =>
          fu.set(creep, "memory", {
            state: "moving",
            role: "harvester",
            targetId: value.id,
          }),
        (code) => {
          creep.say(`⚠️ move to ${value.id} ${value.prototype} failed ${code}`);
          return idle(opts);
        },
      );
};

export const planActionByRole = {
  idle,
  harvesting,
  xfer,
  moving,
};

export const planHarvest: PlanRoleFn = ({ creep, state }) => {
  const mem = creep.memory as HarvestorMemory;
  /**
   * @warn is not really lastTargetStructure, but is "last target if valid"
   */
  const lastTargetStructure: AnyStructure | Source | undefined = mem.targetId
    ? Game.getObjectById(mem.targetId)
    : undefined;

  const opts = { creep: creep as any, state };

  switch (mem.state) {
    case "harvesting": {
      if (!lastTargetStructure) {
        return idle(opts);
      }
      return harvesting({ ...opts, source: lastTargetStructure as Source });
    }
    case "idle": {
      return idle(opts);
    }
    case "moving": {
      if (!lastTargetStructure) {
        return idle(opts);
      }
      return moving({
        ...opts,
        destination: fustructure.filters.isStructure(lastTargetStructure)
          ? {
              kind: "targetStructure",
              value: lastTargetStructure,
            }
          : {
              kind: "source",
              value: lastTargetStructure,
            },
      });
    }
    case "xfer": {
      if (!lastTargetStructure) {
        return idle(opts);
      }
      return xfer({
        ...opts,
        targetStructure: lastTargetStructure as AnyStructure,
      });
    }
    default:
      fu.nev(mem.state);
      throw new Error(`unknown state ${mem.state}`);
  }
};
