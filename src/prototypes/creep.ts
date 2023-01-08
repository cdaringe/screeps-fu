declare global {
  interface Creep {
    cost(parts: BodyPartConstant[]): number;
    msgOfAttackCode(code: CreepActionReturnCode): string;
    msgOfHarvestCode(code: CreepActionReturnCode | ERR_NOT_FOUND | ERR_NOT_ENOUGH_RESOURCES): string;
    msgOfMoveCode(code: CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET): string;
    msgOfTransferCode(code: ScreepsReturnCode): string;
  }
}

const ENERGY_COST_BY_BODY_PART: Record<BodyPartConstant, number> = {
  [ATTACK]: 80,
  [CARRY]: 50,
  [CLAIM]: 600,
  [HEAL]: 250,
  [MOVE]: 50,
  [RANGED_ATTACK]: 150,
  [TOUGH]: 10,
  [WORK]: 100
};

Creep.prototype.cost = function (parts) {
  return 300 + parts.map(f => ENERGY_COST_BY_BODY_PART[f]).sum();
};

function msgOfActionCode(code: CreepActionReturnCode, strict = false) {
  switch (code) {
    case OK:
      return "OK";
    case ERR_NOT_OWNER:
      return "ERR_NOT_OWNER";
    case ERR_BUSY:
      return "ERR_BUSY";
    case ERR_INVALID_TARGET:
      return "ERR_INVALID_TARGET";
    case ERR_NOT_IN_RANGE:
      return "ERR_NOT_IN_RANGE";
    case ERR_NO_BODYPART:
      return "ERR_NO_BODYPART";
    case ERR_TIRED:
      return "ERR_TIRED";
  }
  if (strict) {
    global.nev(code, `code ${code as unknown as any} unhandled`);
  }
}

Creep.prototype.msgOfAttackCode = code => {
  return msgOfActionCode(code, true);
};

Creep.prototype.msgOfMoveCode = code => {
  switch (code) {
    case OK:
      return "OK";
    case ERR_NOT_OWNER:
      return "ERR_NOT_OWNER";
    case ERR_BUSY:
      return "ERR_BUSY";
    case ERR_NO_BODYPART:
      return "ERR_NO_BODYPART";
    case ERR_TIRED:
      return "ERR_TIRED";
    case ERR_NO_PATH:
      return "ERR_NO_PATH";
    case ERR_INVALID_TARGET:
      return "ERR_INVALID_TARGET";
  }
  global.nev(code, `invalid code ${code}`);
};

Creep.prototype.msgOfTransferCode = code => {
  return Game.msgOfCode(code);
};

export {};
