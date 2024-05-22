export const nearestPosition = <T extends { pos: RoomPosition }>(
  a: T,
  b: T,
) => {
  return a.pos.getRangeTo(a.pos) - b.pos.getRangeTo(a.pos);
};
