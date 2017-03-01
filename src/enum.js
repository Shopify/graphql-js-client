export class Enum {
  constructor(key) {
    this.key = key;
  }

  toString() {
    return this.key;
  }

  valueOf() {
    return this.key.valueOf();
  }
}

export default (key) => {
  return new Enum(key);
};
