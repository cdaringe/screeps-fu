import { sum } from "../utils.collection";

export type PlanRoleAction<RoleFields = {}> = {
  state: PlanState;
  creep: Creep;
} & RoleFields;

/**
 * @example planHarvest, planUpgrade, planBuild
 */
export type PlanRoleFn<Action = unknown> = (_: PlanRoleAction<{}>) => Action;

/**
 * @example planHarvestMove, planHarvestXfer, etc
 */
export type PlanRoleActionFn<Action /* eg CreepUpgradeAction */, RoleFields> = (
  _: PlanRoleAction<RoleFields>,
) => Action;

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
