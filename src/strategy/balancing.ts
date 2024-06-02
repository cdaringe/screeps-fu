import { PlanState } from "strategy/common";

type StatByRole = Record<CreepRole, number>;
type StatByRoleFn = (
  creepsState: PlanState["collections"]["creeps"],
) => StatByRole;

export const countCreepsByRole: StatByRoleFn = (creepsState) => {
  const stat = {} as StatByRole;
  for (const roleName in creepsState.byRole) {
    stat[roleName as CreepRole] = Object.keys(
      creepsState.byRole[roleName as CreepRole] ?? {},
    ).length;
  }
  return stat;
};

export const getPercentCreepsByRole: StatByRoleFn = (creepsState) => {
  const stat = {} as StatByRole;
  const len = creepsState.all.length;
  for (const roleName in creepsState.byRole) {
    stat[roleName as CreepRole] =
      Object.keys(creepsState.byRole[roleName as CreepRole] ?? {}).length / len;
  }
  return stat;
};

export const getMostNeededRole = ({
  needed,
  actual,
}: { needed: StatByRole; actual: StatByRole }): CreepRole => {
  let maxNeed = 0;
  let role: CreepRole = "harvester";
  for (const roleName in needed) {
    const need = needed[roleName as CreepRole] - actual[roleName as CreepRole];
    if (need > maxNeed) {
      maxNeed = need;
      role = roleName as CreepRole;
    }
  }
  return role;
};
