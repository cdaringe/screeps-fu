import { fusite } from "fu-site";
import { fustructure } from "fu-structure";
import {
  PlanRoleActionFn,
  PlanRoleFn,
  defaultVisualizePathStyle,
} from "strategy/common";

type MoveDestination =
  | {
      kind: "targetStructure";
      value: ConstructionSite;
    }
  | {
      kind: "energySource";
      value: AnyStructure;
    };

const idle: PlanRoleActionFn<BuilderMemory, {}> = (opts) =>
  fu.actions.creep.retryOnceElse(
    opts.creep,
    () => {
      // case: try building
      if (opts.creep.store.energy > 0) {
        const [site] = opts.creep.room.find(FIND_CONSTRUCTION_SITES);
        if (site) {
          return planActionByRole.building({ ...opts, targetStructure: site });
        }
      }
      // case: try collecting
      if (opts.creep.store.getFreeCapacity() > 0) {
        const container = opts.creep.room.find(FIND_STRUCTURES, {
          filter: (structure) =>
            structure.structureType === STRUCTURE_CONTAINER &&
            structure.store.energy > 0,
        })[0];
        if (container) {
          return collectFromContainer({ ...opts, energySource: container });
        }
      }
      return idle(opts);
    },
    () =>
      fu.act(
        opts.creep.say("⚠️ nothing to build or collect"),
        () => fu.set(opts.creep, "memory", { role: "builder", state: "idle" }),
        (code) => void opts.creep.say(`⚠️ idle failed ${code}`),
      ),
  );

const collectFromContainer: PlanRoleActionFn<
  BuilderMemory,
  { energySource: AnyStructure }
> = (opts) => {
  return fu.act(
    opts.creep.withdraw(opts.energySource, RESOURCE_ENERGY),
    () => {
      opts.creep.memory = {
        role: "builder",
        state: "collecting_by_container",
        last: { kind: "energySource", id: opts.energySource.id },
      };
    },
    (code) => {
      opts.creep.say(`⚠️ collect failed ${code}`);
      return idle(opts);
    },
  );
};

const building: PlanRoleActionFn<
  BuilderMemory,
  { targetStructure: ConstructionSite }
> = (opts) => {
  return fu.act(
    opts.creep.build(opts.targetStructure),
    () => {
      opts.creep.memory = {
        role: "builder",
        state: "building",
        last: { kind: "targetStructure", id: opts.targetStructure.id },
      };
    },
    (code) => {
      opts.creep.say(`⚠️ build failed ${code}`);
      return idle(opts);
    },
  );
};

const moving: PlanRoleActionFn<
  BuilderMemory,
  { destination: MoveDestination }
> = (opts) =>
  opts.creep.pos.isNearTo(opts.destination.value)
    ? opts.destination.kind === "energySource"
      ? collectFromContainer({ ...opts, energySource: opts.destination.value })
      : building({
          ...opts,
          targetStructure: opts.destination.value,
        })
    : fu.act(
        opts.creep.moveTo(opts.destination.value, {
          visualizePathStyle: defaultVisualizePathStyle,
        }),
        () =>
          fu.set(opts.creep, "memory", {
            role: "builder",
            state: "moving",
            last: {
              kind: opts.destination.kind,
              id: opts.destination.value.id,
            },
          }),
        (code) => {
          opts.creep.say(`⚠️ move failed ${code}`);
          return idle(opts);
        },
      );

export const planActionByRole = {
  idle,
  building,
  collecting_by_container: collectFromContainer,
  moving,
};

export const planBuilder: PlanRoleFn = ({ creep, state }) => {
  const mem = creep.memory as BuilderMemory;

  const lastTargetConstructionSite: ConstructionSite | undefined =
    mem.last?.kind === "targetStructure"
      ? fusite.getById(mem.last.id)
      : undefined;

  const lastEnergySource: AnyStructure | undefined =
    !lastTargetConstructionSite && mem.last?.id === "energySource"
      ? fustructure.getById(mem.last.id)
      : undefined;

  const opts = { creep: creep as any, state };

  switch (mem.state) {
    case "building": {
      if (lastTargetConstructionSite) {
        return planActionByRole.building({
          ...opts,
          targetStructure: lastTargetConstructionSite,
        });
      }
      return idle(opts);
    }
    case "collecting_by_container": {
      if (lastEnergySource) {
        return collectFromContainer({
          ...opts,
          energySource: lastEnergySource,
        });
      }
      return idle(opts);
    }
    case "moving": {
      const destination: MoveDestination | undefined =
        lastTargetConstructionSite
          ? { kind: "targetStructure", value: lastTargetConstructionSite }
          : lastEnergySource
            ? { kind: "energySource", value: lastEnergySource }
            : undefined;
      if (destination) {
        return moving({
          ...opts,
          destination,
        });
      }
      return idle(opts);
    }
    case "idle":
      return idle(opts);
    default:
      global.fu.nev(mem.state);
      throw new Error(`unknown state ${mem.state}`);
  }
};
