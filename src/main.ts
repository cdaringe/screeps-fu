import { setup } from "./setup.mod";
import type {} from "./global";
import { run } from "./strategy";

setup();

export function loop() {
  run();
}
