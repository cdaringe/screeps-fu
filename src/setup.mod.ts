import { init as initStrategy, run } from "./strategy";

const SYMBOL_ACT = Symbol("act") as CreepActionTag;

export function setup() {
  initStrategy();

  global.fu = {
    act: (code, ok, notOk) => {
      const res = code === OK ? ok() : notOk(code);
      if (res && res !== SYMBOL_ACT) {
        throw new Error(`act: ${String(res)}`);
      }
      return SYMBOL_ACT;
    },
    actions: {
      creep: {
        merge: <S>(...actions: CreepAction<S>[]) => {
          const [hd, ...rest] = actions;
          if (!hd) {
            throw new Error("no actions to merge");
          }
          return rest.reduce<CreepActionMany<S>>(
            (acc, it) => {
              return {
                state: it.state,
                methods: acc.methods.concat(
                  "method" in it ? it.method : it.methods,
                ),
              } satisfies CreepActionMany<S>;
            },
            "methods" in hd
              ? hd
              : ({
                  state: hd.state,
                  methods: [hd.method],
                } as CreepActionMany<S>),
          );
        },
        retryOnceElse: (creep, once, elseFn) => {
          // allow exactly one attempt at retrying a role assignment to the creep.
          // use some js magic to make this property non-enumerable s.t.
          // it never gets serialized to memory
          if (!("retryAssignment" in creep.memory)) {
            Object.defineProperty(creep.memory, "retryAssignment", {
              value: true,
              enumerable: false,
            });
            return once();
          }
          return elseFn();
        },
      },
    },
    lastWorkerId: 0,
    getNextWorkerId() {
      ++global.fu.lastWorkerId;
      return global.fu.lastWorkerId;
    },

    /**
     * @warn it's ugly, but it's fast
     */
    creepsByRole(creeps) {
      const byType: Partial<Record<CreepRole, Dictionary<Creep>>> = {};
      for (const i in creeps) {
        const creep = creeps[i]!;
        const type = (creep.memory as CreepRoleMemory).role;
        if (!type) {
          throw new Error(`creep ${creep.name} has no role`);
        }
        const roleCreepsById = byType[type] ?? {};
        roleCreepsById[creep.name] = creep;
        byType[type] = roleCreepsById;
      }
      return byType;
    },

    bodyPartDouble(parts) {
      const plen = parts.length;
      const double = plen * 2;
      for (let i = 0; i < double; i++) {
        if (parts.length >= 50) {
          return parts;
        }
        parts.push(parts[i % plen]!);
      }
      return parts;
    },

    STRUCTURE_MAPS: {
      ENERGY_CONSUMING: new Set([
        STRUCTURE_SPAWN,
        STRUCTURE_EXTENSION,
        STRUCTURE_TOWER,
        STRUCTURE_LINK,
        STRUCTURE_LAB,
        STRUCTURE_POWER_SPAWN,
        STRUCTURE_NUKER,
        STRUCTURE_FACTORY,
        STRUCTURE_STORAGE,
        STRUCTURE_TERMINAL,
      ]),
    },

    nev: (_: never, msg?: string) => {
      throw new Error(msg ?? "unreachable");
    },
    noop: () => {},
    set(ref, key, next) {
      ref[key] = next;
    },
  };
  resetMemory();
}

function maybeUpdateLastWorkerId(name: string) {
  const [_, idString] = name.match(/(\d+)$/) || [];
  if (idString) {
    const id = Number(idString);
    global.fu.lastWorkerId = Math.max(id, global.fu.lastWorkerId);
  }
}

function resetMemory() {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
    maybeUpdateLastWorkerId(name);
  }
}
