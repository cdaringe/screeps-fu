export function bind() {
  global.nev = (_: never) => {};
  global.creepsByType = cs =>
    cs.reduce((acc, creep) => {
      creep.body.forEach(({ type }) => {
        const creeps: Creep[] =
          acc.get(type) ||
          (() => {
            acc.set(type, []);
            return acc.get(type)!;
          })();
        creeps.push(creep);
      });
      return acc;
    }, new Map());
}
