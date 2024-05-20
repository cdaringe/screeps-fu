import { setup } from "./setup.mod";
import { ErrorMapper } from "utils.ErrorMapper";
import type {} from "./global";
import { run } from "./strategy.log_room_start.mod";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export = {
  loop: ErrorMapper.wrapLoop(() => {
    console.log(`tick: ${Game.time}`);
    setup();
    run();
  }),
};
