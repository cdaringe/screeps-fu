// common
export type ActionAttack = { kind: 2; data: { target: string } };

// creep
export type ActionCreepMove = { kind: 0; data: { to: [number, number] } | { to: string } };
export type ActionCreepHarvest = { kind: 1; data: { target: string } };
export type ActionCreepAttack = { kind: 2; data: { target: string } };
export type ActionCreepTransfer = { kind: 3; data: { to: string } };

export type CreepAction = ActionCreepMove | ActionCreepHarvest | ActionCreepAttack | ActionCreepTransfer;

// structure
export type StructureAction = ActionAttack;

type CreepId = string;
export type CreepsPlan = Record<CreepId, CreepAction>;
type StructureId = string;
type StructurePlan = Record<StructureId, StructureAction>;
export type Plan = { creeps: CreepsPlan; structures: StructurePlan };

const PlanIO = {
  toJson: (plan: Plan) => {
    const serMap = (x: Plan["creeps"] | Plan["structures"]) =>
      Object.entries(x).map(([name, v]) => [name, v.kind, v.data]);
    return [serMap(plan.creeps), serMap(plan.structures)];
  },
  fromJson: (plan: Record<string, any>): Plan => {
    const deser = (x: any) =>
      x.reduce((acc: any, tup3: any) => {
        const [name, kind, data] = tup3;
        acc[name] = { kind, data };
        return acc;
      }, {});
    return {
      creeps: deser(plan[0]),
      structures: deser(plan[1])
    };
  }
};
