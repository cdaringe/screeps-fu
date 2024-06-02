export const fucreep = {
  getFreeEnergyStorage: (creep: Creep): number => {
    const total = creep.store.getCapacity();
    const used = creep.store.getUsedCapacity();
    const freeEnergyStorage = total - used;
    return freeEnergyStorage;
  },
};
