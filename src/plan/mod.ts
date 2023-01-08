import * as creep from "./room-object/creep";
export * as creep from "./room-object/creep";

import * as structure from "./room-object/structure";
export * as structure from "./room-object/structure";

import * as structureSpawn from "./room-object/structure-spawn";
export * as structureSpawn from "./room-object/structure-spawn";

import type { EntityPlanner } from "./common";
import { PlanMap } from "./plan-map";

// kinds
export const CREEP_KIND = "creep";
export const STRUCTURE_SPAWN_KIND = "structure_spawn";

// common
export type ActionAttack = { kind: 2; data: { target: string } };

export type CreepPlan = EntityPlanner<typeof CREEP_KIND, Creep, creep.CreepAction>;
export type StructureSpawnPlan = EntityPlanner<
  typeof STRUCTURE_SPAWN_KIND,
  StructureSpawn,
  structure.StructureAction | structureSpawn.StructureSpawnAction
>;
type EntityPlan = CreepPlan | StructureSpawnPlan;
export type Plan = PlanMap<string, EntityPlan>;

// const PlanIO = {
//   toJson: (plan: Plan) => {
//     const serMap = (x: Plan["creeps"] | Plan["structures"]) =>
//       Object.entries(x).map(([name, v]) => [name, v.kind, v.data]);
//     return [serMap(plan.creeps), serMap(plan.structures)];
//   },
//   fromJson: (plan: Record<string, any>): Plan => {
//     const deser = (x: any) =>
//       x.reduce((acc: any, tup3: any) => {
//         const [name, kind, data] = tup3;
//         acc[name] = { kind, data };
//         return acc;
//       }, {});
//     return {
//       creeps: deser(plan[0]),
//       structures: deser(plan[1])
//     };
//   }
// };
