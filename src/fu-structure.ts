export const fustructure = {
  getById: (id: string): AnyStructure | undefined =>
    id
      ? (() => {
          const maybeValidStructure = Game.getObjectById(id);
          return fustructure.filters.isStructure(maybeValidStructure)
            ? maybeValidStructure
            : undefined;
        })()
      : undefined,
  filters: {
    isStructure: (s: unknown): s is AnyStructure => s instanceof Structure,

    structureWithUnfilledEnergy: (s: AnyStructure) =>
      "store" in s &&
      s.store.getCapacity(RESOURCE_ENERGY) &&
      s.isActive() &&
      global.fu.STRUCTURE_MAPS.ENERGY_CONSUMING.has(s.structureType) &&
      s.store[RESOURCE_ENERGY] < s.store.getCapacity(RESOURCE_ENERGY),

    unknownIsStructureWithUnfilledEnergy: (s: unknown): s is AnyStructure =>
      fustructure.filters.isStructure(s) &&
      !!fustructure.filters.structureWithUnfilledEnergy(s as AnyStructure),
  },
};
