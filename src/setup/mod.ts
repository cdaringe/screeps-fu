import { init as initStrategy, run } from "../strategy/mod";

export function setup () {
    initStrategy()
    global.lastWorkerId = 0
    global.getNextWorkerId = function getNextWorkerId() {
     ++global.lastWorkerId;
     return global.lastWorkerId
    }
    resetMemory()
    global.nev = (p: never) => {}
    global.creepsByType = (cs) => cs.reduce((acc, creep) => {
        creep.body.forEach(({type}) => {
          const creeps: Creep[] = acc.get(type) || (() => { acc.set(type, []); return acc.get(type)! })();
          creeps.push(creep)
        })
        return acc
      }, new Map())
}

function maybeUpdateLastWorkerId(name: string) {
  const [_,idString] = name.match(/(\d+)$/) || [];
    if (idString) {
      const id = parseInt(idString, 10);
      global.lastWorkerId = Math.max(id, global.lastWorkerId)
    }
  }

function resetMemory() {
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
      maybeUpdateLastWorkerId(name)
    }
  }
