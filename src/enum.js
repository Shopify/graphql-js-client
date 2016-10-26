export class Enum {
  constructor(key) {
    this.key = key;
  }

  toString() {
    return this.key;
  }
}

export default (key) => {
  return new Enum(key);
};
