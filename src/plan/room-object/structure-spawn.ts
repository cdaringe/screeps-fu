import { StructureAction, process as processStructure } from "./structure";
export type ActionSpawn = { kind: "spawn"; data: { parts: BodyPartConstant[] } };

export type StructureSpawnAction = StructureAction | ActionSpawn;

export const process = (spawn: StructureSpawn, actions: StructureSpawnAction[]) => {
  for (const action of actions) {
    switch (action.kind) {
      case "spawn":
        const r = spawn.spawnCreep(action.data.parts, `w_${global.getNextWorkerId()}`);
        if (r !== OK) {
          console.warn(`failed to spawn: ${Game.msgOfCode(r)}`);
        }
        break;
      default:
        const handled = processStructure(spawn, action);
        if (handled) {
          break;
        } else {
          global.nev(action.kind as unknown as never, `unhandled spawn kind ${action.kind}`);
        }
    }
  }
};
