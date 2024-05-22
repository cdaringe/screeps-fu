export const creepCurrentRoom = (room: Room) => (c: Creep) =>
  c.room.name === room.name;

export const structureWithUnfilledEnergy = (s: AnyStructure) =>
  s.isActive() &&
  STRUCTURE_MAPS.ENERGY_CONSUMING.has(s.structureType) &&
  "store" in s &&
  s.store.getCapacity(RESOURCE_ENERGY) &&
  s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY);

export const sourceHasEnergy = (s: Source) => s.energy > 0;
