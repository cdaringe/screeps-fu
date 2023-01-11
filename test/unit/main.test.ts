import test, { TestFn } from "ava";
import { loop } from "../../src/main";
import { Game, Memory } from "./mock";
import {} from "cdaringe-screeps-server-mockup";
// console.log("what")
// process.exit(1)

// test.beforeEach(() => {
//   // runs before each test in this block
//   // @ts-ignore : allow adding Game to global
//   global.Game = _.clone(Game);
//   // @ts-ignore : allow adding Memory to global
//   global.Memory = _.clone(Memory);
// });

test("should export a loop function", t => {
  t.true(typeof loop === "function");
});

// test("should return void when called with no context", t => {
//   t.is(loop(), undefined);
// });

// test("Automatically delete memory of missing creeps", t => {
//   Memory.creeps.persistValue = "any value";
//   Memory.creeps.notPersistValue = "any value";

//   Game.creeps.persistValue = "any value";

//   loop();

//   t.truthy(Memory.creeps.persistValue);
//   t.is(Memory.creeps.notPersistValue, undefined);
// });
