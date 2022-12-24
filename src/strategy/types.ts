
export type RoomBasedStrategy<S extends Strategy<any>> =  Dictionary<S>

export type Strategy<S extends Strategy<any>> =
  | "full_defense"
  | "full_offense"
  | "logarithmic_resources_room_start"
  | RoomBasedStrategy<S>
