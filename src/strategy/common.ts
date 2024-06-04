import { sum } from "../utils.collection";

export type PlanRoleAction<RoleMemoryType, RoleFields = {}> = {
  creep: Omit<Creep, "memory"> & { memory: RoleMemoryType };
  state: PlanState;
} & RoleFields;

/**
 * @example planHarvest, planUpgrade, planBuild
 */
export type PlanRoleFn = (_: PlanRoleAction<{}>) => CreepActionTag | undefined;

/**
 * @example planHarvestMove, planHarvestXfer, etc
 */
export type PlanRoleActionFn<RoleMemoryType, RoleFields> = (
  _: PlanRoleAction<RoleMemoryType, RoleFields>,
) => CreepActionTag | undefined;

export type CreepHarvestAction = CreepAction<HarvestorMemory["state"]>;
export type CreepUpgradeAction = CreepAction<UpgraderMemory["state"]>;
export type CreepBuildAction = CreepAction<BuilderMemory["state"]>;

export type ProposedActionByName = Dictionary<CreepAction<any>>;
export type ProposedActionByRoleByName = Record<
  CreepRole,
  ProposedActionByName
>;

export type PlanState = {
  collections: {
    creeps: {
      byRole: CreepsByRole;
      all: Creep[];
    };
    proposedCreeps: {
      byRole: ProposedActionByRoleByName;
    };
    sinks: {
      unfilledEnergy: Structure[];
    };
  };
  targetState: {
    roleAllocations: Record<CreepRole, number>;
  };
  iteration: number;
};

export type WithCreepProposed = {
  proposedActionByName: ProposedActionByName;
};

export const BODY_PARTS_LAME_WORKER: BodyPartConstant[] = [MOVE, CARRY, WORK];

export const getBodyPartCost = (parts: BodyPartConstant[]) =>
  sum(parts.map((part) => BODYPART_COST[part]));

export const COST_LAME_WORKER = getBodyPartCost(BODY_PARTS_LAME_WORKER);

export const defaultVisualizePathStyle = { stroke: "#ffffff" };
