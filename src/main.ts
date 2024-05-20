import { setup } from "./setup.mod";
import type {} from "./global";
import { run } from "./strategy.log_room_start.mod";

setup();

export function loop() {
  run();
}
