export type ActionCreepMove = { kind: "move"; data: { to: [number, number] } };
export type ActionCreepHarvest = { kind: "harvest"; data: { target: string } };
export type ActionCreepAttack = { kind: "attack"; data: { target: string } };
export type ActionCreepTransfer = { kind: "transfer"; data: { to: string; resource: ResourceConstant } };

export type CreepAction = ActionCreepMove | ActionCreepHarvest | ActionCreepAttack | ActionCreepTransfer;

export const process = (creep: Creep, actions: CreepAction[]) => {
  for (const action of actions) {
    switch (action.kind) {
      case "attack": {
        const r = creep.attack(Game.getObjectById(action.data.target as Id<Creep>)!);
        if (r != OK) {
          console.warn(`attack failed (${creep.id} => ${action.data.target}): ${creep.msgOfAttackCode(r)}`);
        }
        break;
      }
      case "harvest": {
        const r = creep.harvest(Game.getObjectById(action.data.target as Id<Source>)!);
        if (r != OK) {
          console.warn(`harvest failed (${creep.id} => ${action.data.target}): ${creep.msgOfHarvestCode(r)}`);
        }
        break;
      }
      case "move": {
        const [x, y] = action.data.to;
        const r = creep.moveTo(x, y);
        if (r != OK) {
          console.warn(`move failed (${creep.id} => ${JSON.stringify(action.data.to)}): ${creep.msgOfMoveCode(r)}`);
        }
        break;
      }
      case "transfer":
        const r = creep.transfer(Game.getObjectById(action.data.to as Id<any>)!, action.data.resource);
        if (r != OK) {
          console.warn(
            `transfer failed (${creep.id} => ${JSON.stringify(action.data.to)}): ${creep.msgOfTransferCode(r)}`
          );
        }
        break;
      default:
        break;
    }
  }
};
