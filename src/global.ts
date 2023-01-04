import { Strategy } from "strategy/types";
import { CreepAction, Plan } from "./plan/mod";
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

  interface CreepMemory {
    plan?: CreepAction;
    role: string;
    room: string;
    working: boolean;
    destId?: string;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      creepsByType: (creeps: Creep[]) => Map<BodyPartConstant, Creep[]>;
      lastWorkerId: number;
      getNextWorkerId: () => number;
      nev: (n: never) => void;
      plan: Plan;
    }
  }
}

export {};
