import { Strategy } from "./types";
import { run as logRoomStart } from "./logr_room_start/mod";
export const run = () => {
  if (Memory.strategy === "logarithmic_resources_room_start") {
    logRoomStart();
  }
};

export const init = <S extends Strategy<any>>(strategy?: S) => {
  Memory.strategy = strategy || "logarithmic_resources_room_start";
};
