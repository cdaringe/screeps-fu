export const fusite = {
  getById: (id: string): ConstructionSite | undefined =>
    id
      ? (() => {
          const maybeValidStructure = Game.getObjectById(id);
          return fusite.filters.isSite(maybeValidStructure)
            ? maybeValidStructure
            : undefined;
        })()
      : undefined,
  filters: {
    isSite: (s: unknown): s is ConstructionSite =>
      s instanceof ConstructionSite,
  },
};
