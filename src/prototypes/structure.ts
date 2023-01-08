declare global {
  interface Structure {
    msgOfCode(code: ScreepsReturnCode): string;
  }
}

Structure.prototype.msgOfCode = Game.msgOfCode;

export {};
