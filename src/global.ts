import { Strategy } from "./strategy.types";

declare global {
  type Dictionary<T> = Record<string, T>;
  /*
      Example types, expand on these or remove them and add your own.
      Note: Values, properties defined here do no fully *exist* by this type definiton alone.
            You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

      Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
      Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
    */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    strategy: Strategy<any>;
  }

  // interface RoomMemory {
  //   spawningNames: Dictionary<boolean>
  // }

  interface CreepMemoryCommon {
    room: string;
    working: boolean;
    destId?: string;
    isOverallocatedRole?: boolean;
  }

  type HarvestorMemory = CreepMemoryCommon & {
    role: "harvester";
    target?: Structure;
  };

  type UpgraderMemory = CreepMemoryCommon & {
    role: "upgrader";
    target?: Structure;
  };

  type BuilderMemory = CreepMemoryCommon & {
    role: "builder";
    target?: Structure;
  };

  interface CreepMemory {
    current: HarvestorMemory | UpgraderMemory | BuilderMemory;
  }

  type CreepRole = CreepMemory["current"]["role"];

  type CreepsByRole = Partial<Record<CreepRole, Record<string, Creep>>>;

  var creepsByRole: (creeps: Creep[]) => CreepsByRole;
  var lastWorkerId: number;
  var getNextWorkerId: () => number;
  var nev: (n: never) => void;
  var STRUCTURE_MAPS: {
    ENERGY_CONSUMING: Set<StructureConstant>;
  };
}

export {};
