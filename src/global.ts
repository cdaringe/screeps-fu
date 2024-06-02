import { Strategy } from "./strategy.types";

declare global {
  type Dictionary<T> = Record<string, T>;

  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    strategy: Strategy<any>;
  }

  interface CreepMemoryCommon {}

  type HarvestorMemory = CreepMemoryCommon & {
    role: "harvester";
    state: "harvesting" | "xfer" | "moving" | "idle";
    targetId?: Id<any>;
  };

  type UpgraderMemory = CreepMemoryCommon & {
    role: "upgrader";
    state: "upgrading" | "moving" | "idle" | "collecting_by_container";
    last?:
      | {
          kind: "targetStructure";
          id: string;
        }
      | {
          kind: "energySource";
          id: string;
        };
  };

  type BuilderMemory = CreepMemoryCommon & {
    role: "builder";
    state: "building" | "moving" | "idle" | "collecting_by_container";
    last?:
      | {
          kind: "targetStructure";
          id: string;
        }
      | {
          kind: "energySource";
          id: string;
        };
  };

  interface CreepMemory {
    plan?: {
      isOverallocatedRole?: boolean;
    };
    current: HarvestorMemory | UpgraderMemory | BuilderMemory;
  }

  type CreepRole = CreepMemory["current"]["role"];
  type CreepMethod = Values<SignatureByMethodName<Creep>>;
  type CreepsByRole = Partial<Record<CreepRole, Dictionary<Creep>>>;

  interface ScreepsFuGlobal {
    // Creep utilities
    bodyPartDouble: (part: BodyPartConstant[]) => BodyPartConstant[];

    // Planning utilities
    creepsByRole: (creeps: Creep[]) => CreepsByRole;
    lastWorkerId: number;
    getNextWorkerId: () => number;

    STRUCTURE_MAPS: {
      ENERGY_CONSUMING: Set<StructureConstant>;
    };
    actions: {
      creep: {
        merge: <S>(...actions: CreepAction<S>[]) => CreepAction<S>;
      };
    };

    // ts resources
    nev: (n: never, msg?: string) => any;
    noop: () => void;
  }

  var fu: ScreepsFuGlobal;

  type CreepActionSingle<State> = {
    state: State;
    method: CreepMethod;
  };
  type CreepActionMany<State> = {
    state: State;
    methods: CreepMethod[];
  };
  type CreepAction<State> = CreepActionSingle<State> | CreepActionMany<State>;

  // utility types
  type AnyFn = (...args: any[]) => any;
  type SignatureByMethodName<D extends Dictionary<any>> = {
    [K in keyof D as D[K] extends AnyFn ? K : never]: [
      methodName: K,
      params: Parameters<D[K]>,
    ];
  };
  type Values<T> = T[keyof T];
}

export {};
