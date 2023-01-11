// screeps does something evil w/ console.
const consoleRef = console;
process.env.DRIVER_MODULE = "@screeps/driver";
// https://github.com/screeps/engine/blob/78d980e50821ea9956d940408b733c44fc9d94ed/src/game/game.js#L443
var engine = require("@screeps/engine");
engine.game.init(
  global,
  {},
  {
    accessibleRooms: "[]",
    flags: [],
    staticTerrainData: { a: [] },
    user: { _id: 1 }
  },
  /* intents */ {},
  /* memory */ {}
);

// restore console
console = consoleRef;
