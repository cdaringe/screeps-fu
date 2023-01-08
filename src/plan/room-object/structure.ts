/**
 * https://docs.screeps.com/api/#Structure
 */
export type ActionDestroyStructure = { kind: "destroy_structure_self"; data: null };
export type StructureAction = ActionDestroyStructure;

export const process = (structure: Structure, action: StructureAction) => {
  switch (action.kind) {
    case "destroy_structure_self":
      const r = structure.destroy();
      if (r !== OK) {
        console.warn(`failed to destroy structure: ${structure.msgOfCode(r)}`);
      }
      return true;
  }
  return true;
};
