declare global {
  interface Array<T> {
    sum(): number;
  }
}
Array.prototype.sum = function () {
  return this.reduce((total, x) => total + x, 0);
};

export {};
