import type { EntityPlanner } from "./common";
type ArrT<T> = T extends Array<infer U> ? U : never;

export class PlanMap<K, V extends EntityPlanner<any, any, any>> extends Map<K, V> {
  add(k: K, entity: V["entity"], kind: V["kind"], action: ArrT<V["data"]>) {
    const existing =
      this.get(k) ||
      ({
        entity,
        kind,
        data: [] as V["data"]
      } as V);
    existing.data.push(action);
    this.set(k, existing);
    return this;
  }
}
