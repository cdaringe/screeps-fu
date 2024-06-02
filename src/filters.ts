export const creepCurrentRoom = (room: Room) => (c: Creep) =>
  c.room.name === room.name;

export const sourceHasEnergy = (s: Source) => s.energy > 0;
